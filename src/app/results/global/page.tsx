import { prisma } from "@/lib/prisma";
import { GALA_DATE } from "@/lib/config";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function GlobalResultsPage() {
    // 1. Seguridad: Si intentan entrar por URL antes de tiempo, fuera.
    if (new Date() < GALA_DATE) {
        redirect("/");
    }

    const polls = await prisma.poll.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: 'asc' }
    });

    return (
        <main className="min-h-screen bg-black text-white p-6">
            <div className="max-w-5xl mx-auto">
                <header className="py-12 border-b border-white/10 mb-12 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tighter">Ceremonia de Premios</h1>
                        <p className="text-gray-400">Selecciona una categoría para revelar al ganador.</p>
                    </div>
                    <Link href="/" className="px-6 py-2 rounded-full border border-white/20 hover:bg-white hover:text-black transition text-sm font-bold">
                        Volver al Lobby
                    </Link>
                </header>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {polls.map((poll, index) => (
                        <Link
                            href={`/polls/${poll.id}/results`}
                            key={poll.id}
                            className="group relative aspect-video bg-neutral-900 rounded-2xl overflow-hidden border border-white/5 hover:border-amber-500/50 transition-all hover:shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)]"
                        >
                            <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                                <span className="text-xs font-mono text-amber-500/80 uppercase tracking-widest">
                                    Categoría {index + 1}
                                </span>
                                <h3 className="text-2xl font-bold text-gray-200 group-hover:text-white transition-colors">
                                    {poll.title}
                                </h3>
                                <div className="flex items-center text-sm text-gray-500 group-hover:text-amber-400 transition-colors">
                                    Ver Ganador <span className="ml-2">→</span>
                                </div>
                            </div>

                            {/* Efecto Hover Sutil */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}