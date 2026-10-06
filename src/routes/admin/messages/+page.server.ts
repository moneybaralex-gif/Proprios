// src/routes/admin/messages/+page.server.ts
import { prisma } from '$lib/server/prisma';
import { auth } from "$lib/server/auth";
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad, Actions } from './$types';

async function publishRealtime(event: { type: string; conversationId: string; payload: unknown; }) {
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

export const load: PageServerLoad = async ({ parent }) => {
	const { user: currentUser } = await parent();

	const loadData = async () => {
		return await prisma.conversation.findMany({
			orderBy: { lastMessageAt: 'desc' },
			include: {
				user: {
					select: {
						id: true,
						name: true,
						image: true,
						certified: true,
						telephone: true,
						plots: true
					}
				},
				messages: { orderBy: { createdAt: 'asc' } }
			}
		});
	};

	return { currentUser, streamed: { conversations: loadData() } };
};

export const actions: Actions = {
	assignConversation: async ({ request }) => {
		const formData = await request.formData();
		const conversationId = formData.get('conversationId')?.toString();
		const session = await auth.api.getSession({ headers: request.headers });

		if (!conversationId || !session) return fail(400, { message: 'Requête invalide' });

		await prisma.conversation.update({
			where: { id: conversationId },
			data: { assignedToId: session.user.id, status: 'IN_PROGRESS' }
		});

		return { success: true };
	},

	markAsRead: async ({ request }) => {
		const formData = await request.formData();
		const conversationId = formData.get('conversationId')?.toString();
		if (!conversationId) return fail(400, { message: 'ID manquant' });

		await prisma.conversation.update({
			where: { id: conversationId },
			data: { unreadAdminCount: 0 }
		});
		return { success: true };
	},

	sendAdminMessage: async ({ request }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) return fail(401, { error: 'Non autorisé' });

		const data = await request.formData();
		const content = data.get('content')?.toString();
		const conversationId = data.get('conversationId')?.toString();
		const isInternal = data.get('isInternal') === 'true';
		const plotId = data.get('plotId')?.toString() || null;

		if (!content || !conversationId) return fail(400, { error: 'Données manquantes' });

		const message = await prisma.message.create({
			data: {
				content,
				conversationId,
				senderId: session.user.id,
				type: isInternal ? 'INTERNAL_NOTE' : 'TEXT',
				plotId
			}
		});

		await prisma.conversation.update({
			where: { id: conversationId },
			data: { 
				lastMessageAt: new Date(),
				unreadAdminCount: 0,
				unreadUserCount: isInternal ? undefined : { increment: 1 }
			}
		});

		if (!isInternal) {
			await publishRealtime({
				type: 'message.created',
				conversationId,
				payload: message
			});
		}

		return { success: true, message };
	}
};