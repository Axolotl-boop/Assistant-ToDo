import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getContexteCourant, sql } from "@/lib/db";
import type { ChargeGlobale } from "@/lib/types";
import { CHARGES } from "@/lib/types";

export const runtime = "nodejs";

const VALID_CHARGES = CHARGES.map((c) => c.value);

export async function GET() {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;
  const contexte = await getContexteCourant();
  return NextResponse.json({ contexte });
}

// Enregistre le contexte de la semaine. Un seul enregistrement par `semaine_du` :
// upsert (mise à jour si la semaine existe déjà, insertion sinon).
export async function POST(req: Request) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const semaine_du = String(body.semaine_du ?? "").trim();
  if (!semaine_du) {
    return NextResponse.json(
      { error: "La date de semaine est requise." },
      { status: 400 },
    );
  }

  const chargeRaw = String(body.charge_globale ?? "normal");
  const charge_globale: ChargeGlobale = VALID_CHARGES.includes(
    chargeRaw as ChargeGlobale,
  )
    ? (chargeRaw as ChargeGlobale)
    : "normal";

  const heures_facturables = String(body.heures_facturables ?? "");
  const temps_dispo_interne = String(body.temps_dispo_interne ?? "");
  const engagements_fixes = String(body.engagements_fixes ?? "");
  const missions_actives = String(body.missions_actives ?? "");

  const { rows: existing } = await sql`
    SELECT id FROM contexte_semaine WHERE semaine_du = ${semaine_du} LIMIT 1;
  `;

  if (existing[0]) {
    await sql`
      UPDATE contexte_semaine SET
        charge_globale = ${charge_globale},
        heures_facturables = ${heures_facturables},
        temps_dispo_interne = ${temps_dispo_interne},
        engagements_fixes = ${engagements_fixes},
        missions_actives = ${missions_actives}
      WHERE id = ${existing[0].id};
    `;
  } else {
    await sql`
      INSERT INTO contexte_semaine
        (semaine_du, charge_globale, heures_facturables, temps_dispo_interne,
         engagements_fixes, missions_actives)
      VALUES
        (${semaine_du}, ${charge_globale}, ${heures_facturables},
         ${temps_dispo_interne}, ${engagements_fixes}, ${missions_actives});
    `;
  }

  const contexte = await getContexteCourant();
  return NextResponse.json({ ok: true, contexte });
}
