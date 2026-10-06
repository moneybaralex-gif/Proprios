import { prisma } from '$lib/server/prisma';
import { serialize } from '$lib/server/serializers';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return { notifications: [] };
	return {
		notifications: serialize(
			await prisma.notification.findMany({
				where: { userId: locals.user.id },
				orderBy: { createdAt: 'desc' },
				take: 100
			})
		)
	};
};
export const actions: Actions = {
	readAll: async ({ locals }) => {
		if (!locals.user) return fail(401);
		await prisma.notification.updateMany({
			where: { userId: locals.user.id, isRead: false },
			data: { isRead: true }
		});
		return { success: true };
	}
};
