import { notFound } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { getTicket } from "@/lib/db";
import TicketDetail from "./TicketDetail";

export const dynamic = "force-dynamic";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) notFound();

  const ticket = await getTicket(n);
  if (!ticket) notFound();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <Link
          href="/matrice"
          className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-900"
        >
          ← Retour à la matrice
        </Link>
        <TicketDetail initial={ticket} />
      </main>
    </>
  );
}
