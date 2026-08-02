// src/routes/admin/certifications/+page.server.ts
import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async ({ parent }) => {
    const { user: currentUser } = await parent();

    // Récupérer les parcelles en cours de certification (certified = false)
    const pendingPlots = await prisma.plot.findMany({
        where: { certified: false },
        orderBy: { updatedAt: 'desc' },
        include: {
            proprio: {
                select: { id: true, name: true, telephone: true, cardID: true, typeID: true, certified: true }
            },
            images: true,
            documents: true,
            visits: {
                where: { type: 'CERTIFICATION' },
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    });

    return {
        currentUser,
        pendingPlots
    };
};

export const actions: Actions = {
    // Action 1: Avancer l'étape de certification
    advanceStep: async ({ request }) => {
        const session = await auth.api.getSession()
        if (!session) return fail(401, { message: 'Non autorisé' });

        const formData = await request.formData();
        const plotId = formData.get('plotId')?.toString();
        const currentStepStr = formData.get('currentStep')?.toString();

        if (!plotId || !currentStepStr) {
            return fail(400, { message: 'Données manquantes' });
        }

        const currentStep = parseInt(currentStepStr, 10);
        const nextStep = currentStep + 1;
        const isFinalStep = nextStep >= 4; // 4 = Étape finale (Certifié)

        await prisma.plot.update({
            where: { id: plotId },
            data: {
                certifStep: isFinalStep ? 4 : nextStep,
                certified: isFinalStep
            }
        });

        // Notification de succès pour le client
        if (isFinalStep) {
            const plot = await prisma.plot.findUnique({ where: { id: plotId } });
            if (plot) {
                await prisma.notification.create({
                    data: {
                        userId: plot.proprioId,
                        title: 'Parcelle certifiée !',
                        content: `Félicitations, votre parcelle #${plot.id.slice(-6).toUpperCase()} a passé toutes les vérifications et est désormais certifiée PropriOS.`
                    }
                });
            }
        }

        return { success: true };
    },

    // Action 2: Planifier une descente sur terrain (Visite)
    scheduleVisit: async ({ request }) => {
        const session = await auth.api.getSession()
        if (!session) return fail(401, { message: 'Non autorisé' });

        const formData = await request.formData();
        const plotId = formData.get('plotId')?.toString();
        const dateStr = formData.get('date')?.toString();

        if (!plotId || !dateStr) {
            return fail(400, { message: 'ID ou date manquante' });
        }

        await prisma.visit.create({
            data: {
                plotId,
                date: new Date(dateStr),
                type: 'CERTIFICATION',
                isCompleted: false
            }
        });

        return { success: true };
    },

    // Action 3: Rejeter / Signaler un problème
    /* rejectDoc: async ({ request, locals }) => {
        // Logique pour renvoyer à l'étape 0 ou notifier le client d'un problème
        // ...
        return { success: true };
    } */
};