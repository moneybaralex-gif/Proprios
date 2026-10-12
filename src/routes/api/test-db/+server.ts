import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

export async function GET() {
    try {
        // Test simple : compter le nombre d'utilisateurs ou exécuter une requête basique
        const userCount = await prisma.user.count();
        
        return json({
            success: true,
            message: "Connexion à la base de données réussie !",
            userCount
        });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any)
     {
        return json({
            success: false,
            message: "Échec de la connexion à la base de données",
            error: error.message
        }, { status: 500 });
    }
}