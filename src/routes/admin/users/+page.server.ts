// src/routes/admin/users/+page.server.ts
import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { auth } from '$lib/server/auth';
import type { UserIDType, UserType } from '$lib/server/generated/prisma/enums';

export const load: PageServerLoad = async ({ parent }) => {
    const { user: currentUser } = await parent();

    // On récupère tous les utilisateurs avec le nombre de leurs parcelles
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { plots: true, visits: true }
            }
        }
    });

    return {
        currentUser,
        users
    };
};

export const actions: Actions = {
    // 1. Mise à jour du profil général (Accessible par Admin et Employé)
    updateProfile: async ({ request }) => {
         const session = await auth.api.getSession()
        if (!session) return fail(401, { message: 'Non autorisé' });

        const formData = await request.formData();
        const userId = formData.get('userId')?.toString();
        
        if (!userId) return fail(400, { message: 'ID utilisateur manquant' });

        try {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    name: formData.get('name')?.toString() || undefined,
                    email: formData.get('email')?.toString() || undefined,
                    telephone: formData.get('telephone')?.toString() || null,
                    cardID: formData.get('cardID')?.toString() || null,
                    typeID: (formData.get('typeID')?.toString() as UserIDType) || null,
                }
            });
            return { success: true, action: 'updateProfile' };
        } catch (error) {
            console.error(error);
            return fail(500, { message: 'Erreur lors de la mise à jour' });
        }
    },

    // 2. Mise à jour des Accès & Rôles (Réservé aux Admins)
    updateAccess: async ({ request }) => {
         const session = await auth.api.getSession()
        if (!session || session.user.role !== 'admin') {
            return fail(403, { message: 'Seul un administrateur peut modifier les rôles' });
        }

        const formData = await request.formData();
        const userId = formData.get('userId')?.toString();
        const role = formData.get('role')?.toString();
        const type = formData.get('type')?.toString() as UserType;

        if (!userId || !role || !type) return fail(400, { message: 'Données manquantes' });

        await prisma.user.update({
            where: { id: userId },
            data: { role, type }
        });

        return { success: true, action: 'updateAccess' };
    },

    // 3. Bannir / Débannir un utilisateur
    toggleBan: async ({ request }) => {
         const session = await auth.api.getSession()
        if (!session) return fail(401, { message: 'Non autorisé' });

        const formData = await request.formData();
        const userId = formData.get('userId')?.toString();
        const isCurrentlyBanned = formData.get('isCurrentlyBanned') === 'true';
        const banReason = formData.get('banReason')?.toString();

        if (!userId) return fail(400, { message: 'ID manquant' });

        await prisma.user.update({
            where: { id: userId },
            data: {
                banned: !isCurrentlyBanned,
                banReason: !isCurrentlyBanned ? banReason : null,
                // On révoque les sessions si on bannit
            }
        });

        // Si on utilise Better Auth, on peut aussi appeler l'API de révocation de session ici
        
        return { success: true, action: 'toggleBan' };
    },

    // 4. Vérifier manuellement un compte (Certification KYC)
    verifyIdentity: async ({ request }) => {
        const formData = await request.formData();
        const userId = formData.get('userId')?.toString();
        if (!userId) return fail(400, { message: 'ID manquant' });

        await prisma.user.update({
            where: { id: userId },
            data: { certified: true }
        });
        return { success: true, action: 'verifyIdentity' };
    }
};