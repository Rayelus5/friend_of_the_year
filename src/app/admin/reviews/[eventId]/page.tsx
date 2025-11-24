import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { User, Calendar, ExternalLink, ArrowLeft, ShieldCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";
import ReviewActions from "@/components/admin/ReviewActions"; // Componente cliente que crearemos
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function ReviewDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;
    const session = await auth();

    // Seguridad extra
    // @ts-ignore
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
        redirect("/dashboard");
    }

    // 1. Obtener datos completos del evento
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
            user: {
                select: { name: true, email: true, image: true, id: true }
            },
            polls: {
                include: {
                    _count: { select: { options: true } }
                }
            },
            participants: true,
            _count: {
                select: { polls: true, participants: true }
            }
        }
    });

    if (!event) notFound();

    return (
        <div className="max-w-5xl mx-auto pb-20">
            
            {/* Header de Navegación */}
            <div className="mb-8">
                <Link href="/admin/reviews" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4">
                    <ArrowLeft size={16} /> Volver a la cola
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            {event.title}
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                event.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                                event.status === 'APPROVED' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                                'bg-red-500/20 text-red-500 border-red-500/30'
                            }`}>
                                {event.status}
                            </span>
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1"><Calendar size={14} /> Creado {formatDistanceToNow(event.createdAt, { addSuffix: true, locale: es })}</span>
                            <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded text-xs font-mono">ID: {event.id}</span>
                        </div>
                    </div>

                    <Link 
                        href={`/e/${event.slug}`} 
                        target="_blank"
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
                    >
                        <ExternalLink size={16} /> Ver Web Pública
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* COLUMNA IZQUIERDA: DETALLES */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Descripción */}
                    <div className="bg-neutral-900 border border-white/10 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Descripción del Evento</h3>
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {event.description || <span className="italic text-gray-600">Sin descripción.</span>}
                        </p>
                    </div>

                    {/* Categorías (Polls) */}
                    <div className="bg-neutral-900 border border-white/10 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                            Categorías ({event.polls.length})
                        </h3>
                        <div className="space-y-3">
                            {event.polls.map(poll => (
                                <div key={poll.id} className="p-3 bg-black/30 rounded-lg border border-white/5 flex justify-between items-center">
                                    <span className="font-medium text-gray-200">{poll.title}</span>
                                    <span className="text-xs text-gray-500">{poll._count.options} opciones</span>
                                </div>
                            ))}
                            {event.polls.length === 0 && <p className="text-sm text-gray-500 italic">No hay categorías creadas.</p>}
                        </div>
                    </div>

                     {/* Participantes */}
                     <div className="bg-neutral-900 border border-white/10 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                            Participantes ({event.participants.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {event.participants.map(p => (
                                <div key={p.id} className="px-3 py-1.5 bg-black/30 rounded-full border border-white/5 text-xs text-gray-300 flex items-center gap-2">
                                    {p.imageUrl && <div className="w-4 h-4 rounded-full bg-gray-700 overflow-hidden relative"><img src={p.imageUrl} alt="" className="w-full h-full object-cover"/></div>}
                                    {p.name}
                                </div>
                            ))}
                            {event.participants.length === 0 && <p className="text-sm text-gray-500 italic">No hay participantes.</p>}
                        </div>
                    </div>

                </div>

                {/* COLUMNA DERECHA: ACCIONES Y USUARIO */}
                <div className="space-y-6">
                    
                    {/* Acciones de Moderación */}
                    <div className="bg-neutral-900 border border-white/10 rounded-xl p-6 sticky top-6">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <ShieldCheck size={16} /> Acciones de Moderación
                        </h3>
                        
                        {event.status === 'PENDING' ? (
                            <ReviewActions eventId={event.id} eventTitle={event.title} />
                        ) : (
                            <div className={`p-4 rounded-lg text-center border ${
                                event.status === 'APPROVED' ? 'bg-green-900/20 border-green-500/30 text-green-400' : 'bg-red-900/20 border-red-500/30 text-red-400'
                            }`}>
                                <p className="font-bold mb-1">Este evento ya ha sido {event.status === 'APPROVED' ? 'aprobado' : 'rechazado'}.</p>
                                {event.reviewReason && (
                                    <p className="text-xs opacity-80 mt-2 pt-2 border-t border-white/10">
                                        Motivo: {event.reviewReason}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Información del Creador */}
                    <div className="bg-neutral-900 border border-white/10 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <User size={16} /> Creador
                        </h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-sm overflow-hidden">
                                {event.user.image ? (
                                    <img src={event.user.image} alt={event.user.name || "?"} className="w-full h-full object-cover" />
                                ) : (
                                    event.user.name?.[0]
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm">{event.user.name}</p>
                                <p className="text-xs text-gray-500">{event.user.email}</p>
                            </div>
                        </div>
                        <Link 
                            href={`/admin/users/${event.user.id}`} 
                            className="block w-full py-2 text-center text-xs font-bold text-gray-400 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            Ver Perfil Completo
                        </Link>
                    </div>

                </div>

            </div>
        </div>
    );
}