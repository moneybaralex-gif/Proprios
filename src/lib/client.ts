import { PrismaClient } from "./server/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from 'pg'; // 1. On importe le driver PostgreSQL natif
import { DATABASE_URL } from '$env/static/private'; // 2. Le moyen ultra-fiable de SvelteKit pour lire le .env

// 3. On crée explicitement le Pool de connexions
const pool = new pg.Pool({
    connectionString: DATABASE_URL,
});

// 4. On passe l'instance du pool à l'adaptateur Prisma
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
});

export default prisma;