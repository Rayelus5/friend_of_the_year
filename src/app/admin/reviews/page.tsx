import { prisma } from "@/lib/prisma";
import ReviewCard from "@/components/admin/ReviewCard"; // Lo creamos a continuación
import { CheckSquare } from "lucide-react";
import AdminPagination from "@/components/admin/AdminPagination";
const PAGE_SIZE = 2;

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>;
}) {

    const params = await searchParams;
    const pageRaw = params?.page ?? "1";
    const currentPage = Math.max(1, Number(pageRaw) || 1);

    const where = { status: 'PENDING' as const };

    const [events, totalEvents] = await Promise.all([
        prisma.event.findMany({
            where,
            orderBy: { updatedAt: 'asc' }, // FIFO: Los que llevan más tiempo esperando primero
            skip: (currentPage - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
            include: {
                user: { select: { name: true, email: true, image: true } },
                _count: { select: { polls: true, participants: true } }
            }
        }),
        prisma.event.count({ where }),
    ])

    const totalPages = Math.max(1, Math.ceil(totalEvents / PAGE_SIZE));

    // Obtener eventos pendientes de revisión
    // Incluimos datos del usuario y conteos para tener contexto al moderar
    // const events = await prisma.event.findMany({
    //     where: { status: 'PENDING' },
    //     orderBy: { updatedAt: 'asc' }, // FIFO: Los que llevan más tiempo esperando primero
    //     include: {
    //         user: { select: { name: true, email: true, image: true } },
    //         _count: { select: { polls: true, participants: true } }
    //     }
    // });

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
                        <CheckSquare size={28} className="text-yellow-500" /> 
                        Cola de Revisión
                    </h1>
                    <p className="text-gray-400 mt-1">Modera el contenido antes de que sea público.</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${totalEvents === 0 ? 'border-green-500/20' : 'border-amber-500/20'}`}>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: totalEvents === 0 ? 'green' : 'amber' }}></div>
                    <span className={`${totalEvents === 0 ? 'text-green-500' : 'text-amber-500'} text-xs font-bold`}>{totalEvents} Pendientes</span>
                </div>
            </div>

            <div className="space-y-6">
                {events.map(event => (
                    <ReviewCard key={event.id} event={event} />
                ))}

                {totalEvents === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/10 rounded-2xl bg-white/5 text-center">
                        <div className="text-4xl mb-4 grayscale opacity-50">🎉</div>
                        <h3 className="text-xl font-bold text-white mb-2">¡Todo limpio!</h3>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto">
                            No hay solicitudes pendientes. Buen trabajo manteniendo la comunidad segura.
                        </p>
                    </div>
                )}
            </div>

            <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath="/admin/reviews"
            />
        </div>
    );
}