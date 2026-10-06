import { error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { serialize } from '$lib/server/serializers';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { id } = params;

	const plot = await prisma.plot.findUnique({
		where: { id },
		include: {
			images: true,
			documents: true,
			proprio: {
				select: {
					id: true,
					name: true,
					image: true,
					certified: true,
					role: true
				}
			},
			lawyer: {
				select: {
					id: true,
					name: true,
					telephone: true,
					image: true
				}
			},
			favoritedBy: {
				where: { id: locals.user?.id ?? '' },
				select: { id: true }
			}
		}
	});

	if (!plot) {
		throw error(404, { message: 'Parcelle introuvable ou inexistante' });
	}

	const isFavorited = Boolean(plot.favoritedBy && plot.favoritedBy.length > 0);

	return {
		plot: serialize(plot),
		isFavorited,
		currentUserId: locals.user?.id ?? null
	};
};