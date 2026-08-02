import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from 'pg';
import { DATABASE_URL } from '$env/static/private';
import { dev } from '$app/environment'; // Utilitaire SvelteKit pour détecter le mode dev

// On conserve le pool ET le client Prisma dans le scope global en développement
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: pg.Pool;
};

// 1. Réutilisation ou création du Pool de connexions
const pool = globalForPrisma.pool ?? new pg.Pool({ connectionString: DATABASE_URL });

// 2. Réutilisation ou création du client Prisma
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter: new PrismaPg(pool),
});

// 3. Sauvegarde dans l'objet global uniquement en mode dev
if (dev) {
  globalForPrisma.pool = pool;
  globalForPrisma.prisma = prisma;
}

export { prisma };
export default prisma;