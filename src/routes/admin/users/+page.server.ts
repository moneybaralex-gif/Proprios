// src/routes/admin/users/+page.server.ts
import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { auth } from '$lib/server/auth';
import type { UserIDType, UserType } from '$lib/server/generated/prisma/enums';
import { publishRealtime } from '$lib/server/realtime';
import { serialize } from '$lib/server/serializers';

// Helper avec type de retour uniforme contenant le champ 'role'
async function getAuthenticatedUser(request: Request, locals: App.Locals) {
	let userId = locals.user?.id;

	// Si l'ID n'est pas dans locals, on le récupère via la session Better Auth
	if (!userId) {
		const session = await auth.api.getSession({ headers: request.headers });
		userId = session?.user?.id;
	}

	if (!userId) return null;

	// On récupère toujours l'utilisateur avec son rôle garanti en DB
	return prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			type: true,
			image: true
		}
	});
}

export const load: PageServerLoad = async ({ locals, request }) => {
	const currentUser = await getAuthenticatedUser(request, locals);

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
		users: serialize(users)
	};
};

export const actions: Actions = {
	// 1. Mise à jour du profil utilisateur
	updateProfile: async ({ request, locals }) => {
		const currentUser = await getAuthenticatedUser(request, locals);
		if (!currentUser) return fail(401, { message: 'Non autorisé' });

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
					typeID: (formData.get('typeID')?.toString() as UserIDType) || null
				}
			});
			return { success: true, action: 'updateProfile', message: 'Profil utilisateur mis à jour.' };
		} catch (error) {
			console.error('Erreur updateProfile:', error);
			return fail(500, { message: 'Erreur lors de la mise à jour' });
		}
	},

	// 2. Mise à jour des rôles et catégories (Administrateurs uniquement)
	updateAccess: async ({ request, locals }) => {
		const currentUser = await getAuthenticatedUser(request, locals);

		// 'role' est désormais strictement reconnu par TypeScript
		if (!currentUser || currentUser.role !== 'admin') {
			return fail(403, { message: 'Seul un administrateur peut modifier les rôles' });
		}

		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();
		const role = formData.get('role')?.toString();
		const type = formData.get('type')?.toString() as UserType;

		if (!userId || !role || !type) return fail(400, { message: 'Données manquantes' });

		try {
			await prisma.user.update({
				where: { id: userId },
				data: { role, type }
			});

			return { success: true, action: 'updateAccess', message: 'Accès et rôles mis à jour.' };
		} catch (error) {
			console.error('Erreur updateAccess:', error);
			return fail(500, { message: 'Erreur lors de la mise à jour des accès' });
		}
	},

	// 3. Bannissement / Débannissement
	toggleBan: async ({ request, locals }) => {
		const currentUser = await getAuthenticatedUser(request, locals);
		if (!currentUser) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();
		const isCurrentlyBanned = formData.get('isCurrentlyBanned') === 'true';
		const banReason = formData.get('banReason')?.toString();

		if (!userId) return fail(400, { message: 'ID manquant' });

		try {
			await prisma.user.update({
				where: { id: userId },
				data: {
					banned: !isCurrentlyBanned,
					banReason: !isCurrentlyBanned ? banReason : null
				}
			});

			return { success: true, action: 'toggleBan', message: 'Statut de compte modifié.' };
		} catch (error) {
			console.error('Erreur toggleBan:', error);
			return fail(500, { message: 'Erreur lors de la modification du statut' });
		}
	},

	// 4. Validation et Certification KYC avec envoi de notification
	approveKyc: async ({ request, locals }) => {
		const currentUser = await getAuthenticatedUser(request, locals);
		if (!currentUser) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();

		if (!userId) return fail(400, { message: 'ID utilisateur manquant' });

		try {
			await prisma.user.update({
				where: { id: userId },
				data: {
					certified: true,
					certifStep: 4,
					kycReviewedAt: new Date(),
					kycRejectionReason: null
				}
			});

			// Enregistrement de la notification en DB
			await prisma.notification.create({
				data: {
					userId,
					title: '🎉 Félicitations ! Votre compte est certifié',
					content:
						'Votre dossier d’identification KYC a été validé avec succès par l’administration. Votre badge de certification est désormais actif.'
				}
			});

			try {
				await publishRealtime({
					type: 'user.kyc.approved',
					entity: 'user',
					id: userId,
					targetUserId: userId,
					payload: { certified: true, certifStep: 4 }
				});
			} catch (err) {
				console.warn('Notification realtime non bloquante:', err);
			}

			return { success: true, action: 'approveKyc', message: 'Utilisateur certifié avec succès !' };
		} catch (error) {
			console.error('Erreur approbation KYC:', error);
			return fail(500, { message: 'Impossible de valider la certification.' });
		}
	},

	// 5. Rejet du dossier KYC avec motif et envoi de notification
	rejectKyc: async ({ request, locals }) => {
		const currentUser = await getAuthenticatedUser(request, locals);
		if (!currentUser) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();
		const reason = formData.get('reason')?.toString().trim();

		if (!userId || !reason) {
			return fail(400, { message: 'Un motif explicite de rejet est obligatoire.' });
		}

		try {
			await prisma.user.update({
				where: { id: userId },
				data: {
					certified: false,
					certifStep: 2,
					kycReviewedAt: new Date(),
					kycRejectionReason: reason
				}
			});

			// Enregistrement de la notification de rejet en DB
			await prisma.notification.create({
				data: {
					userId,
					title: '⚠️ Dossier KYC non validé',
					content: `Votre demande de certification a été rejetée pour le motif suivant : "${reason}". Veuillez vous rendre sur votre profil pour téléverser des photos conformes.`
				}
			});

			try {
				await publishRealtime({
					type: 'user.kyc.rejected',
					entity: 'user',
					id: userId,
					targetUserId: userId,
					payload: { certified: false, kycRejectionReason: reason }
				});
			} catch (err) {
				console.warn('Notification realtime non bloquante:', err);
			}

			return { success: true, action: 'rejectKyc', message: 'Dossier KYC rejeté et utilisateur notifié.' };
		} catch (error) {
			console.error('Erreur rejet KYC:', error);
			return fail(500, { message: 'Impossible d’enregistrer le rejet.' });
		}
	}
};