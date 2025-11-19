import { prisma } from "@/lib/prisma";
import { GALA_DATE } from "@/lib/config";
import Link from "next/link";
import Countdown from "@/components/Countdown"; // Reutilizamos tu componente, luego lo estilazaremos mejor

export const dynamic = "force-dynamic";

export default async function Home() {
  // 1. Buscar la PRIMERA encuesta para iniciar el flujo
  // Asumimos que el orden de creación define el orden de la gala
  const firstPoll = await prisma.poll.findFirst({
    orderBy: { createdAt: 'asc' },
    where: { isPublished: true }
  });

  const now = new Date();
  const isGalaTime = now >= GALA_DATE;

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black selection:bg-indigo-500/30">
      
      {/* Fondo Ambiental (Glow Effects) */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-10 max-w-4xl w-full px-6 text-center flex flex-col items-center animate-in fade-in zoom-in duration-1000">
        
        {/* Badge Superior */}
        <div className="mb-8 inline-flex items-center px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
          <span className="text-xs font-medium tracking-widest text-gray-400 uppercase">
            Friend of the Year Awards
          </span>
        </div>

        {/* Título Principal */}
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 mb-6">
          FOTY 2025
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 font-light leading-relaxed">
          Celebramos los momentos, los memes y las leyendas de nuestro grupo. 
          Una noche para honrar a los verdaderos protagonistas de nuestra historia.
        </p>

        {/* Lógica de Botones Principales */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          
          {!isGalaTime ? (
            /* ESTADO 1: ANTES DE LA GALA -> VOTAR */
            firstPoll ? (
              <Link 
                href={`/polls/${firstPoll.id}`}
                className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg tracking-wide transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
              >
                COMENZAR VOTACIÓN
                <span className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all" />
              </Link>
            ) : (
              <div className="px-8 py-4 glass-panel rounded-full text-gray-500 font-medium">
                Las urnas están cerradas temporalmente.
              </div>
            )
          ) : (
            /* ESTADO 2: GALA EN CURSO -> VER RESULTADOS */
            <Link 
              href="/results/global" 
              className="px-8 py-4 bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 rounded-full font-bold text-lg shadow-lg shadow-yellow-500/20 hover:scale-105 transition-transform"
            >
              VER LOS RESULTADOS
            </Link>
          )}

        </div>

        {/* Contador Footer */}
        <div className="mt-20 border-t border-white/5 pt-8 w-full max-w-md">
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-4">Tiempo para la Gala</p>
            {/* Aquí usaremos una versión "Dark" de tu contador */}
            <div className="text-gray-300">
              <Countdown targetDate={GALA_DATE} />
            </div>
        </div>

      </div>

      {/* Footer simple */}
      <footer className="absolute bottom-6 text-xs text-gray-700">
        Created by @<a href="https://rayelus.com/portfolio" className="underline">Rayelus</a>. Built with Next.js.
      </footer>
    </main>
  );
}