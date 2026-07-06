import { readFileSync } from "fs";
import { join } from "path";

/**
 * SYSTEM_PROMPT — contenu intégral de `lib/system-prompt.md`, chargé tel quel.
 *
 * Ce prompt est isolé volontairement : il évolue souvent et ne doit JAMAIS être
 * fragmenté dans la logique métier. Pour l'éditer, modifie uniquement le fichier
 * markdown `lib/system-prompt.md` — aucune ligne de code applicatif à toucher.
 *
 * La consigne de format de sortie JSON (§7 du brief) N'EST PAS incluse ici :
 * elle est ajoutée en fin de prompt uniquement au moment de l'appel API
 * (voir `lib/classer.ts`), pour ne pas polluer le prompt de référence.
 */
export const SYSTEM_PROMPT: string = readFileSync(
  join(process.cwd(), "lib", "system-prompt.md"),
  "utf8",
);
