// src/routes/profile/+page.server.ts
import { fail } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { cloudinary } from '$lib/server/cloudinary';
import { publishRealtime } from '$lib/server/realtime';
import { serialize } from '$lib/server/serializers';
import type { Actions, PageServerLoad } from './$types';
import type { UserIDType, Gender } from '$lib/server/generated/prisma/enums';
import type { Prisma } from '$lib/server/generated/prisma/client';

// Fonction d'upload robuste et compatible Node.js / Bun
async function upload(file: File, folder: string): Promise<string | null> {
	if (!file || !(file instanceof File) || file.size === 0) return null;

	const arrayBuffer = await file.arrayBuffer();
	const base64 = Buffer.from(arrayBuffer).toString('base64');
	const mimeType = file.type || 'image/jpeg';
	const dataUri = `data:${mimeType};base64,${base64}`;

	try {
		const result = await cloudinary.uploader.upload(dataUri, {
			folder,
			resource_type: 'auto'
		});
		return result.secure_url;
	} catch (error) {
		console.error(`[Cloudinary Error] Impossible d'uploader dans ${folder}:`, error);
		throw error;
	}
}

function calculateStep(data: {
	name?: string | null;
	telephone?: string | null;
	city?: string | null;
	emailVerified: boolean;
	kycSubmittedAt?: Date | null;
	certified: boolean;
}): number {
	if (data.certified) return 4;
	if (data.kycSubmittedAt) return 3;
	if (data.emailVerified) return 2;
	if (data.name && data.telephone && data.city) return 1;
	return 0;
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return { profile: null };

	const profile = await prisma.user.findUnique({
		where: { id: locals.user.id },
		select: {
			id: true,
			name: true,
			email: true,
			emailVerified: true,
			telephone: true,
			dateOfBirth: true,
			gender: true,
			country: true,
			city: true,
			image: true,
			certifStep: true,
			certified: true,
			type: true,
			cardID: true,
			typeID: true,
			identityCardPhotoUrl: true,
			portraitPhotoUrl: true,
			cardHoldingPhotoUrl: true,
			kycSubmittedAt: true,
			kycReviewedAt: true,
			kycRejectionReason: true
		}
	});

	if (!profile) return { profile: null };

	return { streamed : { profile: serialize(profile)} };
};

export const actions: Actions = {
	update: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const telephone = formData.get('telephone')?.toString().trim() || null;
		const city = formData.get('city')?.toString().trim() || null;
		const country = formData.get('country')?.toString().trim() || null;
		const genderStr = formData.get('gender')?.toString().trim();

		const imageFile = formData.get('image');
		let image: string | null = null;

		if (imageFile instanceof File && imageFile.size > 0) {
			try {
				image = await upload(imageFile, 'proprios/users');
			} catch (error) {
				console.error('Erreur téléversement photo de profil:', error);
				return fail(500, { message: 'Impossible de téléverser la photo de profil sur Cloudinary.' });
			}
		}

		try {
			const currentUser = await prisma.user.findUnique({
				where: { id: locals.user.id }
			});

			if (!currentUser) return fail(404, { message: 'Utilisateur introuvable.' });

			const calculatedStep = calculateStep({
				name: name || currentUser.name,
				telephone: telephone ?? currentUser.telephone,
				city: city ?? currentUser.city,
				emailVerified: currentUser.emailVerified,
				kycSubmittedAt: currentUser.kycSubmittedAt,
				certified: currentUser.certified
			});

			const dataToUpdate: Prisma.UserUpdateInput = {
				name: name || undefined,
				telephone,
				city,
				country,
				gender: (genderStr as Gender) || undefined,
				certifStep: Math.max(currentUser.certifStep, calculatedStep)
			};

			if (image) {
				dataToUpdate.image = image;
			}

			const user = await prisma.user.update({
				where: { id: locals.user.id },
				data: dataToUpdate
			});

			try {
				await publishRealtime({
					type: 'user.updated',
					entity: 'user',
					id: user.id,
					targetUserId: user.id,
					payload: serialize(user)
				});
			} catch (err) {
				console.warn('Realtime event ignoré:', err);
			}

			return { success: true, message: 'Profil mis à jour avec succès.' };
		} catch (error) {
			console.error('Erreur mise à jour profil:', error);
			return fail(500, { message: 'Erreur lors de la mise à jour du profil.' });
		}
	},

	submitKyc: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const typeID = formData.get('typeID')?.toString() as UserIDType | undefined;
		const cardID = formData.get('cardID')?.toString().trim();

		if (!typeID || !cardID) {
			return fail(400, {
				message: 'Veuillez sélectionner le type de document et renseigner son numéro.'
			});
		}

		const idPhoto = formData.get('identityCardPhoto');
		const portrait = formData.get('portraitPhoto');
		const holding = formData.get('cardHoldingPhoto');

		if (
			!(idPhoto instanceof File && idPhoto.size > 0) ||
			!(portrait instanceof File && portrait.size > 0) ||
			!(holding instanceof File && holding.size > 0)
		) {
			return fail(400, {
				message: 'Les 3 photos KYC sont strictement obligatoires (Pièce, Portrait, Carte en main).'
			});
		}

		try {
			// Envoi séquentiel ou parallèle via Data URI
			const [identityCardPhotoUrl, portraitPhotoUrl, cardHoldingPhotoUrl] = await Promise.all([
				upload(idPhoto, 'proprios/kyc'),
				upload(portrait, 'proprios/kyc'),
				upload(holding, 'proprios/kyc')
			]);

			if (!identityCardPhotoUrl || !portraitPhotoUrl || !cardHoldingPhotoUrl) {
				return fail(500, { message: 'Échec de l’envoi des fichiers sur Cloudinary.' });
			}

			const user = await prisma.user.update({
				where: { id: locals.user.id },
				data: {
					typeID,
					cardID,
					identityCardPhotoUrl,
					portraitPhotoUrl,
					cardHoldingPhotoUrl,
					kycSubmittedAt: new Date(),
					kycRejectionReason: null,
					certifStep: 3,
					certified: false
				}
			});

			try {
				await publishRealtime({
					type: 'user.kyc.submitted',
					entity: 'user',
					id: user.id,
					targetUserId: user.id,
					payload: { certifStep: 3, kycSubmittedAt: user.kycSubmittedAt }
				});
			} catch (err) {
				console.warn('Realtime event ignoré:', err);
			}

			return {
				success: true,
				message:
					'Votre dossier KYC a été soumis avec succès ! Il est actuellement en cours d’examen par l’administration.'
			};
		} catch (error) {
			console.error('Erreur soumission KYC:', error);
			return fail(500, { message: 'Une erreur est survenue lors de l’envoi de votre dossier KYC.' });
		}
	}
};