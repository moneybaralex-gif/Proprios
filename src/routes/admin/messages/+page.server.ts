// src/routes/admin/messages/+page.server.ts
import { prisma } from '$lib/server/prisma';
import { auth } from "$lib/server/auth";
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
    const { user: currentUser } = await parent();

    // Récupérer toutes les conversations avec les infos du client et le dernier message
    const conversations = await prisma.conversation.findMany({
        orderBy: { lastMessageAt: 'desc' },
        include: {
            user: {
                select: { id: true, name: true, image: true, certified: true, telephone: true, plots: true }
            },
            messages: {
                take: 1,
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    return {
        currentUser,
        conversations
    };
};

export const actions: Actions = {
    // Action pour qu'un employé/admin prenne en charge un dossier
    assignConversation: async ({ request }) => {
        const formData = await request.formData();
        const conversationId = formData.get('conversationId')?.toString();
          const session = await auth.api.getSession();

        if (!conversationId || !session) {
            return fail(400, { message: 'Requête invalide' });
        }

        await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                assignedToId: session.user.id,
                status: 'IN_PROGRESS'
            }
        });

        // Optionnel : Créer un message système "Dossier pris en charge par X"
        await prisma.message.create({
            data: {
                conversationId,
                senderId: session.user.id,
                type: 'SYSTEM',
                content: `Le dossier a été pris en charge par ${session.user.name}.`
            }
        });

        return { success: true };
    }
};