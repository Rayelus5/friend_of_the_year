import { prisma } from "@/lib/prisma";
import { calculateResults } from "@/lib/countResults";
import Link from "next/link";
import Countdown from "@/components/Countdown";
import ResultsClient from "@/components/ResultsClient"; // El componente animado

type Props = {
    params: Promise<{ id: string }>
}

// Forzamos que esta página sea dinámica para que compruebe la fecha en cada petición
export const dynamic = "force-dynamic";

export default async function ResultsPage({ params }: Props) {
    const { id } = await params;

    const poll = await prisma.poll.findUnique({
        where: { id },
        include: {
        event: { select: { galaDate: true, slug: true } }, // <--- IMPORTANTE
        options: { include: { participant: true } },
        votes: { include: { voteOptions: true } }
        }
    });

    if (!poll) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-gray-500">
            Encuesta no encontrada
        </div>
    );

    // 2. COMPROBACIÓN DE FECHA (Usando la fecha del evento)
    const galaDate = poll.event.galaDate || new Date('2030-01-01');
    const now = new Date();
    const isGalaTime = now >= galaDate;

    // SI AÚN NO ES LA GALA: Mostramos pantalla de bloqueo (Server Side Rendered)
    if (!isGalaTime) {
        return (
            <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center selection:bg-blue-500/30">
                <div className="bg-neutral-900/50 border border-white/10 p-10 rounded-3xl backdrop-blur-md max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-500">

                    {/* Icono Candado Animado */}
                    <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">Resultados Sellados</h1>
                    <p className="text-gray-400 mb-8">
                        La votación se ha registrado, pero el sobre está cerrado hasta la ceremonia oficial.
                    </p>

                    <div className="py-4 border-t border-b border-white/5 mb-8">
                        <p className="text-xs text-blue-500 font-mono uppercase tracking-widest mb-2">Tiempo restante</p>
                        <div className="text-white">
                            <Countdown targetDate={galaDate} />
                        </div>
                    </div>

                    <Link href={`/e/${poll.event.slug}`} className="text-sm text-gray-400 hover:text-white transition-colors border-b border-transparent hover:border-white pb-1">
                        Volver al inicio
                    </Link>
                </div>
            </main>
        );
    }

    // 3. CÁLCULO DE RESULTADOS
    const allVoteOptions = poll.votes.flatMap(v => v.voteOptions);

    // Mapeamos para incluir la URL de la imagen, necesaria para el fondo del ganador
    const optionsMapped = poll.options.map(o => ({
        id: o.id,
        name: o.participant.name,
        imageUrl: o.participant.imageUrl
    }));

    const results = calculateResults(optionsMapped, allVoteOptions);

    // Identificamos ganadores (puede haber empate)
    const maxVotes = Math.max(...results.map(x => x.votes));
    // Si no hay votos (maxVotes es 0 o -Infinity), winners estará vacío
    const winners = maxVotes > 0
        ? results.filter(r => r.votes === maxVotes)
        : [];

    // Obtenemos la imagen del primer ganador para el fondo
    const winnerImage = winners.length > 0
        ? optionsMapped.find(o => o.id === winners[0].id)?.imageUrl
        : null;

    // 4. RENDERIZADO DEL COMPONENTE CLIENTE (ANIMACIONES)
    return (
        <ResultsClient 
        pollTitle={poll.title}
        pollDescription={poll.description}
        results={results}
        winners={winners}
        winnerImage={winnerImage}
        // Añadimos la URL de retorno correcta
        backUrl={`/e/${poll.event.slug}/results`} 
        />
    );
}