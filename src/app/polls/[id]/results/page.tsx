import { prisma } from "@/lib/prisma";
import { calculateResults } from "@/lib/countResults";
import Link from "next/link";
import { GALA_DATE } from "@/lib/config";
import Countdown from "@/components/Countdown";

type Props = {
    params: Promise<{ id: string }>
}

// Forzamos dinamismo para que compruebe la fecha cada vez
export const dynamic = "force-dynamic";

export default async function ResultsPage({ params }: Props) {
    const { id } = await params;

    // 1. COMPROBACIÓN DE FECHA (Anti-Spoiler)
    const now = new Date();
    const isGalaTime = now >= GALA_DATE;

    if (!isGalaTime) {
        return (
            <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-neutral-900/50 border border-white/10 p-10 rounded-3xl backdrop-blur-md max-w-md w-full shadow-2xl">
                    <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">Resultados Sellados</h1>
                    <p className="text-gray-400 mb-8">
                        La votación se ha registrado, pero el sobre está cerrado hasta la ceremonia oficial.
                    </p>

                    <div className="py-4 border-t border-b border-white/5 mb-8">
                        <p className="text-xs text-amber-500 font-mono uppercase tracking-widest mb-2">Tiempo restante</p>
                        <Countdown targetDate={GALA_DATE} />
                    </div>

                    <Link href="/" className="text-sm text-white hover:underline">
                        Volver al inicio
                    </Link>
                </div>
            </main>
        );
    }

    // --- SI ES DÍA DE GALA, MOSTRAMOS RESULTADOS ---

    const poll = await prisma.poll.findUnique({
        where: { id },
        include: {
            options: { include: { participant: true } },
            votes: { include: { voteOptions: true } }
        }
    });

    if (!poll) return <div>Encuesta no encontrada</div>;

    // Calcular resultados
    const allVoteOptions = poll.votes.flatMap(v => v.voteOptions);
    const optionsMapped = poll.options.map(o => ({ id: o.id, name: o.participant.name }));
    const results = calculateResults(optionsMapped, allVoteOptions);
    const winners = results.filter(r => r.votes === Math.max(...results.map(x => x.votes)) && r.votes > 0);

    return (
        <main className="min-h-screen bg-neutral-950 p-4 md:p-10 text-white selection:bg-amber-500/30">
            <div className="max-w-3xl mx-auto animate-in fade-in duration-1000">

                <header className="text-center mb-12">
                    <span className="text-amber-500 text-xs font-bold tracking-[0.3em] uppercase">Resultados Oficiales</span>
                    <h1 className="text-3xl md:text-5xl font-bold mt-2 mb-4">{poll.title}</h1>
                    <Link href="/results/global" className="text-sm text-gray-500 hover:text-white transition-colors">
                        ← Volver a la Ceremonia
                    </Link>
                </header>

                {/* Ganador(es) */}
                {winners.length > 0 ? (
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-amber-900/20 to-black border border-amber-500/30 p-10 text-center mb-10 shadow-[0_0_60px_-20px_rgba(245,158,11,0.3)]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-amber-500 shadow-[0_0_20px_2px_rgba(245,158,11,0.8)]"></div>

                        <div className="text-6xl mb-4">🏆</div>
                        <h2 className="text-xl text-amber-200 mb-2 font-light">And the winner is...</h2>
                        <div className="text-4xl md:text-6xl font-black text-white tracking-tight">
                            {winners.map(w => w.name).join(" & ")}
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-10 text-gray-500">No hubo votos suficientes.</div>
                )}

                {/* Tabla de Resultados Estilizada */}
                <div className="space-y-6">
                    {results.map((result, index) => (
                        <div key={result.id} className="group">
                            <div className="flex justify-between items-end mb-2 px-1">
                                <span className={`font-medium text-lg ${index === 0 ? 'text-white' : 'text-gray-400'}`}>
                                    {index + 1}. {result.name}
                                </span>
                                <span className="text-sm font-mono text-gray-500">
                                    {Math.round(result.percentage)}%
                                </span>
                            </div>

                            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${index === 0 ? 'bg-amber-500' : 'bg-gray-600'}`}
                                    style={{ width: `${result.percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </main>
    );
}