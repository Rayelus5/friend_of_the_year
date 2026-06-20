import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import {
    ArrowLeft,
    ExternalLink,
    ShieldCheck,
    User,
    Lock,
    BarChart3,
    Settings,
    Layers,
    CircleHelp,
    Brush,
    ThumbsUp,
    ThumbsDown,
    Star,
    Trophy,
    Users,
    MessageSquare,
} from "lucide-react";
import { getEventStats, getModeStats } from "@/app/lib/stats-actions";
import ImageWithSkeleton from "@/components/ui/ImageWithSkeleton";

export const dynamic = "force-dynamic";

const MODE_BADGE: Record<string, { label: string; className: string }> = {
    GALA: { label: "Gala", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    TIERLIST: { label: "Tierlist", className: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    PREGUNTAS: { label: "Preguntas", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    DIBUJO: { label: "Dibujo", className: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
};

const PHASE_LABEL: Record<string, string> = {
    DRAWING: "Dibujando",
    VOTING: "Votación",
    RESULTS: "Resultados",
};

export default async function AdminEventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
            user: true,
            reports: true,
            moderationLogs: { orderBy: { createdAt: "desc" }, include: { admin: true } },
            _count: {
                select: { participants: true, polls: true, tiers: true, questions: true, drawings: true, reports: true },
            },
        },
    });

    if (!event) notFound();

    // Estadísticas según el modo (reutiliza el motor de stats del dashboard).
    const galaStats = event.mode === "GALA" ? await getEventStats(eventId) : null;
    const tRaw = event.mode === "TIERLIST" ? await getModeStats(eventId, "TIERLIST") : null;
    const tierStats = tRaw && tRaw.mode === "TIERLIST" ? tRaw : null;
    const pRaw = event.mode === "PREGUNTAS" ? await getModeStats(eventId, "PREGUNTAS") : null;
    const pregStats = pRaw && pRaw.mode === "PREGUNTAS" ? pRaw : null;
    const dRaw = event.mode === "DIBUJO" ? await getModeStats(eventId, "DIBUJO") : null;
    const drawStats = dRaw && dRaw.mode === "DIBUJO" ? dRaw : null;
    const tierlistTiers = event.mode === "TIERLIST"
        ? await prisma.tierlistTier.findMany({ where: { eventId }, orderBy: { order: "asc" } })
        : [];

    const modeBadge = MODE_BADGE[event.mode] ?? { label: event.mode, className: "bg-gray-800 text-gray-400 border-gray-700" };

    return (
        <div className="max-w-7xl mx-auto pb-20">

            {/* Navegación */}
            <Link href="/admin/events" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-6 transition-colors">
                <ArrowLeft size={16} /> Volver al listado
            </Link>

            {/* Header Principal */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
                <div>
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h1 className="text-4xl font-bold text-white">{event.title}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${event.status === "APPROVED" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                            event.status === "PENDING" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                                event.status === "DENIED" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                    "bg-gray-800 text-gray-400 border-gray-700"
                            }`}>
                            {event.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${modeBadge.className}`}>
                            {modeBadge.label}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 font-mono">
                        <span className="bg-white/5 px-2 py-1 rounded select-all">ID: {event.id}</span>
                        <span className="select-all">Slug: {event.slug}</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Link
                        href={`/e/${event.slug}`}
                        target="_blank"
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border-2 border-white/10 rounded-lg text-sm font-bold text-white flex items-center gap-2 transition-colors"
                    >
                        <ExternalLink size={16} /> Ver Público
                    </Link>
                    <Link
                        href={`/dashboard/event/${event.id}`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all hover:scale-105"
                    >
                        <Settings size={16} /> Gestionar como Creador
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* COLUMNA IZQUIERDA */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Stats Cards — específicas por modo */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {event.mode === "GALA" && (
                            <>
                                <StatCard label="Categorías" value={event._count.polls} icon={<BarChart3 className="text-blue-400" />} />
                                <StatCard label="Nominados" value={event._count.participants} icon={<User className="text-purple-400" />} />
                                <StatCard label="Votos" value={galaStats?.totalVotes ?? 0} icon={<Users className="text-emerald-400" />} />
                                <StatCard label="Reportes" value={event._count.reports} icon={<ShieldCheck className="text-red-400" />} />
                            </>
                        )}
                        {event.mode === "TIERLIST" && (
                            <>
                                <StatCard label="Tiers" value={event._count.tiers} icon={<Layers className="text-purple-400" />} />
                                <StatCard label="Nominados" value={event._count.participants} icon={<User className="text-blue-400" />} />
                                <StatCard label="Votos" value={tierStats?.totalVotes ?? 0} icon={<Users className="text-emerald-400" />} />
                                <StatCard label="Reportes" value={event._count.reports} icon={<ShieldCheck className="text-red-400" />} />
                            </>
                        )}
                        {event.mode === "PREGUNTAS" && (
                            <>
                                <StatCard label="Preguntas" value={event._count.questions} icon={<CircleHelp className="text-emerald-400" />} />
                                <StatCard label="Respondientes" value={pregStats?.totalRespondents ?? 0} icon={<Users className="text-blue-400" />} />
                                <StatCard label="Respuestas" value={pregStats?.questions.reduce((a, q) => a + q.totalAnswers, 0) ?? 0} icon={<MessageSquare className="text-purple-400" />} />
                                <StatCard label="Reportes" value={event._count.reports} icon={<ShieldCheck className="text-red-400" />} />
                            </>
                        )}
                        {event.mode === "DIBUJO" && (
                            <>
                                <StatCard label="Dibujos" value={drawStats?.submissions ?? event._count.drawings} icon={<Brush className="text-pink-400" />} />
                                <StatCard label="Reacciones" value={drawStats?.reactions ?? 0} icon={<ThumbsUp className="text-emerald-400" />} />
                                <StatCard label="Fase" value={PHASE_LABEL[event.drawingPhase ?? "DRAWING"] ?? "—"} icon={<Brush className="text-purple-400" />} />
                                <StatCard label="Reportes" value={event._count.reports} icon={<ShieldCheck className="text-red-400" />} />
                            </>
                        )}
                    </div>

                    {/* ── ESTRUCTURA / RESULTADOS POR MODO ── */}

                    {/* GALA: categorías + resultados */}
                    {event.mode === "GALA" && (
                        <Panel title="Categorías y resultados">
                            <div className="divide-y divide-white/5">
                                {(galaStats?.pollsDetail ?? []).map((poll) => {
                                    const top = poll.options[0];
                                    return (
                                        <div key={poll.id} className="px-6 py-4">
                                            <div className="flex justify-between items-center gap-3">
                                                <p className="text-white font-medium truncate">{poll.title}</p>
                                                <span className="text-xs font-mono text-gray-400 bg-black/30 px-2 py-1 rounded shrink-0">
                                                    {poll.totalVotes} votos · {poll.options.length} opciones
                                                </span>
                                            </div>
                                            {top && top.votesCount > 0 && (
                                                <p className="mt-1 text-xs text-amber-300 flex items-center gap-1.5">
                                                    <Trophy size={12} /> {top.name} <span className="text-gray-500">({top.votesCount})</span>
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                                {(galaStats?.pollsDetail.length ?? 0) === 0 && <Empty>Sin categorías.</Empty>}
                            </div>
                        </Panel>
                    )}

                    {/* TIERLIST: tiers + ranking de nominados */}
                    {event.mode === "TIERLIST" && (
                        <>
                            <Panel title="Tiers definidos">
                                <div className="p-6 flex flex-wrap gap-2">
                                    {tierlistTiers.map((t) => (
                                        <span key={t.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-white/10 bg-black/30 text-sm text-white">
                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                                            {t.label}
                                        </span>
                                    ))}
                                    {tierlistTiers.length === 0 && <Empty>Sin tiers.</Empty>}
                                </div>
                            </Panel>
                            <Panel title="Ranking de nominados">
                                <div className="divide-y divide-white/5">
                                    {(tierStats?.participants ?? []).slice(0, 25).map((p, i) => (
                                        <div key={p.id} className="px-6 py-3 flex items-center gap-3">
                                            <span className="text-xs font-mono text-gray-500 w-6 shrink-0">#{i + 1}</span>
                                            <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                                                {p.imageUrl ? <ImageWithSkeleton src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : null}
                                            </div>
                                            <p className="text-white text-sm truncate flex-1">{p.name}</p>
                                            {p.topTier && (
                                                <span className="text-[11px] font-bold px-2 py-1 rounded-full border-2 shrink-0" style={{ borderColor: `${p.topTier.color}55`, color: p.topTier.color }}>
                                                    {p.topTier.label}
                                                </span>
                                            )}
                                            <span className="text-xs font-mono text-gray-400 bg-black/30 px-2 py-1 rounded shrink-0">{p.placements} votos</span>
                                        </div>
                                    ))}
                                    {(tierStats?.participants.length ?? 0) === 0 && <Empty>Sin nominados.</Empty>}
                                </div>
                            </Panel>
                        </>
                    )}

                    {/* PREGUNTAS: preguntas + opciones + recuento */}
                    {event.mode === "PREGUNTAS" && (
                        <Panel title="Preguntas y respuestas">
                            <div className="divide-y divide-white/5">
                                {(pregStats?.questions ?? []).map((q) => (
                                    <div key={q.id} className="px-6 py-4">
                                        <div className="flex justify-between items-center gap-3 mb-2">
                                            <p className="text-white font-medium truncate">{q.text}</p>
                                            <span className="text-xs font-mono text-gray-400 bg-black/30 px-2 py-1 rounded shrink-0">
                                                {q.type} · {q.totalAnswers} resp.
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {q.options.map((o) => (
                                                <div key={o.id} className="flex items-center gap-2 text-xs">
                                                    <span className="text-gray-300 truncate w-40">{o.text}</span>
                                                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500/60" style={{ width: `${o.pct}%` }} />
                                                    </div>
                                                    <span className="text-gray-400 font-mono w-16 text-right">{o.count} · {o.pct}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {(pregStats?.questions.length ?? 0) === 0 && <Empty>Sin preguntas.</Empty>}
                            </div>
                        </Panel>
                    )}

                    {/* DIBUJO: configuración + top dibujos */}
                    {event.mode === "DIBUJO" && (
                        <>
                            <Panel title="Configuración del dibujo">
                                <div className="p-6 space-y-3">
                                    <Row label="Tema (prompt)" value={event.drawingPrompt || "—"} />
                                    <Row label="Fase actual" value={PHASE_LABEL[event.drawingPhase ?? "DRAWING"] ?? "—"} />
                                    <Row label="Fin de dibujo" value={event.drawingDeadline ? format(new Date(event.drawingDeadline), "dd/MM/yyyy HH:mm") : "—"} />
                                    <Row label="Fin de votación" value={event.votingDeadline ? format(new Date(event.votingDeadline), "dd/MM/yyyy HH:mm") : "—"} />
                                    <Row label="Tiempo límite" value={event.drawingTimeLimit ? `${event.drawingTimeLimit}s` : "Sin límite"} />
                                </div>
                            </Panel>
                            <Panel title="Top dibujos">
                                <div className="p-6">
                                    {drawStats && drawStats.top.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {drawStats.top.map((d, i) => (
                                                <div key={d.id} className="rounded-xl overflow-hidden border-2 border-white/10 bg-neutral-900">
                                                    <div className="relative w-full aspect-[3/2] bg-white">
                                                        <ImageWithSkeleton src={d.imageUrl} alt={`#${i + 1}`} className="w-full h-full object-cover" skeletonClassName="bg-neutral-300" />
                                                    </div>
                                                    <div className="flex items-center justify-between gap-1 px-2 py-1.5 text-[11px]">
                                                        <span className="font-bold text-white">#{i + 1} · {d.score} pts</span>
                                                        <span className="flex items-center gap-1 text-gray-400">
                                                            <ThumbsUp size={11} className="text-emerald-400" />{d.likeCount}
                                                            <ThumbsDown size={11} className="text-red-400" />{d.dislikeCount}
                                                            <Star size={11} className="text-amber-400" />{d.superlikeCount}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <Empty>Aún no hay dibujos.</Empty>}
                                </div>
                            </Panel>
                        </>
                    )}

                    {/* Historial de Moderación */}
                    <Panel title={<span className="flex items-center gap-2"><ShieldCheck size={16} /> Historial de Moderación</span>}>
                        <div className="p-6 space-y-4">
                            {event.moderationLogs.map((log) => (
                                <div key={log.id} className="flex gap-4 text-sm">
                                    <div className="text-gray-500 text-xs min-w-[80px] pt-0.5">
                                        {format(new Date(log.createdAt), "dd MMM HH:mm", { locale: es })}
                                    </div>
                                    <div>
                                        <p className="text-white">
                                            <span className="font-bold text-blue-400">{log.actionType}</span> por {log.admin.name}
                                        </p>
                                        {log.details && <p className="text-gray-400 text-xs mt-1">{log.details}</p>}
                                    </div>
                                </div>
                            ))}
                            {event.moderationLogs.length === 0 && <p className="text-gray-500 text-sm italic">No hay acciones registradas.</p>}
                        </div>
                    </Panel>

                </div>

                {/* COLUMNA DERECHA */}
                <div className="space-y-6">

                    {/* Tarjeta del Creador */}
                    <div className="bg-neutral-900 border-2 border-white/10 rounded-xl p-6">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Creador del Evento</h3>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden relative">
                                {event.user.image ? (
                                    <ImageWithSkeleton src={event.user.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white font-bold">{event.user.name?.[0]}</div>
                                )}
                            </div>
                            <div>
                                <div className="text-white font-bold">{event.user.name}</div>
                                <div className="text-xs text-gray-500">{event.user.email}</div>
                            </div>
                        </div>
                        <Link
                            href={`/admin/users/${event.user.id}`}
                            className="block w-full py-2 text-center bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-gray-300 transition-colors"
                        >
                            Ver Usuario
                        </Link>
                    </div>

                    {/* Tarjeta Técnica */}
                    <div className="bg-neutral-900 border-2 border-white/10 rounded-xl p-6 space-y-3">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Datos Técnicos</h3>

                        <Row label="Modo" value={modeBadge.label} />
                        <Row label="Creado" value={format(new Date(event.createdAt), "dd/MM/yyyy")} />
                        <Row
                            label={event.mode === "PREGUNTAS" ? "Cierre" : event.mode === "DIBUJO" ? "Fin votación" : "Gala"}
                            value={
                                event.mode === "DIBUJO"
                                    ? (event.votingDeadline ? format(new Date(event.votingDeadline), "dd/MM/yyyy HH:mm") : "—")
                                    : format(new Date(event.galaDate), "dd/MM/yyyy HH:mm")
                            }
                        />
                        <Row label="Privacidad" value={event.isPublic ? "Pública" : "Privada"} />
                        {event.mode !== "DIBUJO" && <Row label="Voto Anónimo" value={event.isAnonymousVoting ? "Sí" : "No"} />}

                        <div className="pt-4 mt-4 border-t-2 border-white/5">
                            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Lock size={11} /> Access Key (Privada)</div>
                            <code className="block bg-black/50 p-2 rounded text-[10px] text-gray-400 font-mono break-all">
                                {event.accessKey}
                            </code>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
    return (
        <div className="bg-neutral-900 border-2 border-white/10 p-4 rounded-xl flex items-center justify-between">
            <div className="min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 truncate">{label}</p>
                <p className="text-2xl font-bold text-white truncate">{value}</p>
            </div>
            <div className="p-2 bg-white/5 rounded-lg shrink-0">{icon}</div>
        </div>
    );
}

function Panel({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-neutral-900 border-2 border-white/10 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b-2 border-white/5 font-bold text-sm text-gray-400 uppercase tracking-wider">
                {title}
            </div>
            {children}
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-3 text-sm">
            <span className="text-gray-400 shrink-0">{label}</span>
            <span className="text-white text-right truncate">{value}</span>
        </div>
    );
}

function Empty({ children }: { children: React.ReactNode }) {
    return <p className="px-6 py-8 text-center text-gray-500 text-sm">{children}</p>;
}
