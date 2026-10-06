// server/ws.ts
import 'dotenv/config';
import pg from 'pg';
import type { ServerWebSocket } from 'bun';

const PORT = Number(process.env.WS_PORT ?? 3001);
const SECRET = process.env.REALTIME_SECRET ?? '';
const DATABASE_URL = process.env.DATABASE_URL ?? '';

if (!DATABASE_URL) {
	throw new Error('DATABASE_URL est manquant dans les variables d\'environnement.');
}

const pool = new pg.Pool({
	connectionString: DATABASE_URL,
	max: 10
});

interface WebSocketData {
	userId: string;
	role: string | null;
}

type WSMessage =
	| {
			type: 'typing';
			conversationId: string;
			isTyping: boolean;
	  }
	| {
			type: 'subscribe';
			conversationId: string;
	  }
	| {
			type: 'unsubscribe';
			conversationId: string;
	  };

/**
 * 1. Extraction du cookie brut depuis les en-têtes HTTP
 */
function getRawCookie(cookieHeader: string, possibleNames: string[]): string | null {
	const cookies = cookieHeader
		.split(';')
		.map((value) => value.trim())
		.filter(Boolean);

	for (const cookie of cookies) {
		const separator = cookie.indexOf('=');
		if (separator === -1) continue;

		const name = cookie.slice(0, separator).trim();
		const value = cookie.slice(separator + 1).trim();

		if (possibleNames.includes(name)) {
			return decodeURIComponent(value);
		}
	}

	return null;
}

/**
 * 2. Extraction du token de session Better-Auth
 * Gère les cookies signés (format "TOKEN.SIGNATURE") et supprime les préfixes éventuels.
 */
function extractSessionToken(cookieHeader: string): string | null {
	const rawCookie = getRawCookie(cookieHeader, [
		'better-auth.session_token',
		'__Secure-better-auth.session_token',
		'session_token'
	]);

	if (!rawCookie) return null;

	// Nettoyage d'un éventuel préfixe "s:" parfois injecté par des parsers de cookies
	const cleanCookie = rawCookie.startsWith('s:') ? rawCookie.slice(2) : rawCookie;

	// Dans Better-Auth, un cookie signé est sous la forme `token.signature`.
	// On extrait uniquement la première partie qui correspond au token en base de données.
	const token = cleanCookie.split('.')[0];

	return token || null;
}

/**
 * 3. Récupération de l'utilisateur et de son rôle depuis la session PostgreSQL
 */
async function getUserFromSession(req: Request): Promise<{ userId: string; role: string | null } | null> {
	const cookieHeader = req.headers.get('cookie') ?? '';
	const token = extractSessionToken(cookieHeader);

	if (!token) {
		return null;
	}

	try {
		const result = await pool.query<{ userId: string; role: string | null }>(
			`
			SELECT s."userId", u."role"
			FROM "sessions" s
			INNER JOIN "users" u ON u."id" = s."userId"
			WHERE s."token" = $1
			  AND s."expiresAt" > NOW()
			LIMIT 1
			`,
			[token]
		);

		return result.rows[0] ?? null;
	} catch (error) {
		console.error('Erreur DB session:', error);
		return null;
	}
}

/**
 * 4. Vérification d'accès à une conversation
 * - Les admins et employés ont accès à tout
 * - Un client n'a accès qu'à sa propre conversation
 */
async function canAccessConversation(
	userId: string,
	role: string | null,
	conversationId: string
): Promise<boolean> {
	if (role === 'admin' || role === 'employee') {
		return true;
	}

	try {
		const result = await pool.query(
			`
			SELECT 1
			FROM "conversations"
			WHERE "id" = $1
			  AND "user_id" = $2
			LIMIT 1
			`,
			[conversationId, userId]
		);

		return (result.rowCount ?? 0) > 0;
	} catch (error) {
		console.error(`Erreur vérification conversation ${conversationId}:`, error);
		return false;
	}
}

const server = Bun.serve<WebSocketData>({
	port: PORT,

	async fetch(req, server) {
		const url = new URL(req.url);

		/**
		 * Health Check
		 */
		if (url.pathname === '/health') {
			return Response.json({ ok: true });
		}

		/**
		 * Endpoint HTTP de publication appelé par SvelteKit (+page.server.ts)
		 */
		if (url.pathname === '/publish' && req.method === 'POST') {
			if (SECRET && req.headers.get('x-realtime-secret') !== SECRET) {
				return new Response('Forbidden', { status: 403 });
			}

			try {
				const event = await req.json();

				if (event.conversationId) {
					// Diffuse au salon spécifique de la conversation
					server.publish(`chat:${event.conversationId}`, JSON.stringify(event));

					// Diffuse également à tous les administrateurs connectés (pour actualiser leur sidebar)
					server.publish('admin:conversations', JSON.stringify(event));
				}

				if (event.targetUserId) {
					// Diffuse sur le canal personnel d'un utilisateur cible
					server.publish(`user:${event.targetUserId}`, JSON.stringify(event));
				}

				return Response.json({ ok: true });
			} catch (error) {
				console.error('Erreur publication realtime:', error);
				return Response.json({ ok: false, error: 'Invalid event' }, { status: 400 });
			}
		}

		/**
		 * Route WebSocket
		 */
		if (url.pathname !== '/ws') {
			return new Response('Not found', { status: 404 });
		}

		// Authentification de la connexion WebSocket
		const authUser = await getUserFromSession(req);

		if (!authUser) {
			return new Response('Unauthorized', { status: 401 });
		}

		// Upgrade HTTP vers WebSocket en attachant les métadonnées de l'utilisateur
		const upgraded = server.upgrade(req, {
			data: {
				userId: authUser.userId,
				role: authUser.role
			}
		});

		if (!upgraded) {
			return new Response('Upgrade failed', { status: 400 });
		}

		return undefined;
	},

	websocket: {
		open(ws: ServerWebSocket<WebSocketData>) {
			// Canal privé de l'utilisateur
			ws.subscribe(`user:${ws.data.userId}`);

			// Si l'utilisateur est un admin ou un employé, on l'abonne automatiquement au flux global des conversations
			if (ws.data.role === 'admin' || ws.data.role === 'employee') {
				ws.subscribe('admin:conversations');
			}

			ws.send(
				JSON.stringify({
					type: 'connected',
					userId: ws.data.userId
				})
			);
		},

		async message(ws: ServerWebSocket<WebSocketData>, rawMessage: string) {
			try {
				const event = JSON.parse(rawMessage) as WSMessage;

				/**
				 * Souscription à une conversation spécifique
				 */
				if (event.type === 'subscribe' && event.conversationId) {
					const allowed = await canAccessConversation(
						ws.data.userId,
						ws.data.role,
						event.conversationId
					);

					if (!allowed) {
						ws.send(
							JSON.stringify({
								type: 'error',
								code: 'FORBIDDEN_CONVERSATION'
							})
						);
						return;
					}

					ws.subscribe(`chat:${event.conversationId}`);
					ws.send(
						JSON.stringify({
							type: 'subscribed',
							conversationId: event.conversationId
						})
					);
					return;
				}

				/**
				 * Désabonnement d'une conversation
				 */
				if (event.type === 'unsubscribe' && event.conversationId) {
					ws.unsubscribe(`chat:${event.conversationId}`);
					return;
				}

				/**
				 * Indicateur de frappe ("en train d'écrire...")
				 */
				if (event.type === 'typing' && event.conversationId) {
					const allowed = await canAccessConversation(
						ws.data.userId,
						ws.data.role,
						event.conversationId
					);

					if (!allowed) return;

					server.publish(
						`chat:${event.conversationId}`,
						JSON.stringify({
							type: 'typing',
							conversationId: event.conversationId,
							userId: ws.data.userId,
							isTyping: Boolean(event.isTyping)
						})
					);
				}
			} catch (error) {
				console.error('Invalid WebSocket message:', error);
				ws.send(
					JSON.stringify({
						type: 'error',
						code: 'INVALID_MESSAGE'
					})
				);
			}
		},

		close() {
			// Bun nettoie automatiquement les souscriptions lors de la déconnexion
		}
	}
});

console.log(`🚀 Proprios WebSocket Server listening on :${server.port}`);