import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./session";

/**
 * Vérifie la session côté serveur (routes API + Server Components).
 * Défense en profondeur : le middleware protège déjà les routes, mais chaque
 * route API revérifie explicitement (§2 : « Toutes les routes API vérifient la session »).
 */
export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/**
 * Helper pour les routes API : renvoie une réponse 401 si non authentifié,
 * sinon null (continuer le traitement).
 */
export async function requireAuth(): Promise<NextResponse | null> {
  if (await isAuthenticated()) return null;
  return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
}
