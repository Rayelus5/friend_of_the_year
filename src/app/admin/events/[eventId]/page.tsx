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
    Calendar, 
    Lock, 
    BarChart3, 
    Settings 
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminEventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;

    // 1. Obtener TODO sobre el evento
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
            user: true,
            polls: { include: { _count: { select: { votes: true, options: true } } } },
            participants: true,
            reports: true, // Si ya creaste el modelo Report
            moderationLogs: { orderBy: { createdAt: 'desc' }, include: { admin: true } } // Si ya creaste ModerationLog
        }
    });

    if (!event) notFound();

    return (
        <div className="max-w-5xl mx-auto pb-20">
            
            {/* Navegación */}
            <Link href="/admin/events" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-6 transition-colors">
                <ArrowLeft size={16} /> Volver al listado
            </Link>

            {/* Header Principal */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl font-bold text-white">{event.title}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            event.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-800 text-gray-400 border-gray-700'
                        }`}>
                            {event.status}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 font-mono">
                        <span className="bg-white/5 px-2 py-1 rounded select-all">ID: {event.id}</span>
                        <span className="select-all">Slug: {event.slug}</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Link 
                        href={`/e/${event.slug}`} 
                        target="_blank"
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-bold text-white flex items-center gap-2 transition-colors"
                    >
                        <ExternalLink size={16} /> Ver Público
                    </Link>
                    
                    {/* EL BOTÓN MÁGICO DE IMPERSONATE */}
                    <Link 
                        href={`/dashboard/event/${event.id}`} 
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all hover:scale-105"
                    >
                        <Settings size={16} /> Gestionar como Creador
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* COLUMNA IZQUIERDA (Info Técnica) */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <StatCard label="Categorías" value={event.polls.length} icon={<BarChart3 className="text-blue-400" />} />
                        <StatCard label="Participantes" value={event.participants.length} icon={<User className="text-purple-400" />} />
                        <StatCard label="Reportes" value={event.reports.length} icon={<ShieldCheck className="text-red-400" />} />
                    </div>

                    {/* Listado de Categorías */}
                    <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 font-bold text-sm text-gray-400 uppercase tracking-wider">
                            Estructura del Evento
                        </div>
                        <div className="divide-y divide-white/5">
                            {event.polls.map((poll) => (
                                <div key={poll.id} className="px-6 py-4 flex justify-between items-center">
                                    <div>
                                        <p className="text-white font-medium">{poll.title}</p>
                                        <p className="text-xs text-gray-500">{poll.votingType} • {poll._count.options} Opciones</p>
                                    </div>
                                    <div className="text-xs font-mono text-gray-400 bg-black/30 px-2 py-1 rounded">
                                        {poll._count.votes} Votos
                                    </div>
                                </div>
                            ))}
                             {event.polls.length === 0 && <p className="px-6 py-8 text-center text-gray-500 text-sm">Sin categorías.</p>}
                        </div>
                    </div>

                    {/* Historial de Moderación */}
                    <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 font-bold text-sm text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <ShieldCheck size={16} /> Historial de Moderación
                        </div>
                        <div className="p-6 space-y-4">
                            {event.moderationLogs.map((log) => (
                                <div key={log.id} className="flex gap-4 text-sm">
                                    <div className="text-gray-500 text-xs min-w-[80px] pt-0.5">
                                        {format(new Date(log.createdAt), 'dd MMM HH:mm', { locale: es })}
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
                    </div>

                </div>

                {/* COLUMNA DERECHA (Usuario y Config) */}
                <div className="space-y-6">
                    
                    {/* Tarjeta del Creador */}
                    <div className="bg-neutral-900 border border-white/10 rounded-xl p-6">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Creador del Evento</h3>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden relative">
                                {event.user.image ? (
                                    <img src={event.user.image} alt="" className="w-full h-full object-cover" />
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
                    <div className="bg-neutral-900 border border-white/10 rounded-xl p-6 space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Datos Técnicos</h3>
                        
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Creado</span>
                            <span className="text-white">{format(new Date(event.createdAt), 'dd/MM/yyyy')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Gala</span>
                            <span className="text-white">{format(new Date(event.galaDate), 'dd/MM/yyyy HH:mm')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Privacidad</span>
                            <span className="text-white">{event.isPublic ? 'Pública' : 'Privada'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Voto Anónimo</span>
                            <span className="text-white">{event.isAnonymousVoting ? 'Sí' : 'No'}</span>
                        </div>
                        
                        <div className="pt-4 mt-4 border-t border-white/5">
                             <div className="text-xs text-gray-500 mb-1">Access Key (Privada)</div>
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

function StatCard({ label, value, icon }: any) {
    return (
        <div className="bg-neutral-900 border border-white/10 p-4 rounded-xl flex items-center justify-between">
            <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
            <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
        </div>
    )
}