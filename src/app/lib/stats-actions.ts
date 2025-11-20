'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getEventStats(eventId: string) {
    const session = await auth();
    if (!session?.user) return null;

    // 1. Obtener evento, sus encuestas y el recuento de votos
    // Aseguramos que el evento pertenezca al usuario (userId check)
    const event = await prisma.event.findUnique({
        where: { id: eventId, userId: session.user.id },
        include: {
            polls: {
                include: {
                    _count: { select: { votes: true } }
                }
            }
        }
    });

    if (!event) return null;

    // 2. Calcular Totales Generales
    const totalPolls = event.polls.length;
    // Sumamos los votos de todas las encuestas
    const totalVotes = event.polls.reduce((acc, poll) => acc + poll._count.votes, 0);

    // 3. Calcular Votos por Categoría (para el gráfico de barras horizontal)
    const votesByPoll = event.polls.map(p => ({
        name: p.title,
        votes: p._count.votes
    })).sort((a, b) => b.votes - a.votes); // Ordenamos de más votada a menos

    // 4. Calcular Actividad Reciente (Timeline)
    // Consultamos los votos crudos de este evento para ver cuándo se hicieron
    // Limitamos a los últimos 50 para no saturar la gráfica
    const recentVotes = await prisma.vote.findMany({
        where: {
            poll: { eventId: eventId }
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { createdAt: true }
    });

    // Agrupar votos por fecha (YYYY-MM-DD)
    const votesByDateMap = new Map<string, number>();

    recentVotes.forEach(vote => {
        // Cortamos la cadena ISO para quedarnos solo con la fecha (ignorando hora)
        const date = vote.createdAt.toISOString().split('T')[0];
        votesByDateMap.set(date, (votesByDateMap.get(date) || 0) + 1);
    });

    // Convertir el Map a un Array ordenado para el gráfico
    // (Revertimos para que salga de izquierda a derecha cronológicamente si tomamos los últimos)
    const activityTimeline = Array.from(votesByDateMap.entries())
        .map(([date, count]) => ({
            date,
            count
        }))
        .reverse(); // Opcional: depende de cómo quieras pintar el gráfico (de antiguo a nuevo)

    return {
        totalVotes,
        totalPolls,
        votesByPoll,
        activityTimeline
    };
}