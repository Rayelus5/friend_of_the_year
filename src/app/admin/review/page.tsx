import { prisma } from "@/lib/prisma";
import ReviewCard from "@/components/admin/ReviewCard"; // Asegúrate de tener este componente

export const dynamic = "force-dynamic";

export default async function AdminReviewPage() {
    // Buscar eventos pendientes de revisión
    const pendingEvents = await prisma.event.findMany({
        where: { status: 'PENDING' },
        orderBy: { updatedAt: 'asc' },
        include: {
            user: { select: { name: true, email: true, image: true } },
            _count: { select: { polls: true, participants: true } }
        }
    });

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Solicitudes de Publicación</h1>
                    <p className="text-gray-400 mt-1">Modera los eventos antes de que sean públicos.</p>
                </div>
                <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/20">
                    {pendingEvents.length} Pendientes
                </span>
            </div>

            <div className="space-y-6">
                {pendingEvents.map(event => (
                    <ReviewCard key={event.id} event={event} />
                ))}

                {pendingEvents.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 rounded-2xl bg-white/5 text-center">
                        <div className="text-4xl mb-4 grayscale opacity-50">✨</div>
                        <h3 className="text-xl font-bold text-white mb-2">Todo limpio</h3>
                        <p className="text-gray-500">No hay solicitudes pendientes de revisión.</p>
                    </div>
                )}
            </div>
        </div>
    );
}