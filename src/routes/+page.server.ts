import { prisma } from '$lib/server/prisma';
import { serialize } from '$lib/server/serializers';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const [recommended, total] = await Promise.all([
    prisma.plot.findMany({
      where: { certificationStatus: 'CERTIFIE', canSell: true },
      orderBy: [{ likes: 'desc' }, { createdAt: 'desc' }], take: 8,
      include: { images: { take: 1 }, favoritedBy: { where: { id: locals.user?.id ?? '' }, select: { id: true } } }
    }),
    prisma.plot.count({ where: { certificationStatus: 'CERTIFIE', canSell: true } })
  ]);
  return { recommended: serialize(recommended), total };
};
