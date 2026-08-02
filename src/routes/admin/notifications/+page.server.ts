// src/routes/admin/notifications/+page.server.ts
import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async ({ parent }) => {
    const { user: currentUser } = await parent();

    // 1. Récupérer les 50 dernières notifications envoyées pour l'historique
    const recentNotifications = await prisma.notification.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { id: true, name: true, image: true, type: true }
            }
        }
    });

    // 2. Récupérer la liste des utilisateurs (pour le menu déroulant cible spécifique)
    // On ne prend que l'essentiel pour ne pas surcharger la mémoire
    const usersList = await prisma.user.findMany({
        select: { id: true, name: true, email: true, type: true },
        orderBy: { name: 'asc' }
    });

    // 3. Obtenir le nombre total d'utilisateurs pour l'affichage (Stats)
    const totalUsers = await prisma.user.count();

    return {
        currentUser,
        recentNotifications,
        usersList,
        totalUsers
    };
};

export const actions: Actions = {
    sendNotification: async ({ request }) => {
        const session = await auth.api.getSession();
        if (!session) return fail(401, { message: 'Non autorisé' });

        const formData = await request.formData();
        const title = formData.get('title')?.toString();
        const content = formData.get('content')?.toString();
        const targetType = formData.get('targetType')?.toString(); // 'ALL' ou 'SPECIFIC'
        const userId = formData.get('userId')?.toString();

        // Validation de base
        if (!title || !content || !targetType) {
            return fail(400, { message: 'Veuillez remplir tous les champs obligatoires.' });
        }

        try {
            if (targetType === 'ALL') {
                // DIFFUSION DE MASSE (À tous les utilisateurs)
                // 1. Récupérer tous les IDs
                const allUsers = await prisma.user.findMany({ select: { id: true } });
                
                // 2. Préparer le tableau pour createMany (Très performant)
                const notificationsData = allUsers.map(u => ({
                    userId: u.id,
                    title,
                    content,
                    isRead: false
                }));

                await prisma.notification.createMany({
                    data: notificationsData,
                    skipDuplicates: true
                });

                return { success: true, message: `Notification envoyée à ${allUsers.length} utilisateurs !` };

            } else if (targetType === 'SPECIFIC') {
                // ENVOI CIBLÉ (À un utilisateur précis)
                if (!userId) return fail(400, { message: 'Veuillez sélectionner un utilisateur cible.' });

                await prisma.notification.create({
                    data: {
                        userId,
                        title,
                        content,
                        isRead: false
                    }
                });

                return { success: true, message: 'Notification envoyée avec succès au client.' };
            } else {
                return fail(400, { message: 'Type de cible invalide.' });
            }
        } catch (error) {
            console.error("Erreur lors de l'envoi de la notification:", error);
            return fail(500, { message: 'Erreur interne du serveur lors de l\'envoi.' });
        }
    }
};