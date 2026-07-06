import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getTicket, sql } from "@/lib/db";
import {
  DEMANDEUR_TYPES,
  DOMAINES,
  VALID_CRITERE,
  VALID_IMPORTANCE,
  VALID_QUADRANTS,
  VALID_URGENCE,
  VALID_VERDICTS,
} from "@/lib/types";

export const runtime = "nodejs";

// Champs éditables + les valeurs autorisées pour ceux qui sont contraints.
const ENUM_FIELDS: Record<string, readonly string[]> = {
  demandeur_type: DEMANDEUR_TYPES.map((d) => d.value),
  domaine: DOMAINES.map((d) => d.value),
  quadrant: VALID_QUADRANTS,
  verdict: VALID_VERDICTS,
  importance: VALID_IMPORTANCE,
  critere: VALID_CRITERE,
  urgence: VALID_URGENCE,
  statut_validation: ["propose", "valide", "revise", "rejete"],
};

// Colonnes autorisées en écriture (jamais id/created_at).
const WRITABLE = new Set([
  "titre",
  "demandeur_nom",
  "demandeur_type",
  "source",
  "deadline",
  "deadline_note",
  "effort_estime",
  "domaine",
  "description",
  "quadrant",
  "verdict",
  "importance",
  "critere",
  "urgence",
  "argumentaire",
  "alerte",
  "elements_langage",
  "statut_validation",
]);

// Colonnes qui acceptent NULL (pour vider une valeur).
const NULLABLE = new Set([
  "deadline",
  "deadline_note",
  "quadrant",
  "verdict",
  "importance",
  "critere",
  "urgence",
  "argumentaire",
  "alerte",
  "elements_langage",
]);

async function parseId(params: Promise<{ id: string }>): Promise<number | null> {
  const { id } = await params;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  const id = await parseId(ctx.params);
  if (id === null)
    return NextResponse.json({ error: "ID invalide." }, { status: 400 });

  const ticket = await getTicket(id);
  if (!ticket)
    return NextResponse.json({ error: "Ticket introuvable." }, { status: 404 });
  return NextResponse.json({ ticket });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  const id = await parseId(ctx.params);
  if (id === null)
    return NextResponse.json({ error: "ID invalide." }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const sets: string[] = [];
  const values: unknown[] = [];

  for (const [key, raw] of Object.entries(body)) {
    if (!WRITABLE.has(key)) continue;

    let value: string | null;
    if (raw === null || raw === "") {
      if (!NULLABLE.has(key)) continue; // ignore vidage d'un champ non-nullable
      value = null;
    } else {
      value = String(raw);
    }

    // Validation des enums.
    if (value !== null && ENUM_FIELDS[key] && !ENUM_FIELDS[key].includes(value)) {
      return NextResponse.json(
        { error: `Valeur invalide pour ${key}.` },
        { status: 400 },
      );
    }

    values.push(value);
    sets.push(`${key} = $${values.length}`);
  }

  if (sets.length === 0) {
    return NextResponse.json(
      { error: "Aucun champ à mettre à jour." },
      { status: 400 },
    );
  }

  values.push(id);
  const query = `UPDATE tickets SET ${sets.join(
    ", ",
  )}, updated_at = now() WHERE id = $${values.length} RETURNING *;`;

  const { rows } = await sql.query(query, values);
  if (rows.length === 0)
    return NextResponse.json({ error: "Ticket introuvable." }, { status: 404 });

  return NextResponse.json({ ok: true, ticket: rows[0] });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  const id = await parseId(ctx.params);
  if (id === null)
    return NextResponse.json({ error: "ID invalide." }, { status: 400 });

  await sql`DELETE FROM tickets WHERE id = ${id};`;
  return NextResponse.json({ ok: true });
}
