"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CRITERES,
  DEMANDEUR_TYPES,
  DOMAINES,
  QUADRANTS,
  VERDICTS,
  labelFor,
  type Quadrant,
  type Ticket,
} from "@/lib/types";

const STATUT_LABEL: Record<Ticket["statut_validation"], string> = {
  propose: "Proposé",
  valide: "Validé",
  revise: "Révisé",
  rejete: "Rejeté",
};

const STATUT_STYLE: Record<Ticket["statut_validation"], string> = {
  propose: "bg-amber-100 text-amber-800",
  valide: "bg-green-100 text-green-800",
  revise: "bg-blue-100 text-blue-800",
  rejete: "bg-gray-200 text-gray-600",
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value || "—"}</dd>
    </div>
  );
}

export default function TicketDetail({ initial }: { initial: Ticket }) {
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revising, setRevising] = useState(false);
  const [reviseQuadrant, setReviseQuadrant] = useState<Quadrant>(
    ticket.quadrant ?? "q2",
  );

  const classified = Boolean(ticket.quadrant);

  async function patch(payload: Partial<Ticket>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Échec de la mise à jour.");
        return false;
      }
      setTicket(data.ticket);
      router.refresh();
      return true;
    } catch {
      setError("Erreur réseau.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function onConfirmer() {
    await patch({ statut_validation: "valide" });
  }

  async function onRejeter() {
    await patch({ statut_validation: "rejete" });
  }

  async function onReviserSubmit() {
    const ok = await patch({
      statut_validation: "revise",
      quadrant: reviseQuadrant,
    });
    if (ok) setRevising(false);
  }

  async function onReclasser() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/classer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticket.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data.error
            ? `Classement impossible : ${data.error}` +
                (data.raw ? `\n\nRéponse brute :\n${data.raw}` : "")
            : "Classement impossible.",
        );
        return;
      }
      setTicket(data.ticket);
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!confirm("Supprimer définitivement ce ticket ?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/matrice");
        router.refresh();
      } else {
        setError("Échec de la suppression.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête ticket */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold">{ticket.titre}</h1>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUT_STYLE[ticket.statut_validation]}`}
          >
            {STATUT_LABEL[ticket.statut_validation]}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field
            label="Demandeur"
            value={`${ticket.demandeur_nom || "—"} · ${labelFor(DEMANDEUR_TYPES, ticket.demandeur_type)}`}
          />
          <Field label="Source" value={ticket.source} />
          <Field label="Domaine" value={labelFor(DOMAINES, ticket.domaine)} />
          <Field
            label="Deadline"
            value={
              ticket.deadline?.slice(0, 10) ||
              ticket.deadline_note ||
              "aucune"
            }
          />
          <Field label="Effort estimé" value={ticket.effort_estime} />
        </dl>
        {ticket.description && (
          <div className="mt-4">
            <dt className="text-xs uppercase tracking-wide text-gray-400">
              Description
            </dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-sm text-gray-900">
              {ticket.description}
            </dd>
          </div>
        )}
      </div>

      {/* Proposition IA */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Proposition de l'IA
        </h2>

        {!classified ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Ce ticket n'a pas encore été classé.
            </p>
            <button
              onClick={onReclasser}
              disabled={busy}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? "Classement…" : "Classer avec l'IA"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>
                🎯 {labelFor(QUADRANTS.map((q) => ({ value: q.value, label: q.titre })), ticket.quadrant)}
              </Badge>
              <Badge>Verdict : {labelFor(VERDICTS, ticket.verdict)}</Badge>
              <Badge>
                {ticket.importance === "important"
                  ? "Important"
                  : "Non important"}
              </Badge>
              <Badge>Critère : {labelFor(CRITERES, ticket.critere)}</Badge>
              <Badge>
                Urgence :{" "}
                {ticket.urgence === "vraie" ? "Vraie (datée)" : "Fausse"}
              </Badge>
            </div>

            {ticket.argumentaire && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">
                  Argumentaire
                </dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-sm text-gray-900">
                  {ticket.argumentaire}
                </dd>
              </div>
            )}

            {ticket.alerte && (
              <div className="rounded border border-amber-200 bg-amber-50 p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  ⚠️ Alerte
                </dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-sm text-amber-900">
                  {ticket.alerte}
                </dd>
              </div>
            )}

            {ticket.elements_langage && (
              <div className="rounded border border-blue-200 bg-blue-50 p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  💬 Éléments de langage
                </dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-sm text-blue-900">
                  {ticket.elements_langage}
                </dd>
              </div>
            )}

            <div className="pt-1">
              <button
                onClick={onReclasser}
                disabled={busy}
                className="text-sm text-gray-500 underline hover:text-gray-900 disabled:opacity-50"
              >
                Reclasser avec l'IA
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Validation humaine */}
      {classified && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Ma décision
          </h2>

          {revising ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium">
                Quadrant retenu
              </label>
              <select
                value={reviseQuadrant}
                onChange={(e) => setReviseQuadrant(e.target.value as Quadrant)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              >
                {QUADRANTS.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.titre} — {q.sous_titre}
                  </option>
                ))}
              </select>
              <div className="flex gap-3">
                <button
                  onClick={onReviserSubmit}
                  disabled={busy}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Enregistrer la révision
                </button>
                <button
                  onClick={() => setRevising(false)}
                  disabled={busy}
                  className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onConfirmer}
                disabled={busy}
                className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Confirmer
              </button>
              <button
                onClick={() => {
                  setReviseQuadrant(ticket.quadrant ?? "q2");
                  setRevising(true);
                }}
                disabled={busy}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Réviser
              </button>
              <button
                onClick={onRejeter}
                disabled={busy}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Rejeter
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="whitespace-pre-wrap rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="pt-2">
        <button
          onClick={onDelete}
          disabled={busy}
          className="text-sm text-red-600 hover:underline disabled:opacity-50"
        >
          Supprimer ce ticket
        </button>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
      {children}
    </span>
  );
}
