import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listTickets, sql } from "@/lib/db";
import {
  DEMANDEUR_TYPES,
  DOMAINES,
  type DemandeurType,
  type Domaine,
} from "@/lib/types";

export const runtime = "nodejs";

const VALID_DEMANDEUR = DEMANDEUR_TYPES.map((d) => d.value);
const VALID_DOMAINE = DOMAINES.map((d) => d.value);

export async function GET() {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;
  const tickets = await listTickets();
  return NextResponse.json({ tickets });
}

// Création d'un ticket (sans classement IA : quadrant/verdict restent null,
// statut_validation = 'propose' par défaut).
export async function POST(req: Request) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const titre = String(body.titre ?? "").trim();
  if (!titre) {
    return NextResponse.json({ error: "Le titre est requis." }, { status: 400 });
  }

  const demandeur_type = String(body.demandeur_type ?? "");
  if (!VALID_DEMANDEUR.includes(demandeur_type as DemandeurType)) {
    return NextResponse.json(
      { error: "Type de demandeur invalide." },
      { status: 400 },
    );
  }
  const domaine = String(body.domaine ?? "");
  if (!VALID_DOMAINE.includes(domaine as Domaine)) {
    return NextResponse.json({ error: "Domaine invalide." }, { status: 400 });
  }

  const demandeur_nom = String(body.demandeur_nom ?? "");
  const source = String(body.source ?? "");
  const deadlineRaw = String(body.deadline ?? "").trim();
  const deadline = deadlineRaw === "" ? null : deadlineRaw;
  const deadlineNoteRaw = String(body.deadline_note ?? "").trim();
  const deadline_note = deadlineNoteRaw === "" ? null : deadlineNoteRaw;
  const effort_estime = String(body.effort_estime ?? "");
  const description = String(body.description ?? "");

  const { rows } = await sql`
    INSERT INTO tickets
      (titre, demandeur_nom, demandeur_type, source, deadline, deadline_note,
       effort_estime, domaine, description)
    VALUES
      (${titre}, ${demandeur_nom}, ${demandeur_type}, ${source}, ${deadline},
       ${deadline_note}, ${effort_estime}, ${domaine}, ${description})
    RETURNING id;
  `;

  return NextResponse.json({ ok: true, id: rows[0].id });
}
