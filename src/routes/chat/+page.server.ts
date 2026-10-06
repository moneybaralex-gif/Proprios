import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Actions, PageServerLoad } from './$types';

const MAX_INITIAL_MESSAGES = 100;
const EDIT_WINDOW_MS = 60 * 60 * 1000;

async function publishRealtime(event: { type: string; conversationId: string; payload: unknown }) {
	const realtimeUrl = env.REALTIME_URL ?? 'http://localhost:3001';
	const realtimeSecret = env.REALTIME_SECRET ?? '';

	try {
		const response = await fetch(`${realtimeUrl}/publish`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-realtime-secret': realtimeSecret
			},
			body: JSON.stringify(event)
		});
		if (!response.ok) {
			console.error(`Realtime publish failed: ${response.status}`);
		}
	} catch (error) {
		console.error('Erreur publication WebSocket:', error);
	}
}

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user) return { currentUserId: null, streamed: { chatData: Promise.resolve(null) } };

	const loadData = async () => {
		let conversation = await prisma.conversation.findFirst({
			where: { userId: user.id },
			include: {
				messages: {
					where: { type: { not: 'INTERNAL_NOTE' } },
					orderBy: { createdAt: 'desc' },
					take: MAX_INITIAL_MESSAGES
				}
			}
		});

		if (!conversation) {
			conversation = await prisma.conversation.create({
				data: { userId: user.id, status: 'UNASSIGNED' },
				include: { messages: true }
			});
		}

		const messages = [...conversation.messages].reverse();
		return {
			messages,
			conversation,
			hasMoreMessages: conversation.messages.length === MAX_INITIAL_MESSAGES
		};
	};

	return { currentUserId: user.id, streamed: { chatData: loadData() } };
};

export const actions: Actions = {
	send: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { error: 'Non autorisé' });
		const data = await request.formData();
		const content = data.get('content')?.toString().trim();
		const conversationId = data.get('conversationId')?.toString();
		const plotId = data.get('plotId')?.toString() || null;

		if (!content || !conversationId) return fail(400, { error: 'Données manquantes' });

		const conversation = await prisma.conversation.findFirst({
			where: { id: conversationId, userId: user.id },
			select: { id: true }
		});
		if (!conversation) return fail(403, { error: 'Conversation inaccessible' });

		const message = await prisma.message.create({
			data: { content, conversationId, senderId: user.id, type: 'TEXT', plotId }
		});

		await prisma.conversation.update({
			where: { id: conversationId },
			data: { lastMessageAt: message.createdAt, unreadAdminCount: { increment: 1 } }
		});

		await publishRealtime({ type: 'message.created', conversationId, payload: message });

		return { success: true, message };
	},

	edit: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { error: 'Non autorisé' });
		const data = await request.formData();
		const messageId = data.get('messageId')?.toString();
		const content = data.get('content')?.toString().trim();
		const conversationId = data.get('conversationId')?.toString();
		if (!messageId || !content || !conversationId)
			return fail(400, { error: 'Données manquantes' });

		const existingMessage = await prisma.message.findFirst({
			where: { id: messageId, conversationId, senderId: user.id, type: 'TEXT' }
		});
		if (!existingMessage) return fail(404, { error: 'Message introuvable ou inaccessible' });
		const age = Date.now() - new Date(existingMessage.createdAt).getTime();
		if (age > EDIT_WINDOW_MS) return fail(403, { error: 'Ce message ne peut plus être modifié' });

		const message = await prisma.message.update({ where: { id: messageId }, data: { content } });
		await publishRealtime({ type: 'message.updated', conversationId, payload: message });
		return { success: true, message };
	}
};