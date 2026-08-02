// src/routes/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Liste des routes publiques accessibles sans être connecté
	const publicRoutes = ['/login', '/register', '/forgot-password'];

	// Si l'utilisateur n'est PAS connecté et essaie d'accéder à une page privée
	if (!locals.user && !publicRoutes.includes(url.pathname)) {
		throw redirect(303, '/login');
	}

	// (Optionnel) Si l'utilisateur EST connecté et va sur /login, on l'envoie sur le dashboard
	if (locals.user && url.pathname === '/login') {
		throw redirect(303, '/');
	}

	return {
		user: locals.user
	};
};