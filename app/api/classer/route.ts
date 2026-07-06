import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getContexteCourant, getTicket, sql } from "@/lib/db";
import { callClaude } from "@/lib/classer";

export const runtime = "nodejs";
// Le classement IA peut prendre quelques secondes.
export const maxDuration = 60;

// Reçoit { id } d'un ticket existant, appelle l'IA, écrit la PROPOSITION en base.
// Ne fige rien : statut_validation reste 'propose' (§5).
export async function POST(req: Request) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  let id: number;
  try {
    const body = await req.json();
    id = Number(body?.id);
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID invalide." }, { status: 400 });
  }

  const ticket = await getTicket(id);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket introuvable." }, { status: 404 });
  }

  const contexte = await getContexteCourant();
  const result = await callClaude(ticket, contexte);

  if (!result.ok || !result.classement) {
    // Parsing/appel échoué : on renvoie le brut pour classement manuel (§7).
    return NextResponse.json(
      { ok: false, error: result.error, raw: result.raw ?? null },
      { status: 502 },
    );
  }

  const c = result.classement;
  const { rows } = await sql`
    UPDATE tickets SET
      quadrant = ${c.quadrant},
      verdict = ${c.verdict},
      importance = ${c.importance},
      critere = ${c.critere},
      urgence = ${c.urgence},
      argumentaire = ${c.argumentaire},
      alerte = ${c.alerte},
      elements_langage = ${c.elements_langage},
      statut_validation = 'propose',
      updated_at = now()
    WHERE id = ${id}
    RETURNING *;
  `;

  return NextResponse.json({ ok: true, ticket: rows[0], raw: result.raw });
}
