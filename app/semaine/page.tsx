import Nav from "@/components/Nav";
import { getContexteCourant } from "@/lib/db";
import SemaineForm from "./SemaineForm";

export const dynamic = "force-dynamic";

export default async function SemainePage() {
  const contexte = await getContexteCourant();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="mb-1 text-xl font-semibold">Ma semaine</h1>
        <p className="mb-6 text-sm text-gray-500">
          Contexte dynamique nourri à l'IA pour le classement. Saisissable en
          2 min, le lundi.
        </p>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <SemaineForm initial={contexte} />
        </div>
      </main>
    </>
  );
}
