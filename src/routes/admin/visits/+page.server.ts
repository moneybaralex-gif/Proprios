// filepath: src/routes/admin/visits/+page.server.ts
import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { requireAdmin } from '$lib/server/adminGuard';

export const load: PageServerLoad = async ({ parent }) => {
	const { user: currentUser } = await parent();

	const visits = await prisma.visit.findMany({
		orderBy: { date: 'asc' },
		include: {
			user: {
				select: { id: true, name: true, telephone: true, image: true }
			},
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
	completeVisit: async ({ request }) => {
		const guard = await requireAdmin(request);
		if (!guard.authorized) return guard.response;

		const formData = await request.formData();
		const visitId = formData.get('visitId')?.toString();

		if (!visitId) return fail(400, { message: 'ID manquant' });

		const visit = await prisma.visit.update({
			where: { id: visitId },
			data: { isCompleted: true }
		});

		if (visit.type === 'CERTIFICATION') {
			await prisma.plot.update({
				where: { id: visit.plotId },
				data: { certifStep: 3 }
			});
		}

		return { success: true, message: 'Rapport de descente validé !' };
	},

	rescheduleVisit: async ({ request }) => {
		const guard = await requireAdmin(request);
		if (!guard.authorized) return guard.response;

		const formData = await request.formData();
		const visitId = formData.get('visitId')?.toString();
		const newDateStr = formData.get('newDate')?.toString();

		if (!visitId || !newDateStr) return fail(400, { message: 'Données incomplètes' });

		const visit = await prisma.visit.update({
			where: { id: visitId },
			data: { date: new Date(newDateStr), isCancelled: false },
			include: { plot: true }
		});

		const targetUserId = visit.userId ?? visit.plot.proprioId;
		await prisma.notification.create({
			data: {
				userId: targetUserId,
				title: 'Visite reprogrammée',
				content: `La descente pour la parcelle #${visit.plotId
					.slice(-6)
					.toUpperCase()} a été reprogrammée au ${new Date(newDateStr).toLocaleString('fr-FR')}.`
			}
		});

		return { success: true, message: 'Descente reprogrammée avec succès.' };
	},

	cancelVisit: async ({ request }) => {
		const guard = await requireAdmin(request);
		if (!guard.authorized) return guard.response;

		const formData = await request.formData();
		const visitId = formData.get('visitId')?.toString();

		if (!visitId) return fail(400, { message: 'ID manquant' });

		const visit = await prisma.visit.update({
			where: { id: visitId },
			data: { isCancelled: true },
			include: { plot: true }
		});

		const targetUserId = visit.userId ?? visit.plot.proprioId;
		await prisma.notification.create({
			data: {
				userId: targetUserId,
				title: 'Visite annulée',
				content: `La descente sur terrain pour la parcelle #${visit.plotId
					.slice(-6)
					.toUpperCase()} a été annulée.`
			}
		});

		return { success: true, message: 'Visite annulée.' };
	},

	togglePayment: async ({ request }) => {
		const guard = await requireAdmin(request);
		if (!guard.authorized) return guard.response;

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