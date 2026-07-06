import { SYSTEM_PROMPT } from "./system-prompt";
import {
  VALID_CRITERE,
  VALID_IMPORTANCE,
  VALID_QUADRANTS,
  VALID_URGENCE,
  VALID_VERDICTS,
  type ClassementIA,
  type ContexteSemaine,
  type Ticket,
} from "./types";
import { DEMANDEUR_TYPES, DOMAINES, CHARGES, labelFor } from "./types";

// Modèle verrouillé par le brief (§5).
export const CLAUDE_MODEL = "claude-sonnet-4-6";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

// Consigne de format de sortie (§7). Ajoutée en fin de prompt UNIQUEMENT pour
// l'appel API — le prompt système de référence reste intact.
const OUTPUT_INSTRUCTION = `

---

## FORMAT DE SORTIE (APPEL API — IMPÉRATIF)

Pour cet appel, ne réponds PAS au format lisible habituel. Réponds UNIQUEMENT
par un objet JSON valide, sans préambule, sans commentaire, sans backticks.
Structure exacte :

{
  "quadrant": "q1|q2|q3|q4",
  "verdict": "faire|planifier|deleguer|eliminer|escalader|defacturation",
  "importance": "important|non_important",
  "critere": "a1|a2|a3|a4|aucun|anti_rescue",
  "urgence": "vraie|fausse",
  "argumentaire": "2-3 lignes qui tiennent le rubric",
  "alerte": "texte court ou null",
  "elements_langage": "texte ou null (rempli si verdict deleguer/eliminer, ou Q3/Q4)"
}

Contraintes :
- "critere" = "anti_rescue" si la RÈGLE ANTI-RESCUE s'applique (accountability d'un KR Owner).
- "elements_langage" DOIT être rempli pour un ticket Q3 (déléguer) ou Q4 (éliminer/refuser).
- "alerte" signale notamment : tâche Q2 menacée, rescue reflex détecté, candidat défacturation.
- Renvoie null (le littéral JSON, pas la chaîne "null") quand un champ optionnel est vide.`;

export function buildSystemPrompt(): string {
  return SYSTEM_PROMPT + OUTPUT_INSTRUCTION;
}

// Bloc « MA SEMAINE » rempli depuis contexte_semaine (§5).
export function formatSemaine(contexte: ContexteSemaine | null): string {
  if (!contexte) {
    return `MA SEMAINE : (non renseignée — aucun contexte de semaine saisi)`;
  }
  return `MA SEMAINE
Semaine du : ${contexte.semaine_du?.slice(0, 10) ?? "—"}
Niveau de charge global : ${labelFor(CHARGES, contexte.charge_globale)}
Heures facturables client engagées cette semaine : ${contexte.heures_facturables || "—"}
Temps réellement disponible pour l'interne : ${contexte.temps_dispo_interne || "—"}
Engagements fixes / deadlines datées cette semaine :
${contexte.engagements_fixes || "—"}
Missions client actives : ${contexte.missions_actives || "—"}`;
}

// Ticket formaté selon le gabarit du prompt système.
export function formatTicket(ticket: Ticket): string {
  const deadline =
    ticket.deadline?.slice(0, 10) ||
    ticket.deadline_note ||
    "aucune";
  return `TICKET À CLASSER
Titre : ${ticket.titre}
Demandeur : ${ticket.demandeur_nom} (type : ${labelFor(DEMANDEUR_TYPES, ticket.demandeur_type)})
Source / canal : ${ticket.source || "—"}
Deadline : ${deadline}
Effort estimé : ${ticket.effort_estime || "—"}
Domaine : ${labelFor(DOMAINES, ticket.domaine)}
Description : ${ticket.description || "—"}`;
}

export function buildUserMessage(
  ticket: Ticket,
  contexte: ContexteSemaine | null,
): string {
  return `${formatSemaine(contexte)}\n\n${formatTicket(ticket)}`;
}

// Retire d'éventuels backticks / fences ```json avant JSON.parse (§7).
function stripFences(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```[a-zA-Z]*\s*/, "").replace(/\s*```$/, "");
  }
  // Si du texte entoure le JSON, on isole le premier objet {...}.
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first >= 0 && last > first) s = s.slice(first, last + 1);
  return s.trim();
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

function nullableText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (s === "" || s.toLowerCase() === "null") return null;
  return s;
}

/**
 * Parse la réponse brute de l'IA en ClassementIA validé, ou null si invalide.
 */
export function parseClassement(raw: string): ClassementIA | null {
  let obj: unknown;
  try {
    obj = JSON.parse(stripFences(raw));
  } catch {
    return null;
  }
  if (typeof obj !== "object" || obj === null) return null;
  const o = obj as Record<string, unknown>;

  const quadrant = oneOf(o.quadrant, VALID_QUADRANTS);
  const verdict = oneOf(o.verdict, VALID_VERDICTS);
  const importance = oneOf(o.importance, VALID_IMPORTANCE);
  const critere = oneOf(o.critere, VALID_CRITERE);
  const urgence = oneOf(o.urgence, VALID_URGENCE);

  // Les champs enum sont obligatoires ; sinon le classement n'est pas fiable.
  if (!quadrant || !verdict || !importance || !critere || !urgence) return null;

  return {
    quadrant,
    verdict,
    importance,
    critere,
    urgence,
    argumentaire: nullableText(o.argumentaire) ?? "",
    alerte: nullableText(o.alerte),
    elements_langage: nullableText(o.elements_langage),
  };
}

export interface ClasserResult {
  ok: boolean;
  classement?: ClassementIA;
  raw?: string; // réponse brute (utile si parsing échoué)
  error?: string;
}

/**
 * Appelle l'API Claude côté serveur et renvoie le classement parsé.
 * La clé ANTHROPIC_API_KEY ne quitte jamais le serveur.
 */
export async function callClaude(
  ticket: Ticket,
  contexte: ContexteSemaine | null,
): Promise<ClasserResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "ANTHROPIC_API_KEY non configurée." };
  }

  let res: Response;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: buildSystemPrompt(),
        messages: [{ role: "user", content: buildUserMessage(ticket, contexte) }],
      }),
    });
  } catch (err) {
    return { ok: false, error: `Erreur réseau vers l'API Claude : ${String(err)}` };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return {
      ok: false,
      error: `API Claude a répondu ${res.status}. ${detail.slice(0, 500)}`,
    };
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const raw =
    data.content
      ?.filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("")
      .trim() ?? "";

  const classement = parseClassement(raw);
  if (!classement) {
    // Échec de parsing : on renvoie le brut pour classement manuel (§7).
    return { ok: false, raw, error: "Réponse IA non parsable en JSON." };
  }
  return { ok: true, classement, raw };
}
