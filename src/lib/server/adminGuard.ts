// filepath: src/lib/server/adminGuard.ts
import { fail } from '@sveltejs/kit';
import type { ActionFailure } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';

export interface AdminGuardSuccess {
	authorized: true;
	userId: string;
}

export interface AdminGuardFailure {
	authorized: false;
	response: ActionFailure<{ message: string }>;
}

export type AdminGuardResult = AdminGuardSuccess | AdminGuardFailure;

/**
 * Vérifie qu'une requête provient d'un administrateur authentifié.
 *
 * Important : les load() de layout SvelteKit ne s'exécutent PAS pour les
 * requêtes POST/actions. La protection doit donc être refaite ici, côté
 * serveur, dans CHAQUE action admin.
 *
 * Critère d'administration : `role === 'admin'` sur l'utilisateur.
 * Si ta base utilise un autre marqueur (ex: `type === 'EMPLOYEE'`),
 * modifie uniquement la condition ci-dessous.
 */
export async function requireAdmin(request: Request): Promise<AdminGuardResult> {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		return {
			authorized: false,
			response: fail(401, { message: 'Non autorisé' })
		};
	}

	const user = session.user as {
		id: string;
		email?: string;
		role?: string | null;
	};

	if (user.role !== 'admin') {
		return {
			authorized: false,
			response: fail(403, { message: 'Accès réservé aux administrateurs.' })
		};
	}

	return { authorized: true, userId: user.id };
}