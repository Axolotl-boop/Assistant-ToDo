import { sql } from "@vercel/postgres";
import type { ContexteSemaine, Ticket } from "./types";

// --- Résolution de la chaîne de connexion Postgres ---------------------------
// `@vercel/postgres` ne lit QUE `POSTGRES_URL`. Or l'intégration Neon (via le
// Marketplace Vercel, qui a remplacé « Vercel Postgres ») expose souvent la
// connexion sous un autre nom : `DATABASE_URL`. On mappe donc les noms usuels
// vers `POSTGRES_URL`. Le pool de `sql` est créé paresseusement à la première
// requête : peupler l'env ici (au chargement du module) suffit à ce qu'il le lise.
//
// `createPool` exige une chaîne « pooled » (hôte en `-pooler.`) : on la privilégie.
function resolvePostgresUrl(): string | undefined {
  const candidates = [
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.DATABASE_URL_UNPOOLED,
    process.env.POSTGRES_URL_NON_POOLING,
  ].filter((v): v is string => Boolean(v) && v !== "undefined");

  const pooled = candidates.find(
    (s) => s.includes("-pooler.") || s.includes("localhost"),
  );
  return pooled ?? candidates[0];
}

if (!process.env.POSTGRES_URL) {
  const resolved = resolvePostgresUrl();
  if (resolved) process.env.POSTGRES_URL = resolved;
}

export { sql };

/**
 * Crée les deux tables si elles n'existent pas (idempotent).
 * Appelée par la route `/api/migrate` et le script `scripts/migrate.ts`.
 */
export async function runMigrations(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS tickets (
      id                serial PRIMARY KEY,
      titre             text NOT NULL,
      demandeur_nom     text NOT NULL DEFAULT '',
      demandeur_type    text NOT NULL,
      source            text NOT NULL DEFAULT '',
      deadline          date,
      deadline_note     text,
      effort_estime     text NOT NULL DEFAULT '',
      domaine           text NOT NULL,
      description       text NOT NULL DEFAULT '',
      quadrant          text,
      verdict           text,
      importance        text,
      critere           text,
      urgence           text,
      argumentaire      text,
      alerte            text,
      elements_langage  text,
      statut_validation text NOT NULL DEFAULT 'propose',
      created_at        timestamptz NOT NULL DEFAULT now(),
      updated_at        timestamptz NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS contexte_semaine (
      id                  serial PRIMARY KEY,
      semaine_du          date NOT NULL,
      charge_globale      text NOT NULL DEFAULT 'normal',
      heures_facturables  text NOT NULL DEFAULT '',
      temps_dispo_interne text NOT NULL DEFAULT '',
      engagements_fixes   text NOT NULL DEFAULT '',
      missions_actives    text NOT NULL DEFAULT '',
      created_at          timestamptz NOT NULL DEFAULT now()
    );
  `;
}

/**
 * Récupère le contexte de semaine le plus récent (Couche 3 dynamique).
 */
export async function getContexteCourant(): Promise<ContexteSemaine | null> {
  const { rows } = await sql<ContexteSemaine>`
    SELECT * FROM contexte_semaine
    ORDER BY semaine_du DESC, id DESC
    LIMIT 1;
  `;
  return rows[0] ?? null;
}

export async function listTickets(): Promise<Ticket[]> {
  const { rows } = await sql<Ticket>`
    SELECT * FROM tickets ORDER BY created_at DESC, id DESC;
  `;
  return rows;
}

export async function getTicket(id: number): Promise<Ticket | null> {
  const { rows } = await sql<Ticket>`SELECT * FROM tickets WHERE id = ${id};`;
  return rows[0] ?? null;
}
