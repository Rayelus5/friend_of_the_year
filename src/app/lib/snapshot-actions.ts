"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Resultados agregados que se guardan en VoteSnapshot.data (modo GALA).
export type SnapshotData = {
    totalVotes: number;
    totalPolls: number;
    polls: {
        title: string;
        totalVotes: number;
        winner: string | null;
        options: { name: string; imageUrl: string | null; votesCount: number }[];
    }[];
};

export type VoteSnapshotDTO = {
    id: string;
    title: string;
    totalVotes: number;
    galaDate: Date;
    createdAt: Date;
    data: SnapshotData;
};

// Solo el dueño del evento o un admin/moderador pueden gestionar snapshots
// (crear uno borra los votos actuales: es una acción destructiva).
async function resolveOwnerOrAdmin(eventId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" as const };
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, userId: true, galaDate: true },
    });
    if (!event) return { error: "Evento no encontrado" as const };
    if (!isAdmin && event.userId !== session.user.id) return { error: "Sin permisos" as const };
    return { event, userId: session.user.id, isAdmin };
}

export async function listVoteSnapshots(eventId: string): Promise<VoteSnapshotDTO[]> {
    const ctx = await resolveOwnerOrAdmin(eventId);
    if ("error" in ctx) return [];

    const rows = await prisma.voteSnapshot.findMany({
        where: { eventId },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, totalVotes: true, galaDate: true, createdAt: true, data: true },
    });

    return rows.map((r) => ({
        id: r.id,
        title: r.title,
        totalVotes: r.totalVotes,
        galaDate: r.galaDate,
        createdAt: r.createdAt,
        data: r.data as unknown as SnapshotData,
    }));
}

/**
 * Guarda los resultados actuales del evento como un snapshot ("edición") y
 * REINICIA las votaciones borrando todos los votos. Pensado para repetir un
 * evento en otra edición cambiando luego la fecha de la gala.
 */
export async function createVoteSnapshot(eventId: string, titleRaw: string) {
    const ctx = await resolveOwnerOrAdmin(eventId);
    if ("error" in ctx) return { error: ctx.error };

    const title = (titleRaw ?? "").trim();
    if (!title) return { error: "El título es obligatorio." };
    if (title.length > 120) return { error: "El título supera los 120 caracteres." };

    // 1) Agregar resultados actuales (modo GALA: categorías + votos)
    const polls = await prisma.poll.findMany({
        where: { eventId },
        select: {
            title: true,
            _count: { select: { votes: true } },
            options: {
                select: {
                    participant: { select: { name: true, imageUrl: true } },
                    _count: { select: { votes: true } },
                },
            },
        },
    });

    const pollsData = polls.map((p) => {
        const options = p.options
            .map((o) => ({
                name: o.participant.name,
                imageUrl: o.participant.imageUrl,
                votesCount: o._count.votes,
            }))
            .sort((a, b) => b.votesCount - a.votesCount);
        return {
            title: p.title,
            totalVotes: p._count.votes,
            winner: options[0]?.votesCount ? options[0].name : null,
            options,
        };
    });

    const totalVotes = polls.reduce((acc, p) => acc + p._count.votes, 0);

    if (totalVotes === 0) {
        return { error: "No hay votos que guardar todavía." };
    }

    const data: SnapshotData = {
        totalVotes,
        totalPolls: polls.length,
        polls: pollsData,
    };

    // 2) Transacción: crear snapshot + borrar votos (reinicio de estadísticas)
    await prisma.$transaction(async (tx) => {
        await tx.voteSnapshot.create({
            data: {
                eventId,
                title,
                data: data as unknown as Prisma.InputJsonValue,
                totalVotes,
                galaDate: ctx.event.galaDate,
            },
        });

        const votes = await tx.vote.findMany({
            where: { poll: { eventId } },
            select: { id: true },
        });
        const voteIds = votes.map((v) => v.id);
        if (voteIds.length) {
            await tx.voteOption.deleteMany({ where: { voteId: { in: voteIds } } });
            await tx.vote.deleteMany({ where: { id: { in: voteIds } } });
        }
    });

    revalidatePath(`/dashboard/event/${eventId}`);
    return { success: true };
}

export async function deleteVoteSnapshot(snapshotId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";

    const snap = await prisma.voteSnapshot.findUnique({
        where: { id: snapshotId },
        select: { eventId: true, event: { select: { userId: true } } },
    });
    if (!snap) return { error: "Snapshot no encontrado" };
    if (!isAdmin && snap.event.userId !== session.user.id) return { error: "Sin permisos" };

    await prisma.voteSnapshot.delete({ where: { id: snapshotId } });
    revalidatePath(`/dashboard/event/${snap.eventId}`);
    return { success: true };
}
