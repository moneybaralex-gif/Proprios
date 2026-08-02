// src/lib/auth-client.ts
import type { BetterAuthClientPlugin } from "better-auth";
import { adminClient, oneTapClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/svelte";
import { PUBLIC_GOOGLE_CLIENT_ID } from "$env/static/public";

export const authClient = createAuthClient({
  baseURL: "http://localhost:5173", // Doit correspondre à BETTER_AUTH_URL
  plugins: [
    adminClient(),
    oneTapClient({
      clientId: PUBLIC_GOOGLE_CLIENT_ID,  // Votre ID client Google public
    }) as unknown as BetterAuthClientPlugin,
]
});

export const { signIn, signUp, signOut, useSession, verifyEmail } = authClient;