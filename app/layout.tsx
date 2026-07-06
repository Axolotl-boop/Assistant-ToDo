import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Priorisation Eisenhower",
  description: "To-Do + priorisation Eisenhower assistée par IA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
