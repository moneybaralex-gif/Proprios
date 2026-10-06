// filepath: src/routes/api/plots/+server.ts
import { prisma } from '$lib/server/prisma';
import { serialize } from '$lib/server/serializers';
import type { RequestHandler } from './$types';

const ALLOWED_CATEGORIES = ['HOUSE', 'COMPANY', 'GROUND', 'OTHER'];
const ALLOWED_SORTS = ['recent', 'popular', 'priceDesc', 'priceAsc'] as const;

// Taille des paquets envoyés au fil de l'eau : plus petit = plus "fluide" à l'écran,
// plus grand = moins d'allers-retours réseau/DB.
const CHUNK_SIZE = 4;
const MAX_LIMIT = 30;

function buildOrderBy(sort: string) {
	switch (sort) {
		case 'popular':
			return [{ likes: 'desc' as const }, { createdAt: 'desc' as const }];
		case 'priceDesc':
			return [{ price: 'desc' as const }];
		case 'priceAsc':
			return [{ price: 'asc' as const }];
		default:
			return [{ createdAt: 'desc' as const }];
	}
}

export const GET: RequestHandler = async ({ url, locals }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const categoryParam = url.searchParams.get('category');
	const sortParam = url.searchParams.get('sort') ?? 'recent';
	const sort = (ALLOWED_SORTS as readonly string[]).includes(sortParam) ? sortParam : 'recent';
	const cursorParam = url.searchParams.get('cursor');
	const limit = Math.min(Number(url.searchParams.get('limit') ?? 12) || 12, MAX_LIMIT);

	const where: Record<string, unknown> = {
		certificationStatus: 'CERTIFIE',
		canSell: true
	};

	if (categoryParam && ALLOWED_CATEGORIES.includes(categoryParam)) {
		where.categoryId = categoryParam;
	}

	if (q) {
		where.OR = [
			{ city: { contains: q, mode: 'insensitive' } },
			{ address: { contains: q, mode: 'insensitive' } },
			{ country: { contains: q, mode: 'insensitive' } },
			{ description: { contains: q, mode: 'insensitive' } }
		];
	}

	const orderBy = buildOrderBy(sort);
	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		async start(controller) {
			let fetched = 0;
			let dbCursor = cursorParam ?? undefined;
			let hasMore = true;

			try {
				while (fetched < limit && hasMore) {
					const take = Math.min(CHUNK_SIZE, limit - fetched);

					// On lit la base par petits lots successifs : chaque lot est streamé au
					// client dès qu'il arrive, sans attendre que le total de `limit` soit atteint.
					const batch = await prisma.plot.findMany({
						where,
						orderBy,
						take: take + 1,
						...(dbCursor ? { cursor: { id: dbCursor }, skip: 1 } : {}),
						include: {
							images: { take: 1 },
							favoritedBy: { where: { id: locals.user?.id ?? '' }, select: { id: true } }
						}
					});

					hasMore = batch.length > take;
					const page = batch.slice(0, take);
					if (page.length === 0) break;

					dbCursor = page[page.length - 1].id;
					fetched += page.length;

					const payload = {
						items: serialize(page),
						nextCursor: hasMore ? dbCursor : null,
						hasMore: hasMore && fetched < limit
					};

					// NDJSON : un objet JSON par ligne, pour que le client puisse découper le flux
					// au fur et à mesure sans attendre la fermeture de la connexion.
					controller.enqueue(encoder.encode(JSON.stringify(payload) + '\n'));
				}
			} catch (err) {
				console.error('Erreur de streaming /api/plots :', err);
			} finally {
				controller.close();
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'application/x-ndjson; charset=utf-8',
			'Cache-Control': 'no-store'
		}
	});
};