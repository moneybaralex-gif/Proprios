import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
export const load: LayoutServerLoad = async ({ parent }) => {
	const { user } = await parent();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	if (!user || !['admin', 'employee'].includes((user as any).role ?? '')) throw redirect(303, '/');
	return { user };
};
