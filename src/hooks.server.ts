// src/hooks.server.ts
import { auth } from "$lib/server/auth";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith("/api/auth")) {
    return auth.handler(event.request);
  }

  // Permet à SvelteKit de lire le cookie de session généré par le popup
  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  if (session) {
    event.locals.user = session.user;
    event.locals.session = session.session;
  } else {
    event.locals.user = null;
    event.locals.session = null;
  }

  return resolve(event);
};