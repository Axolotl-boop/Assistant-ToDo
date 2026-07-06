import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { runMigrations } from "@/lib/db";

export const runtime = "nodejs";

// Applique les migrations (idempotent). À appeler une fois après déploiement,
// authentifié. GET pour pouvoir le déclencher depuis le navigateur.
export async function GET() {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    await runMigrations();
    return NextResponse.json({ ok: true, message: "Tables prêtes." });
  } catch (err) {
    console.error("Migration error:", err);
    return NextResponse.json(
      { error: "Échec des migrations.", detail: String(err) },
      { status: 500 },
    );
  }
}
