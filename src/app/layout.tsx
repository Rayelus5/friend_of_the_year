import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { MAINTENANCE_MODE } from "@/lib/config";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "POLLNOW - Create your own event",
  description: "Crea tu propia gala digital.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const showUI = !MAINTENANCE_MODE; // <-- si está en mantenimiento, ocultamos todo

  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>

        {/* NAVBAR (solo si no está en mantenimiento) */}
        {showUI && <Navbar />}

        {/* Si hay navbar aplicamos padding, si no, lo quitamos */}
        <div className={showUI ? "pt-16" : ""}>
          {children}
        </div>

        {/* FOOTER (solo si no está en mantenimiento) */}
        {showUI && (
          <footer className="py-8 text-center text-xs text-gray-600 border-t border-white/5">
            <div className="flex justify-center gap-6 mb-4">
              <Link href="/legal/terms" className="hover:text-white transition-colors">Términos</Link>
              <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacidad</Link>
              <Link href="/legal/cookies" className="hover:text-white transition-colors">Cookies</Link>
            </div>
            <p>© 2025 POLLNOW. Creado por Rayelus.</p>
          </footer>
        )}

      </body>
    </html>
  );
}