import { redirect } from "next/navigation";

// Racine : on redirige vers la vue matrice (écran principal).
export default function Home() {
  redirect("/matrice");
}
