// Types partagés + valeurs autorisées (enums) alignées sur le modèle de données (§3).

export type DemandeurType = "client" | "ceo_cdb" | "pad" | "kr_owner" | "pair";
export type Domaine =
  | "pm"
  | "qa"
  | "product_ops"
  | "data_ia"
  | "pmm"
  | "transverse"
  | "mission_client";
export type Quadrant = "q1" | "q2" | "q3" | "q4";
export type Verdict =
  | "faire"
  | "planifier"
  | "deleguer"
  | "eliminer"
  | "escalader"
  | "defacturation";
export type Importance = "important" | "non_important";
export type Critere = "a1" | "a2" | "a3" | "a4" | "aucun" | "anti_rescue";
export type Urgence = "vraie" | "fausse";
export type StatutValidation = "propose" | "valide" | "revise" | "rejete";
export type ChargeGlobale = "leger" | "normal" | "sature";

export interface Ticket {
  id: number;
  titre: string;
  demandeur_nom: string;
  demandeur_type: DemandeurType;
  source: string;
  deadline: string | null; // ISO date (yyyy-mm-dd) ou null
  deadline_note: string | null;
  effort_estime: string;
  domaine: Domaine;
  description: string;
  quadrant: Quadrant | null;
  verdict: Verdict | null;
  importance: Importance | null;
  critere: Critere | null;
  urgence: Urgence | null;
  argumentaire: string | null;
  alerte: string | null;
  elements_langage: string | null;
  statut_validation: StatutValidation;
  created_at: string;
  updated_at: string;
}

export interface ContexteSemaine {
  id: number;
  semaine_du: string; // ISO date
  charge_globale: ChargeGlobale;
  heures_facturables: string;
  temps_dispo_interne: string;
  engagements_fixes: string;
  missions_actives: string;
  created_at: string;
}

// Sortie JSON attendue de l'IA (§7).
export interface ClassementIA {
  quadrant: Quadrant;
  verdict: Verdict;
  importance: Importance;
  critere: Critere;
  urgence: Urgence;
  argumentaire: string;
  alerte: string | null;
  elements_langage: string | null;
}

// --- Listes de valeurs pour les <select> côté formulaires ---

export const DEMANDEUR_TYPES: { value: DemandeurType; label: string }[] = [
  { value: "client", label: "Client" },
  { value: "ceo_cdb", label: "CEO / Conseil de Bord" },
  { value: "pad", label: "PAD (commercial)" },
  { value: "kr_owner", label: "KR Owner" },
  { value: "pair", label: "Pair" },
];

export const DOMAINES: { value: Domaine; label: string }[] = [
  { value: "pm", label: "PM" },
  { value: "qa", label: "QA" },
  { value: "product_ops", label: "Product Ops" },
  { value: "data_ia", label: "Data / IA" },
  { value: "pmm", label: "PMM" },
  { value: "transverse", label: "Transverse" },
  { value: "mission_client", label: "Mission client" },
];

export const CHARGES: { value: ChargeGlobale; label: string }[] = [
  { value: "leger", label: "Léger" },
  { value: "normal", label: "Normal" },
  { value: "sature", label: "Saturé" },
];

export const QUADRANTS: {
  value: Quadrant;
  titre: string;
  sous_titre: string;
}[] = [
  { value: "q1", titre: "Q1 — Important & Urgent", sous_titre: "Faire" },
  {
    value: "q2",
    titre: "Q2 — Important & Non urgent",
    sous_titre: "Planifier & protéger",
  },
  { value: "q3", titre: "Q3 — Non important & Urgent", sous_titre: "Déléguer" },
  {
    value: "q4",
    titre: "Q4 — Non important & Non urgent",
    sous_titre: "Éliminer / refuser",
  },
];

export const VERDICTS: { value: Verdict; label: string }[] = [
  { value: "faire", label: "Faire" },
  { value: "planifier", label: "Planifier" },
  { value: "deleguer", label: "Déléguer" },
  { value: "eliminer", label: "Éliminer" },
  { value: "escalader", label: "Escalader" },
  { value: "defacturation", label: "Candidat défacturation" },
];

export const CRITERES: { value: Critere; label: string }[] = [
  { value: "a1", label: "A1 — avance un KR / priorité Q2" },
  { value: "a2", label: "A2 — impact revenu direct" },
  { value: "a3", label: "A3 — only-me (décision centrale)" },
  { value: "a4", label: "A4 — porte irréversible / gouvernance" },
  { value: "aucun", label: "Aucun critère A" },
  { value: "anti_rescue", label: "Règle anti-rescue (accountability KR Owner)" },
];

// Ensembles de validation pour parser la sortie IA en toute sûreté.
export const VALID_QUADRANTS: Quadrant[] = ["q1", "q2", "q3", "q4"];
export const VALID_VERDICTS: Verdict[] = [
  "faire",
  "planifier",
  "deleguer",
  "eliminer",
  "escalader",
  "defacturation",
];
export const VALID_IMPORTANCE: Importance[] = ["important", "non_important"];
export const VALID_CRITERE: Critere[] = [
  "a1",
  "a2",
  "a3",
  "a4",
  "aucun",
  "anti_rescue",
];
export const VALID_URGENCE: Urgence[] = ["vraie", "fausse"];

export function labelFor<T extends string>(
  list: { value: T; label: string }[],
  value: T | null | undefined,
): string {
  if (!value) return "—";
  return list.find((x) => x.value === value)?.label ?? value;
}
