"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CHARGES, type ContexteSemaine } from "@/lib/types";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Lundi de la semaine courante (par défaut).
function lundiCourant(): string {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = dimanche
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  return isoDate(monday);
}

export default function SemaineForm({
  initial,
}: {
  initial: ContexteSemaine | null;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    semaine_du: initial?.semaine_du?.slice(0, 10) ?? lundiCourant(),
    charge_globale: initial?.charge_globale ?? "normal",
    heures_facturables: initial?.heures_facturables ?? "",
    temps_dispo_interne: initial?.temps_dispo_interne ?? "",
    engagements_fixes: initial?.engagements_fixes ?? "",
    missions_actives: initial?.missions_actives ?? "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/contexte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Échec de l'enregistrement.");
      } else {
        setSaved(true);
        router.refresh();
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Semaine du</label>
          <input
            type="date"
            value={form.semaine_du}
            onChange={(e) => set("semaine_du", e.target.value)}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Niveau de charge global
          </label>
          <select
            value={form.charge_globale}
            onChange={(e) => set("charge_globale", e.target.value)}
            className={inputCls}
          >
            {CHARGES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Heures facturables engagées
          </label>
          <input
            type="text"
            placeholder="ex : 32h / 4j"
            value={form.heures_facturables}
            onChange={(e) => set("heures_facturables", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Temps dispo pour l'interne
          </label>
          <input
            type="text"
            placeholder="ex : 8h / 1j"
            value={form.temps_dispo_interne}
            onChange={(e) => set("temps_dispo_interne", e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Engagements fixes / deadlines datées
        </label>
        <textarea
          rows={3}
          placeholder="ex : Conseil de Bord jeudi 14h&#10;soutenance client BPCE mardi"
          value={form.engagements_fixes}
          onChange={(e) => set("engagements_fixes", e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Missions client actives
        </label>
        <textarea
          rows={2}
          placeholder="liste courte"
          value={form.missions_actives}
          onChange={(e) => set("missions_actives", e.target.value)}
          className={inputCls}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        {saved && <span className="text-sm text-green-600">✓ Enregistré</span>}
      </div>
    </form>
  );
}
