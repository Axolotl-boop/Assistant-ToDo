import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";

// Diagnostic (protégé par auth) : liste les NOMS des variables d'environnement
// liées à une base de données présentes dans le déploiement. Ne renvoie JAMAIS
// les valeurs (secrets) — seulement des indices sûrs pour comprendre pourquoi
// la connexion échoue. À supprimer une fois le problème résolu si tu veux.
export async function GET() {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  const pattern = /POSTGRES|DATABASE|NEON|SUPABASE|STORAGE|PGHOST|PGUSER|PGDATABASE|PRISMA/i;
  const dbVars = Object.keys(process.env)
    .filter((k) => pattern.test(k))
    .sort()
    .map((name) => {
      const v = process.env[name] ?? "";
      return {
        name,
        // Indices sûrs, sans exposer le secret :
        looks_like_pg_url: v.startsWith("postgres://") || v.startsWith("postgresql://"),
        is_pooled: v.includes("-pooler."),
        length: v.length,
      };
    });

  return NextResponse.json({
    found: dbVars.length,
    db_related_env_var_names: dbVars,
    note:
      dbVars.length === 0
        ? "Aucune variable de base de données trouvée : la base n'est probablement pas connectée à ce projet Vercel (Storage -> Connect Project), ou les variables ne sont pas activées pour cet environnement."
        : "Variables détectées. Si POSTGRES_URL n'y est pas mais qu'une autre y est (ex : DATABASE_URL), le code doit la mapper — vérifie qu'elle est bien 'pooled' (is_pooled = true).",
  });
}
