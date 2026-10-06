// filepath: src/routes/admin/certifications/+page.server.ts
import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { publishRealtime } from '$lib/server/realtime';
import { requireAdmin } from '$lib/server/adminGuard';

export const load: PageServerLoad = async ({ parent }) => {
	const { user: currentUser } = await parent();

	const pendingPlots = await prisma.plot.findMany({
		where: { certificationStatus: { not: 'CERTIFIE' } },
		orderBy: { updatedAt: 'desc' },
		include: {
			proprio: {
				select: {
					id: true,
					name: true,
					telephone: true,
					cardID: true,
					typeID: true,
					certified: true
				}
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

	const lawyers = await prisma.user.findMany({
		where: { type: 'LAWYER' },
		select: { id: true, name: true, email: true }
	});

	return { currentUser, pendingPlots, lawyers };
};

export const actions: Actions = {
	advanceStep: async ({ request }) => {
		const guard = await requireAdmin(request);
		if (!guard.authorized) return guard.response;

		const formData = await request.formData();
		const plotId = formData.get('plotId')?.toString();
		const currentStepStr = formData.get('currentStep')?.toString();
		const lawyerId = formData.get('lawyerId')?.toString();

		if (!plotId || !currentStepStr) {
			return fail(400, { message: 'Données manquantes' });
		}

		const currentStep = parseInt(currentStepStr, 10);
		const nextStep = currentStep + 1;
		const isFinalStep = nextStep >= 4;

		if (currentStep === 2 && !lawyerId) {
			return fail(400, {
				message: "Vous devez assigner un avocat pour passer à l'étape légale."
			});
		}

		await prisma.plot.update({
			where: { id: plotId },
			data: {
				certifStep: isFinalStep ? 4 : nextStep,
				certificationStatus: isFinalStep ? 'CERTIFIE' : 'EN_COURS',
				certified: isFinalStep,
				...(lawyerId ? { lawyerId } : {})
			}
		});

		if (isFinalStep) {
			const plot = await prisma.plot.findUnique({ where: { id: plotId } });
			if (plot) {
				await prisma.notification.create({
					data: {
						userId: plot.proprioId,
						title: 'Parcelle certifiée !',
						content: `Félicitations, votre parcelle #${plot.id
							.slice(-6)
							.toUpperCase()} a passé toutes les vérifications et est désormais certifiée PropriOS.`
					}
				});
			}
		}

		await publishRealtime({
			type: 'plot.certification.updated',
			entity: 'plot',
			id: plotId,
			payload: {
				certificationStatus: isFinalStep ? 'CERTIFIE' : 'EN_COURS',
				certifStep: isFinalStep ? 4 : nextStep
			}
		});

		return { success: true };
	},

	scheduleVisit: async ({ request }) => {
		const guard = await requireAdmin(request);
		if (!guard.authorized) return guard.response;

		const formData = await request.formData();
		const plotId = formData.get('plotId')?.toString();
		const dateStr = formData.get('date')?.toString();

		if (!plotId || !dateStr) return fail(400, { message: 'ID ou date manquante' });

		await prisma.visit.create({
			data: {
				plotId,
				date: new Date(dateStr),
				type: 'CERTIFICATION',
				isCompleted: false,
				isCancelled: false
			}
		});

		return { success: true };
	}
};