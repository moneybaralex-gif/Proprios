// filepath: src/routes/admin/+page.server.ts
import { prisma } from '$lib/server/prisma';
import { serialize } from '$lib/server/serializers';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

	// Exécution de toutes les requêtes en parallèle pour un temps de réponse minimal (< 20ms)
	const [
		totalUsers,
		totalCertifiedPlots,
		pendingVisitsCount,
		financeSummary,
		buyingCommissionSummary,
		recentPlots,
		pendingKycUsers,
		plotsByCategory,
		statusCounts,
		pendingCertificationCount
	] = await Promise.all([
		prisma.user.count(),
		prisma.plot.count({ where: { certificationStatus: 'CERTIFIE' } }),
		prisma.visit.count({ where: { isCompleted: false, isCancelled: false } }),
		prisma.financeTransaction.aggregate({
			_sum: { amount: true },
			where: { type: 'INCOME', createdAt: { gte: startOfMonth } }
		}),
		prisma.buying.aggregate({
			_sum: { amountCommission: true }
		}),
		prisma.plot.findMany({
			take: 8,
			orderBy: { updatedAt: 'desc' },
			include: {
				proprio: {
					select: {
						id: true,
						name: true,
						certified: true,
						telephone: true
					}
				},
				lawyer: {
					select: {
						id: true,
						name: true
					}
				},
				visits: {
					take: 1,
					orderBy: { createdAt: 'desc' },
					select: {
						date: true,
						isCompleted: true,
						type: true
					}
				}
			}
		}),
		prisma.user.findMany({
			where: {
				identityCardPhotoUrl: { not: null },
				certified: false
			},
			take: 5,
			orderBy: { kycSubmittedAt: 'desc' },
			select: {
				id: true,
				name: true,
				cardID: true,
				typeID: true,
				createdAt: true,
				kycSubmittedAt: true
			}
		}),
		prisma.plot.groupBy({
			by: ['categoryId'],
			_count: { _all: true }
		}),
		prisma.plot.groupBy({
			by: ['certificationStatus'],
			_count: { _all: true }
		}),
		prisma.plot.count({
			where: { certificationStatus: { in: ['ATTENTE', 'EN_COURS'] } }
		})
	]);

	const monthlyIncome =
		(financeSummary._sum.amount ?? 0) > 0
			? (financeSummary._sum.amount ?? 0)
			: (buyingCommissionSummary._sum.amountCommission ?? 0);

	return {
		stats: {
			totalUsers,
			totalCertifiedPlots,
			pendingVisitsCount,
			pendingCertificationCount,
			monthlyIncome
		},
		recentPlots: serialize(recentPlots),
		pendingKycUsers: serialize(pendingKycUsers),
		plotsByCategory: serialize(plotsByCategory),
		statusCounts: serialize(statusCounts)
	};
};