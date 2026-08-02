// src/routes/admin/campaigns/+page.server.ts
import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async ({ parent }) => {
    const { user: currentUser } = await parent();

    // Calcul en parallèle du nombre de destinataires par segment
    const [totalUsers, proprioCount, lawyerCount, agentCount, certifiedCount] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { type: 'PROPRIO' } }),
        prisma.user.count({ where: { type: 'LAWYER' } }),
        prisma.user.count({ where: { type: 'AGENT' } }),
        prisma.user.count({ where: { certified: true } })
    ]);

    return {
        currentUser,
        counts: {
            ALL: totalUsers,
            PROPRIO: proprioCount,
            LAWYER: lawyerCount,
            AGENT: agentCount,
            CERTIFIED: certifiedCount
        }
    };
};

export const actions: Actions = {
    sendCampaign: async ({ request }) => {
        const session = await auth.api.getSession();
        if (!session) return fail(401, { message: 'Non autorisé' });

        const formData = await request.formData();
        const subject = formData.get('subject')?.toString();
        const body = formData.get('body')?.toString();
        const segment = formData.get('segment')?.toString();

        if (!subject || !body || !segment) {
            return fail(400, { message: 'Veuillez remplir le sujet, le corps et le segment.' });
        }

        // Filtre Prisma selon le segment choisi
        let whereClause = {};
        if (segment === 'PROPRIO') whereClause = { type: 'PROPRIO' };
        else if (segment === 'LAWYER') whereClause = { type: 'LAWYER' };
        else if (segment === 'AGENT') whereClause = { type: 'AGENT' };
        else if (segment === 'CERTIFIED') whereClause = { certified: true };

        // Récupération des emails cibles
        const targetUsers = await prisma.user.findMany({
            where: whereClause,
            select: { email: true, name: true }
        });

        if (targetUsers.length === 0) {
            return fail(400, { message: 'Aucun utilisateur ne correspond à ce segment.' });
        }

        // 💡 Ici, tu connectes ton service de messagerie (Resend, SendGrid, Amazon SES, ou Nodemailer)
        // Exemple : await sendMailService.sendBatch(targetUsers, { subject, preheader, body });

        return {
            success: true,
            recipientCount: targetUsers.length,
            message: `Campagne envoyée avec succès à ${targetUsers.length} destinataire(s) !`
        };
    }
};