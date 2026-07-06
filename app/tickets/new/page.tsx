import Nav from "@/components/Nav";
import TicketForm from "./TicketForm";

export default function NewTicketPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="mb-1 text-xl font-semibold">Nouveau ticket</h1>
        <p className="mb-6 text-sm text-gray-500">
          « Classer » crée le ticket et demande une proposition à l'IA. Tu
          valides ensuite dans le détail.
        </p>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <TicketForm />
        </div>
      </main>
    </>
  );
}
