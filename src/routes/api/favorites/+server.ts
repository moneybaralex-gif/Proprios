import { prisma } from '$lib/server/prisma';
import { publishRealtime } from '$lib/server/realtime';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ message: 'Non autorisé' }, { status: 401 });
	const { plotId, favorite } = await request.json();
	const plot = await prisma.plot.findUnique({
		where: { id: plotId },
		select: { id: true, certificationStatus: true, canSell: true }
	});
	if (!plot || plot.certificationStatus !== 'CERTIFIE' || !plot.canSell)
		return json({ message: 'Parcelle indisponible' }, { status: 404 });
	if (favorite)
		await prisma.user.update({
			where: { id: locals.user.id },
			data: { favoritePlots: { connect: { id: plotId } } }
		});
	else
		await prisma.user.update({
			where: { id: locals.user.id },
			data: { favoritePlots: { disconnect: { id: plotId } } }
		});
	await publishRealtime({
		type: 'favorite.updated',
		entity: 'favorite',
		id: plotId,
		targetUserId: locals.user.id,
		payload: { plotId, favorite }
	});
	return json({ ok: true, favorite });
};
