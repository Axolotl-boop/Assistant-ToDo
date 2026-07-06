// Migration en ligne de commande : `npm run migrate`.
// Nécessite POSTGRES_URL dans l'environnement (ou un fichier .env chargé par Vercel).
import { runMigrations } from "../lib/db";

runMigrations()
  .then(() => {
    console.log("✅ Migrations appliquées (tables tickets + contexte_semaine).");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Échec des migrations :", err);
    process.exit(1);
  });
