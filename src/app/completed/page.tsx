import Link from "next/link";
import { GALA_DATE } from "@/lib/config";
import Countdown from "@/components/Countdown";

export default function CompletedPage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-black text-center p-6 selection:bg-amber-500/30">
            {/* Efecto de fondo */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-black to-black pointer-events-none" />

            <div className="z-10 space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-200 to-yellow-600 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_-10px_rgba(251,191,36,0.4)]">
                    <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
                    Votos Registrados
                </h1>

                <p className="text-lg text-gray-400 max-w-lg mx-auto">
                    Tu voz ha sido escuchada. La suerte está echada. <br />
                    Prepárate para la noche de las revelaciones.
                </p>

                <div className="py-10">
                    <p className="text-xs font-mono text-amber-500 mb-4 tracking-[0.2em] uppercase">Cuenta regresiva para la Gala</p>
                    <Countdown targetDate={GALA_DATE} />
                </div>

                <Link
                    href="/"
                    className="inline-block text-sm text-gray-500 hover:text-white transition-colors border-b border-transparent hover:border-white pb-1"
                >
                    Volver al inicio
                </Link>
            </div>
        </main>
    );
}