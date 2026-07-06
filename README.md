# Priorisation Eisenhower — assistée par IA

App perso mono-utilisateur : créer des tâches en **tickets**, les faire classer
sur une **matrice d'Eisenhower** par l'API Claude nourrie de mon contexte, puis
**valider** (confirmer / réviser / rejeter) chaque proposition. L'IA propose,
l'humain décide.

## Stack

- **Next.js** (App Router) — front + routes API serverless.
- **Vercel Postgres** (`@vercel/postgres`).
- **Auth** : mot de passe unique (`APP_PASSWORD`) + cookie de session signé.
- **API Claude** (`claude-sonnet-4-6`) appelée **uniquement côté serveur**.
- **Tailwind** pour le style (simple et propre).

## Variables d'environnement

Copier `.env.example` vers `.env.local` (dev) ou configurer sur Vercel :

```
ANTHROPIC_API_KEY=...   # serveur uniquement, jamais côté client
APP_PASSWORD=...        # mot de passe d'accès unique
POSTGRES_URL=...        # fourni par Vercel Postgres
SESSION_SECRET=...      # secret pour signer le cookie (openssl rand -hex 32)
```

## Démarrage

```bash
npm install
npm run dev
```

Puis se connecter avec `APP_PASSWORD`.

## Migrations (créer les 2 tables)

Deux options :

1. En ligne de commande : `npm run migrate` (nécessite `POSTGRES_URL`).
2. Une fois connecté dans l'app, visiter **`/api/migrate`** (idempotent).

Le schéma de référence est aussi dans `db/schema.sql`.

## Le prompt système

Le fichier `lib/system-prompt.md` contient le prompt de priorisation **tel
quel**. Il est chargé comme constante `SYSTEM_PROMPT` (`lib/system-prompt.ts`)
et isolé de la logique métier : pour le faire évoluer, éditer uniquement ce
markdown. La consigne de sortie JSON est ajoutée séparément au moment de
l'appel API (`lib/classer.ts`), pas dans le prompt de référence.

## Écrans

- `/login` — mot de passe unique.
- `/semaine` — édition du contexte de la semaine (Couche 3 dynamique).
- `/tickets/new` — nouveau ticket ; « Classer » appelle l'IA.
- `/tickets/[id]` — détail + proposition IA + Confirmer / Réviser / Rejeter.
- `/matrice` — grille 2×2 Eisenhower.

## Périmètre

v1 uniquement (voir le brief technique). Hors périmètre : multi-utilisateur,
notifications, intégrations externes, historique/analytics, drag-and-drop,
génération récurrente.
