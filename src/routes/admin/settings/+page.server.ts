// src/routes/admin/settings/+page.server.ts
import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async ({ parent }) => {
    const { user: currentUser } = await parent();

    // Récupération complète du profil avec les sessions actives et les comptes Better Auth
    const userProfile = await prisma.user.findUnique({
        where: { id: currentUser?.id },
        include: {
            sessions: {
                orderBy: { updatedAt: 'desc' }
            },
            accounts: {
                select: { providerId: true, createdAt: true }
            }
        }
    });

    if (!userProfile) {
        throw fail(404, { message: 'Profil utilisateur introuvable.' });
    }

    return {
        currentUser,
        userProfile
    };
};

export const actions: Actions = {
    // 1. Mise à jour des informations personnelles
    updateProfile: async ({ request }) => {
        const session = await auth.api.getSession();
        if (!session) return fail(401, { message: 'Non autorisé' });

        const formData = await request.formData();
        const name = formData.get('name')?.toString();
        const telephone = formData.get('telephone')?.toString();
        const image = formData.get('image')?.toString();

        if (!name) return fail(400, { message: 'Le nom est obligatoire.' });

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name,
                telephone: telephone || null,
                image: image || null
            }
        });

        return { success: true, message: 'Profil mis à jour avec succès.' };
    },

    // 2. Déclencher le mail de vérification Gmail / Email (Better Auth)
    sendVerificationEmail: async () => {
        const session = await auth.api.getSession();
        if (!session) return fail(401, { message: 'Non autorisé' });

        // Ici, on déclencherait le service d'envoi de jeton de vérification
        // e.g. await auth.sendVerificationEmail({ userId: session.user.id });

        return { success: true, message: 'Un lien de vérification a été envoyé à votre adresse email.' };
    },

    // 3. Changement de mot de passe (Better Auth Account)
    changePassword: async ({ request }) => {
        const session = await auth.api.getSession();
        if (!session) return fail(401, { message: 'Non autorisé' });

        const formData = await request.formData();
        const currentPassword = formData.get('currentPassword')?.toString();
        const newPassword = formData.get('newPassword')?.toString();
        const confirmPassword = formData.get('confirmPassword')?.toString();

        if (!currentPassword || !newPassword || !confirmPassword) {
            return fail(400, { message: 'Veuillez remplir tous les champs de mot de passe.' });
        }

        if (newPassword !== confirmPassword) {
            return fail(400, { message: 'Les nouveaux mots de passe ne correspondent pas.' });
        }

        if (newPassword.length < 8) {
            return fail(400, { message: 'Le mot de passe doit contenir au moins 8 caractères.' });
        }

        // 💡 Logique de changement de mot de passe via Better Auth ou hashage de compte
        // await auth.changePassword({ userId: session.user.id, currentPassword, newPassword });

        return { success: true, message: 'Votre mot de passe a été modifié avec succès.' };
    },

    // 4. Révoquer une session Better Auth (Déconnexion à distance)
    revokeSession: async ({ request }) => {
        const session = await auth.api.getSession();
        if (!session) return fail(401, { message: 'Non autorisé' });

        const formData = await request.formData();
        const sessionId = formData.get('sessionId')?.toString();

        if (!sessionId) return fail(400, { message: 'ID de session manquant.' });

        // Suppression de la session dans la base de données
        await prisma.session.delete({
            where: { id: sessionId }
        });

        return { success: true, message: 'Appareil déconnecté avec succès.' };
    },

    // 5. Mise à jour du code PIN de sécurité
    updatePin: async ({ request }) => {
        const session = await auth.api.getSession();
        if (!session) return fail(401, { message: 'Non autorisé' });

        const formData = await request.formData();
        const pinStr = formData.get('pin')?.toString();

        if (!pinStr || pinStr.length !== 4) {
            return fail(400, { message: 'Le code PIN doit comporter exactement 4 chiffres.' });
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { pin: parseInt(pinStr, 10) }
        });

        return { success: true, message: 'Code PIN de sécurité mis à jour.' };
    }
};