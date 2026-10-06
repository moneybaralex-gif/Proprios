import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { CertificationStatus, PlotCategories } from '$lib/server/generated/prisma/enums';
import { v2 as cloudinary } from 'cloudinary';

const PLOT_CATEGORIES = Object.values(PlotCategories);
const CERTIFICATION_STATUSES = Object.values(CertificationStatus);

function toNullableInt(value: FormDataEntryValue | null): number | null {
	if (value === null) return null;
	const s = value.toString().trim();
	if (!s) return null;
	const n = Number(s);
	return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toNullableString(value: FormDataEntryValue | null): string | null {
	if (value === null) return null;
	const s = value.toString().trim();
	return s.length > 0 ? s : null;
}

export const load: PageServerLoad = async () => {
	const plots = await prisma.plot.findMany({
		orderBy: { createdAt: 'desc' },
		include: {
			proprio: { select: { name: true, email: true } },
			images: { orderBy: { id: 'asc' } }
		}
	});
	return { plots };
};

export const actions: Actions = {
	updatePlot: async ({ request }) => {
		const f = await request.formData();
		const id = f.get('id')?.toString();
		if (!id) return fail(400, { success: false, message: 'ID manquant' });

		const categoryRaw = f.get('categoryId')?.toString();
		const statusRaw = f.get('certificationStatus')?.toString();

		const categoryId = PLOT_CATEGORIES.find((c) => c === categoryRaw);
		const certificationStatus = CERTIFICATION_STATUSES.find((s) => s === statusRaw);

		const certifStep = toNullableInt(f.get('certifStep'));

		try {
			await prisma.plot.update({
				where: { id },
				data: {
					categoryId,
					description: toNullableString(f.get('description')),
					width: toNullableInt(f.get('width')),
					height: toNullableInt(f.get('height')),
					price: toNullableInt(f.get('price')),
					country: toNullableString(f.get('country')),
					city: toNullableString(f.get('city')),
					address: toNullableString(f.get('address')),
					canSell: f.get('canSell') === 'on',
					certified: f.get('certified') === 'on',
					certifStep: certifStep ?? 0,
					certificationStatus
				}
			});
			return { success: true, message: 'Parcelle modifiée avec succès.' };
		} catch (error) {
			console.error('updatePlot error:', error);
			return fail(500, { success: false, message: 'Erreur lors de la modification.' });
		}
	},

	deletePlot: async ({ request }) => {
		const f = await request.formData();
		const id = f.get('id')?.toString();
		if (!id) return fail(400, { success: false, message: 'ID manquant' });

		try {
			const plot = await prisma.plot.findUnique({
				where: { id },
				include: { images: true }
			});

			if (plot?.images.length) {
				await Promise.allSettled(
					plot.images.map((img) => cloudinary.uploader.destroy(img.publicId))
				);
			}

			await prisma.plot.delete({ where: { id } });
			return { success: true, message: 'Parcelle supprimée.' };
		} catch (error) {
			console.error('deletePlot error:', error);
			return fail(500, { success: false, message: 'Erreur lors de la suppression.' });
		}
	},

	deleteImage: async ({ request }) => {
		const f = await request.formData();
		const imageId = f.get('imageId')?.toString();
		if (!imageId) return fail(400, { success: false, message: 'ID image manquant' });

		try {
			const image = await prisma.imagePlot.findUnique({ where: { id: imageId } });
			if (!image) return fail(404, { success: false, message: 'Image introuvable.' });

			await cloudinary.uploader.destroy(image.publicId);
			await prisma.imagePlot.delete({ where: { id: imageId } });

			return { success: true, message: 'Image supprimée.' };
		} catch (error) {
			console.error('deleteImage error:', error);
			return fail(500, { success: false, message: "Erreur lors de la suppression de l'image." });
		}
	}
};
