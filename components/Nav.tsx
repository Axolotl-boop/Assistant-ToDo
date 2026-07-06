import Link from "next/link";

// Barre de navigation partagée par les écrans authentifiés.
export default function Nav() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/matrice" className="text-gray-900 hover:text-blue-700">
            Matrice
          </Link>
          <Link
            href="/tickets/new"
            className="text-gray-900 hover:text-blue-700"
          >
            Nouveau ticket
          </Link>
          <Link href="/semaine" className="text-gray-900 hover:text-blue-700">
            Ma semaine
          </Link>
        </nav>
        <form action="/api/logout" method="post">
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Déconnexion
          </button>
        </form>
      </div>
    </header>
  );
}
