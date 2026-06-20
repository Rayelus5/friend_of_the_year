"use client";

import Link from "next/link";
import { ArrowLeft, ListOrdered, Trophy } from "lucide-react";
import WinnerConfetti from "@/components/WinnerConfetti";
import ImageWithSkeleton from "@/components/ui/ImageWithSkeleton";

type Tier = { id: string; label: string; color: string; order: number };
type StatParticipant = {
    id: string;
    name: string;
    imageUrl: string | null;
    placements: number;
    topTierId: string | null;
    topTier: { label: string; color: string } | null;
    tiers: { tierId: string; label: string; color: string; count: number }[];
};

export default function TierlistResultsClient({
    event,
    tiers,
    totalVotes,
    participants,
}: {
    event: { title: string; description: string | null };
    tiers: Tier[];
    totalVotes: number;
    participants: StatParticipant[];
}) {
    const sortedTiers = [...tiers].sort((a, b) => a.order - b.order);
    // Agrupar nominados por su tier más votado (consenso)
    const byTier = new Map<string, StatParticipant[]>();
    const unranked: StatParticipant[] = [];
    for (const p of participants) {
        if (p.topTierId) {
            if (!byTier.has(p.topTierId)) byTier.set(p.topTierId, []);
            byTier.get(p.topTierId)!.push(p);
        } else {
            unranked.push(p);
        }
    }
    // Dentro de cada tier, ordenar por nº de votos en ese tier (desc)
    for (const [tierId, list] of byTier) {
        list.sort((a, b) => (b.tiers.find((t) => t.tierId === tierId)?.count ?? 0) - (a.tiers.find((t) => t.tierId === tierId)?.count ?? 0));
    }

    function Card({ p }: { p: StatParticipant }) {
        const inTier = p.topTierId ? p.tiers.find((t) => t.tierId === p.topTierId)?.count ?? 0 : 0;
        return (
            <div className="relative aspect-square w-20 rounded-lg overflow-hidden border-2 border-white/10 bg-neutral-800 shrink-0" title={`${p.name} · ${inTier} votos`}>
                {p.imageUrl ? (
                    <ImageWithSkeleton src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-center text-[11px] font-bold text-gray-200 px-1">{p.name}</div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[10px] text-white text-center truncate px-1 py-0.5">{p.name}</div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <Link href="/polls" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-4">
                    <ArrowLeft size={16} /> Volver
                </Link>

                <div className="text-center mb-2">
                    <h1 className="text-3xl font-bold">{event.title}</h1>
                    {event.description && <p className="text-gray-400 mt-1">{event.description}</p>}
                </div>
                <p className="text-center text-sm text-gray-500 mb-6 flex items-center justify-center gap-2">
                    <ListOrdered size={15} /> Tierlist final · {totalVotes} {totalVotes === 1 ? "voto" : "votos"}
                </p>

                {totalVotes === 0 ? (
                    <div className="text-center py-16 text-gray-500">Este evento finalizó sin votos.</div>
                ) : (
                    <>
                        <WinnerConfetti />
                        <div className="rounded-2xl overflow-hidden border-2 border-neutral-700">
                            {sortedTiers.map((t, idx) => {
                                const isTop = idx === 0;
                                return (
                                    <div key={t.id} className={`flex border-b border-neutral-700 last:border-b-0 min-h-[96px] ${isTop ? "relative ring-2 ring-amber-400/60 z-10" : ""}`}>
                                        <div className="w-24 shrink-0 flex flex-col items-center justify-center font-bold text-black/80 text-center px-2 break-words gap-1" style={{ backgroundColor: t.color }}>
                                            {isTop && <Trophy size={16} className="text-black/70" />}
                                            {t.label}
                                        </div>
                                        <div className={`flex-1 flex flex-wrap gap-2 p-2 items-center ${isTop ? "bg-amber-400/5" : "bg-neutral-900/40"}`}>
                                            {(byTier.get(t.id) ?? []).map((p) => <Card key={p.id} p={p} />)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {unranked.length > 0 && (
                            <div className="mt-6">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Sin clasificar (sin votos)</p>
                                <div className="flex flex-wrap gap-2 p-3 rounded-2xl border-2 border-neutral-800 bg-neutral-900/40">
                                    {unranked.map((p) => <Card key={p.id} p={p} />)}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
