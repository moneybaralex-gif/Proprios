// src/routes/admin/visits/+page.server.ts
import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async ({ parent }) => {
    const { user: currentUser } = await parent();

    // On récupère toutes les descentes, triées par date la plus proche
    const visits = await prisma.visit.findMany({
        orderBy: { date: 'asc' },
        include: {
            // Le client qui a demandé la visite (Souvent l'acheteur si FORCLIENT)
            user: {
                select: { id: true, name: true, telephone: true, image: true }
            },
            // La parcelle concernée, avec son propriétaire et une image de couverture
            plot: {
                include: {
                    proprio: {
                        select: { id: true, name: true, telephone: true }
                    },
                    images: { take: 1 }
                }
            }
        }
    });

    return {
        currentUser,
        visits
    };
};

export const actions: Actions = {
    // 1. Marquer la descente comme terminée (Rapport validé)
    completeVisit: async ({ request }) => {
         const session = await auth.api.getSession()
        if (!session) return fail(401, { message: 'Non autorisé' });

        const formData = await request.formData();
        const visitId = formData.get('visitId')?.toString();

        if (!visitId) return fail(400, { message: 'ID manquant' });

        const visit = await prisma.visit.update({
            where: { id: visitId },
            data: { isCompleted: true }
        });

        // Magie métier : Si c'était une visite de certification, on passe la parcelle à l'étape 3
        if (visit.type === 'CERTIFICATION') {
            await prisma.plot.update({
                where: { id: visit.plotId },
                data: { certifStep: 3 } // 3 = Validation Légale (juste avant Certifié)
            });
        }

        return { success: true, message: 'Rapport de descente validé !' };
    },

    // 2. Reprogrammer une descente
    rescheduleVisit: async ({ request }) => {
         const session = await auth.api.getSession();
        if (!session) return fail(401, { message: 'Non autorisé' });

        const formData = await request.formData();
        const visitId = formData.get('visitId')?.toString();
        const newDateStr = formData.get('newDate')?.toString();

        if (!visitId || !newDateStr) return fail(400, { message: 'Données incomplètes' });

        await prisma.visit.update({
            where: { id: visitId },
            data: { date: new Date(newDateStr) }
        });

        return { success: true, message: 'Descente reprogrammée avec succès.' };
    },

    // 3. Valider le paiement (Frais de descente)
    togglePayment: async ({ request }) => {
         const session = await auth.api.getSession();
        if (!session) return fail(401, { message: 'Non autorisé' });

        const formData = await request.formData();
        const visitId = formData.get('visitId')?.toString();
        const isPaid = formData.get('isPaid') === 'true';

        if (!visitId) return fail(400, { message: 'ID manquant' });

        await prisma.visit.update({
            where: { id: visitId },
            data: { paid: !isPaid }
        });

        return { success: true, message: 'Statut financier mis à jour.' };
    }
};