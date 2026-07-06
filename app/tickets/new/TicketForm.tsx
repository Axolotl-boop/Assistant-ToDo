"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEMANDEUR_TYPES, DOMAINES } from "@/lib/types";

const empty = {
  titre: "",
  demandeur_nom: "",
  demandeur_type: "client",
  source: "",
  deadline: "",
  deadline_note: "",
  effort_estime: "",
  domaine: "pm",
  description: "",
};

export default function TicketForm() {
  const router = useRouter();
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState<null | "save" | "classer">(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function createTicket(): Promise<number | null> {
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Échec de la création du ticket.");
      return null;
    }
    const data = await res.json();
    return data.id as number;
  }

  // « Classer » : crée le ticket puis lance le classement IA, puis va au détail.
  async function onClasser(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titre.trim()) {
      setError("Le titre est requis.");
      return;
    }
    setError(null);
    setBusy("classer");
    try {
      const id = await createTicket();
      if (id === null) return;
      // On lance le classement ; en cas d'échec, on va quand même au détail
      // (l'utilisateur pourra relancer ou classer à la main).
      await fetch("/api/classer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).catch(() => {});
      router.push(`/tickets/${id}`);
    } finally {
      setBusy(null);
    }
  }

  // « Enregistrer seulement » : création CRUD sans IA.
  async function onSave() {
    if (!form.titre.trim()) {
      setError("Le titre est requis.");
      return;
    }
    setError(null);
    setBusy("save");
    try {
      const id = await createTicket();
      if (id !== null) router.push(`/tickets/${id}`);
    } finally {
      setBusy(null);
    }
  }

  const inputCls =
    "w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";

  return (
    <form onSubmit={onClasser} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium">Titre *</label>
        <input
          type="text"
          value={form.titre}
          onChange={(e) => set("titre", e.target.value)}
          required
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Demandeur</label>
          <input
            type="text"
            placeholder="nom"
            value={form.demandeur_nom}
            onChange={(e) => set("demandeur_nom", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Type de demandeur
          </label>
          <select
            value={form.demandeur_type}
            onChange={(e) => set("demandeur_type", e.target.value)}
            className={inputCls}
          >
            {DEMANDEUR_TYPES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Source / canal
          </label>
          <input
            type="text"
            placeholder="mail, Slack, réunion…"
            value={form.source}
            onChange={(e) => set("source", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Domaine</label>
          <select
            value={form.domaine}
            onChange={(e) => set("domaine", e.target.value)}
            className={inputCls}
          >
            {DOMAINES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Deadline</label>
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => set("deadline", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Note deadline
          </label>
          <input
            type="text"
            placeholder='ex : "vague", "pour hier"'
            value={form.deadline_note}
            onChange={(e) => set("deadline_note", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Effort estimé</label>
          <input
            type="text"
            placeholder="ex : 2h / 1j"
            value={form.effort_estime}
            onChange={(e) => set("effort_estime", e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className={inputCls}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy !== null}
          className="rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy === "classer" ? "Classement en cours…" : "Classer"}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={busy !== null}
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {busy === "save" ? "Enregistrement…" : "Enregistrer sans classer"}
        </button>
      </div>
    </form>
  );
}
