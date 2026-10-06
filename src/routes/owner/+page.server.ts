// filepath: src/routes/owner/+page.server.ts
import { fail } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { cloudinary } from '$lib/server/cloudinary';
import { publishRealtime } from '$lib/server/realtime';
import { serialize } from '$lib/server/serializers';
import type { Actions, PageServerLoad } from './$types';
import type { PlotCategories } from '$lib/server/generated/prisma/enums';

interface CloudinaryUploadResult {
	url: string;
	publicId: string;
	name: string;
}

// Fonction générique d'upload vers Cloudinary (images et documents .pdf/.docx)
async function uploadToCloudinary(
	file: File,
	folder: string,
	resourceType: 'auto' | 'raw' | 'image' = 'auto'
): Promise<CloudinaryUploadResult | null> {
	if (!file || !(file instanceof File) || file.size === 0) return null;

	const arrayBuffer = await file.arrayBuffer();
	const base64 = Buffer.from(arrayBuffer).toString('base64');
	const mimeType = file.type || 'application/octet-stream';
	const dataUri = `data:${mimeType};base64,${base64}`;

	try {
		const result = await cloudinary.uploader.upload(dataUri, {
			folder,
			resource_type: resourceType
		});
		return {
			url: result.secure_url,
			publicId: result.public_id,
			name: file.name
		};
	} catch (error) {
		console.error(`[Cloudinary Error] Impossible d'uploader dans ${folder}:`, error);
		throw error;
	}
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return {
			ownerData: Promise.resolve({ plots: [], favorites: [] }),
			userCertified: false
		};
	}

	// Vérification serveur : la certification du compte propriétaire
	const dbUser = await prisma.user.findUnique({
		where: { id: locals.user.id },
		select: { certified: true }
	});
	const userCertified = dbUser?.certified ?? false;

	const loadData = async () => {
		const [plots, favorites] = await Promise.all([
			prisma.plot.findMany({
				where: { proprioId: locals.user?.id },
				orderBy: { createdAt: 'desc' },
				include: {
					images: true,
					documents: true,
					lawyer: {
						select: {
							name: true,
							telephone: true
						}
					},
					// Dernière visite de certification uniquement (le modèle Visit est source de vérité)
					visits: {
						where: { type: 'CERTIFICATION' },
						orderBy: { createdAt: 'desc' },
						take: 1
					}
				}
			}),
			prisma.user.findUnique({
				where: { id: locals.user?.id },
				select: {
					favoritePlots: { orderBy: { createdAt: 'desc' }, include: { images: { take: 1 } } }
				}
			})
		]);
		return {
			plots: serialize(plots),
			favorites: serialize(favorites?.favoritePlots ?? [])
		};
	};

	return { ownerData: loadData(), userCertified };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Non autorisé' });
		const f = await request.formData();

		// Statut de certification du compte récupéré côté serveur (jamais depuis le client)
		const dbUser = await prisma.user.findUnique({
			where: { id: locals.user.id },
			select: { certified: true }
		});
		const userCertified = dbUser?.certified ?? false;

		// Upload images
		const rawImages = f.getAll('images');
		const imageFiles = rawImages.filter(
			(item): item is File => item instanceof File && item.size > 0
		);

		let uploadedImages: CloudinaryUploadResult[] = [];
		if (imageFiles.length > 0) {
			try {
				const uploadResults = await Promise.all(
					imageFiles.map((file) => uploadToCloudinary(file, 'proprios/plots', 'image'))
				);
				uploadedImages = uploadResults.filter((img): img is CloudinaryUploadResult => img !== null);
			} catch (err) {
				console.error('Erreur Cloudinary lors de la création des photos:', err);
				return fail(500, { message: "Échec de l'enregistrement des photos sur Cloudinary." });
			}
		}

		// Upload documents
		const rawDocuments = f.getAll('documents');
		const documentFiles = rawDocuments.filter(
			(item): item is File => item instanceof File && item.size > 0
		);

		let uploadedDocs: CloudinaryUploadResult[] = [];
		if (documentFiles.length > 0) {
			try {
				const docUploadResults = await Promise.all(
					documentFiles.map((file) => uploadToCloudinary(file, 'proprios/documents', 'auto'))
				);
				uploadedDocs = docUploadResults.filter(
					(doc): doc is CloudinaryUploadResult => doc !== null
				);
			} catch (err) {
				console.error("Erreur Cloudinary lors de l'upload des documents:", err);
				return fail(500, { message: "Échec de l'enregistrement des documents sur Cloudinary." });
			}
		}

		const description = f.get('description')?.toString().trim() || null;

		// 🔒 Sécurité : un utilisateur non certifié ne peut jamais publier
		// On ignore toute valeur forgée côté client.
		const requestedCanSell = f.get('canSell') === 'on';
		const canSell = userCertified ? requestedCanSell : false;

		const plot = await prisma.plot.create({
			data: {
				proprioId: locals.user.id,
				categoryId: (f.get('categoryId')?.toString() || 'GROUND') as PlotCategories,
				description,
				width: Number(f.get('width')) || null,
				height: Number(f.get('height')) || null,
				price: Number(f.get('price')) || null,
				country: f.get('country')?.toString() || null,
				city: f.get('city')?.toString() || null,
				address: f.get('address')?.toString() || null,
				canSell,
				images: {
					create: uploadedImages.map((img) => ({
						url: img.url,
						publicId: img.publicId
					}))
				},
				documents: {
					create: uploadedDocs.map((doc) => ({
						url: doc.url,
						publicId: doc.publicId,
						name: doc.name
					}))
				}
			},
			include: {
				images: true,
				documents: true
			}
		});

		await publishRealtime({
			type: 'plot.created',
			entity: 'plot',
			id: plot.id,
			targetUserId: locals.user.id,
			payload: serialize(plot)
		});

		return {
			success: true,
			message: 'Parcelle, documents et photos envoyés avec succès pour certification.'
		};
	},

	update: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Non autorisé' });
		const f = await request.formData();
		const id = f.get('plotId')?.toString();
		if (!id) return fail(400, { message: 'ID manquant' });

		const current = await prisma.plot.findUnique({
			where: { id },
			select: { proprioId: true, certificationStatus: true }
		});
		if (!current || current.proprioId !== locals.user.id)
			return fail(403, { message: 'Vous ne possédez pas cette parcelle' });
		if (current.certificationStatus === 'CERTIFIE')
			return fail(409, { message: 'Une parcelle certifiée ne peut plus être modifiée.' });

		// Upload de nouvelles photos éventuelles
		const rawImages = f.getAll('images');
		const imageFiles = rawImages.filter(
			(item): item is File => item instanceof File && item.size > 0
		);
		if (imageFiles.length > 0) {
			try {
				const uploadResults = await Promise.all(
					imageFiles.map((file) => uploadToCloudinary(file, 'proprios/plots', 'image'))
				);
				const uploadedImages = uploadResults.filter(
					(img): img is CloudinaryUploadResult => img !== null
				);
				if (uploadedImages.length > 0) {
					await prisma.imagePlot.createMany({
						data: uploadedImages.map((img) => ({
							plotId: id,
							url: img.url,
							publicId: img.publicId
						}))
					});
				}
			} catch (err) {
				console.error('Erreur Cloudinary lors de la mise à jour des photos:', err);
			}
		}

		// Upload de nouveaux documents éventuels
		const rawDocuments = f.getAll('documents');
		const documentFiles = rawDocuments.filter(
			(item): item is File => item instanceof File && item.size > 0
		);
		if (documentFiles.length > 0) {
			try {
				const docUploadResults = await Promise.all(
					documentFiles.map((file) => uploadToCloudinary(file, 'proprios/documents', 'auto'))
				);
				const uploadedDocs = docUploadResults.filter(
					(doc): doc is CloudinaryUploadResult => doc !== null
				);
				if (uploadedDocs.length > 0) {
					await prisma.imageDocumentPlot.createMany({
						data: uploadedDocs.map((doc) => ({
							plotId: id,
							url: doc.url,
							publicId: doc.publicId,
							name: doc.name
						}))
					});
				}
			} catch (err) {
				console.error('Erreur Cloudinary lors de la mise à jour des documents:', err);
			}
		}

		const description = f.get('description')?.toString().trim() || null;

		// ⚠️ canSell n'est plus modifiable via update : cela passe par toggleSaleStatus
		const plot = await prisma.plot.update({
			where: { id },
			data: {
				categoryId: f.get('categoryId') as PlotCategories,
				description,
				width: Number(f.get('width')) || null,
				height: Number(f.get('height')) || null,
				price: Number(f.get('price')) || null,
				city: f.get('city')?.toString() || null,
				address: f.get('address')?.toString() || null
			},
			include: {
				images: true,
				documents: true
			}
		});

		await publishRealtime({
			type: 'plot.updated',
			entity: 'plot',
			id,
			targetUserId: locals.user.id,
			payload: serialize(plot)
		});

		return { success: true, message: 'Parcelle mise à jour.' };
	},

	// 🔐 Action dédiée à la bascule vente / hors vente
	toggleSaleStatus: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Non autorisé' });

		const f = await request.formData();
		const plotId = f.get('plotId')?.toString();
		if (!plotId) return fail(400, { message: 'ID de parcelle manquant' });

		const plot = await prisma.plot.findUnique({
			where: { id: plotId },
			select: { proprioId: true, certificationStatus: true, canSell: true }
		});

		if (!plot) return fail(404, { message: 'Parcelle introuvable' });
		if (plot.proprioId !== locals.user.id)
			return fail(403, { message: 'Vous ne possédez pas cette parcelle' });
		if (plot.certificationStatus !== 'CERTIFIE')
			return fail(409, {
				message: 'Seule une parcelle certifiée peut être mise en vente ou retirée de la vente.'
			});

		const newCanSell = !plot.canSell;

		const updated = await prisma.plot.update({
			where: { id: plotId },
			data: { canSell: newCanSell },
			include: { images: true, documents: true }
		});

		await publishRealtime({
			type: 'plot.sale.toggled',
			entity: 'plot',
			id: plotId,
			targetUserId: locals.user.id,
			payload: serialize(updated)
		});

		return {
			success: true,
			message: newCanSell
				? 'Parcelle désormais proposée à la vente.'
				: 'Parcelle retirée de la vente.'
		};
	}
};