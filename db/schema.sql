-- Schéma de référence (miroir de lib/db.ts runMigrations()).
-- Exécutable manuellement dans Vercel Postgres si besoin.

CREATE TABLE IF NOT EXISTS tickets (
  id                serial PRIMARY KEY,
  titre             text NOT NULL,
  demandeur_nom     text NOT NULL DEFAULT '',
  demandeur_type    text NOT NULL,
  source            text NOT NULL DEFAULT '',
  deadline          date,
  deadline_note     text,
  effort_estime     text NOT NULL DEFAULT '',
  domaine           text NOT NULL,
  description       text NOT NULL DEFAULT '',
  quadrant          text,
  verdict           text,
  importance        text,
  critere           text,
  urgence           text,
  argumentaire      text,
  alerte            text,
  elements_langage  text,
  statut_validation text NOT NULL DEFAULT 'propose',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contexte_semaine (
  id                  serial PRIMARY KEY,
  semaine_du          date NOT NULL,
  charge_globale      text NOT NULL DEFAULT 'normal',
  heures_facturables  text NOT NULL DEFAULT '',
  temps_dispo_interne text NOT NULL DEFAULT '',
  engagements_fixes   text NOT NULL DEFAULT '',
  missions_actives    text NOT NULL DEFAULT '',
  created_at          timestamptz NOT NULL DEFAULT now()
);
