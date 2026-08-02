// src/lib/auth-permissions.ts
import { createAccessControl } from "better-auth/plugins/access";

// 1. Définition du schéma d'accès (Ressources x Actions)
export const statement = {
  project: ["create", "read", "update", "delete"],
  comment: ["create", "delete"],
  user: ["read", "ban"],
} as const;

export const ac = createAccessControl(statement);

// 2. Définition des rôles et attribution des permissions
export const userRole = ac.newRole({
  project: ["read"],
  comment: ["create"],
});

export const editorRole = ac.newRole({
  project: ["create", "read", "update"],
  comment: ["create", "delete"],
});

export const adminRole = ac.newRole({
  project: ["create", "read", "update", "delete"],
  comment: ["create", "delete"],
  user: ["read", "ban"],
});

// 3. Exportation de la carte globale des rôles
export const roles = {
  user: userRole,
  editor: editorRole,
  admin: adminRole,
};