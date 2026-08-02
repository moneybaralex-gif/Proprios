// src/routes/admin/plots/+page.server.ts
import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { auth } from '$lib/server/auth';
import type { PlotCategories } from '$lib/server/generated/prisma/enums';

export const load: PageServerLoad = async ({ parent }) => {
    const { user: currentUser } = await parent();

    const plots = await prisma.plot.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            proprio: {
                select: { id: true, name: true, image: true, telephone: true, certified: true }
            },
            images: true,
            documents: true,
            visits: {
                orderBy: { date: 'desc' }
            },
            _count: {
                select: { messages: true }
            }
        }
    });

    return {
        currentUser,
        plots
    };
};

export const actions: Actions = {
    updatePlot: async ({ request }) => {
         const session = await auth.api.getSession()
        if (!session) return fail(401, { message: 'Non autorisé' });

        const formData = await request.formData();
        const plotId = formData.get('plotId')?.toString();
        
        if (!plotId) return fail(400, { message: 'ID de parcelle manquant' });

        try {
            await prisma.plot.update({
                where: { id: plotId },
                data: {
                    categoryId: formData.get('categoryId') as PlotCategories,
                    width: parseInt(formData.get('width')?.toString() || '0') || null,
                    height: parseInt(formData.get('height')?.toString() || '0') || null,
                    price: parseInt(formData.get('price')?.toString() || '0') || null,
                    address: formData.get('address')?.toString() || null,
                    city: formData.get('city')?.toString() || null,
                    canSell: formData.get('canSell') === 'true',
                }
            });
            return { success: true, message: 'Parcelle mise à jour avec succès' };
        } catch (error) {
            console.error(error);
            return fail(500, { message: 'Erreur lors de la mise à jour' });
        }
    },

    deletePlot: async ({ request }) => {
         const session = await auth.api.getSession()
        if (!session || session.user.role !== 'admin') {
            return fail(403, { message: 'Seul un admin peut supprimer une parcelle' });
        }

        const formData = await request.formData();
        const plotId = formData.get('plotId')?.toString();
        if (!plotId) return fail(400, { message: 'ID de parcelle manquant' });

        await prisma.plot.delete({ where: { id: plotId } });
        return { success: true, message: 'Parcelle supprimée définitivement' };
    }
};