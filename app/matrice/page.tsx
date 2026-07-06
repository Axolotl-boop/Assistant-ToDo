import Link from "next/link";
import Nav from "@/components/Nav";
import { listTickets } from "@/lib/db";
import {
  DEMANDEUR_TYPES,
  labelFor,
  type Quadrant,
  type Ticket,
} from "@/lib/types";

export const dynamic = "force-dynamic";

// Disposition Eisenhower : Q2 haut-gauche, Q1 haut-droite, Q4 bas-gauche, Q3 bas-droite.
const GRID: {
  q: Quadrant;
  titre: string;
  sous: string;
  accent: string;
}[] = [
  { q: "q2", titre: "Q2 · Important — Non urgent", sous: "Planifier & protéger", accent: "border-t-4 border-t-emerald-500" },
  { q: "q1", titre: "Q1 · Important — Urgent", sous: "Faire", accent: "border-t-4 border-t-red-500" },
  { q: "q4", titre: "Q4 · Non important — Non urgent", sous: "Éliminer / refuser", accent: "border-t-4 border-t-gray-400" },
  { q: "q3", titre: "Q3 · Non important — Urgent", sous: "Déléguer", accent: "border-t-4 border-t-amber-500" },
];

function Card({ ticket }: { ticket: Ticket }) {
  const propose = ticket.statut_validation === "propose";
  const revise = ticket.statut_validation === "revise";
  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className={`block rounded-md border bg-white p-3 text-sm shadow-sm transition hover:shadow ${
        propose
          ? "border-dashed border-amber-400"
          : "border-solid border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-gray-900">{ticket.titre}</span>
        {propose && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
            proposé
          </span>
        )}
        {revise && (
          <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800">
            révisé
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {ticket.demandeur_nom || "—"} ·{" "}
        {labelFor(DEMANDEUR_TYPES, ticket.demandeur_type)}
      </p>
    </Link>
  );
}

export default async function MatricePage() {
  const all = await listTickets();

  // On affiche les tickets classés et non rejetés dans leur quadrant.
  const byQuadrant: Record<Quadrant, Ticket[]> = { q1: [], q2: [], q3: [], q4: [] };
  const nonClasses: Ticket[] = [];
  for (const t of all) {
    if (t.statut_validation === "rejete") continue;
    if (t.quadrant) byQuadrant[t.quadrant].push(t);
    else nonClasses.push(t);
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Matrice d'Eisenhower</h1>
            <p className="text-sm text-gray-500">
              Axe horizontal : urgence · Axe vertical : importance
            </p>
          </div>
          <Link
            href="/tickets/new"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nouveau ticket
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {GRID.map(({ q, titre, sous, accent }) => (
            <section
              key={q}
              className={`min-h-[220px] rounded-lg border border-gray-200 bg-gray-50 p-4 ${accent}`}
            >
              <header className="mb-3">
                <h2 className="text-sm font-semibold text-gray-900">{titre}</h2>
                <p className="text-xs text-gray-500">{sous}</p>
              </header>
              <div className="space-y-2">
                {byQuadrant[q].length === 0 ? (
                  <p className="text-xs text-gray-400">Aucun ticket.</p>
                ) : (
                  byQuadrant[q].map((t) => <Card key={t.id} ticket={t} />)
                )}
              </div>
            </section>
          ))}
        </div>

        {nonClasses.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">
              Non classés ({nonClasses.length})
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {nonClasses.map((t) => (
                <Card key={t.id} ticket={t} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
