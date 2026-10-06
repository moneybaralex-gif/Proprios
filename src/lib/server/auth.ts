// src/lib/server/auth.ts
import { betterAuth } from 'better-auth/minimal';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import prisma from './prisma';
import { BETTER_AUTH_URL, GOOGLE_CLIENT_SECRET,BETTER_AUTH_SECRET } from '$env/static/private';
import { PUBLIC_GOOGLE_CLIENT_ID } from "$env/static/public";
import { admin, oneTap } from 'better-auth/plugins';

export function hashPassword(password: string): string {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(password, salt, 64).toString('hex');
	return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
	const [salt, hash] = storedHash.split(':');
	const targetHash = scryptSync(password, salt, 64).toString('hex');

	return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(targetHash, 'hex'));
}

export const auth = betterAuth({

    baseURL: BETTER_AUTH_URL,
	secret: BETTER_AUTH_SECRET,

	trustedOrigins: [
        'http://localhost:5173',
        'http://172.20.10.6:5173',
        // Si tu changes de réseau Wi-Fi, tu peux aussi utiliser une fonction dynamique :
        // (origin) => origin.startsWith('http://172.20.') || origin.startsWith('http://192.168.')
    ],

	database: prismaAdapter(prisma, {
		provider: 'postgresql'
	}),

	emailAndPassword: {
		enabled: true,
		autoSignIn: true
	},

	socialProviders: {
		google: {
			clientId: PUBLIC_GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET,
			scopes: ['profile', 'email']
		}
	},
	plugins: [
		admin({
			defaultRole: 'user', // Rôle par défaut à l'inscription
			adminRole: ['admin'] // Rôles considérés comme administrateurs
		}),
        oneTap(), // Active le support du jeton ID token transmis par Google One Tap
	]
});
