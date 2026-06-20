// src/lib/event-access.ts
//
// Helpers compartidos para las server actions de los modos nuevos (TIERLIST,
// PREGUNTAS, DIBUJO). Replica el patrón ya usado en event-actions.ts pero como
// módulo reutilizable, para no duplicarlo en cada archivo de acciones.

import { prisma } from "@/lib/prisma";
import { pusherServer, eventChannel, PUSHER_EVENTS } from "@/lib/pusher";

export type CollabPermission =
    | "canManageNominees"
    | "canManagePolls"
    | "canEditSettings"
    | "canDeleteEvent"
    | "canRegenerateKey";

/** Devuelve true si el usuario es dueño, admin/moderador o colaborador con el permiso indicado. */
export async function checkEventAccess(
    eventId: string,
    userId: string,
    permission: CollabPermission
): Promise<boolean> {
    const [event, collab, user] = await Promise.all([
        prisma.event.findUnique({
            where: { id: eventId },
            select: {
                userId: true,
                status: true,
                defaultCanEditSettings: true,
                defaultCanRegenerateKey: true,
                defaultCanDeleteEvent: true,
                defaultCanManageNominees: true,
                defaultCanManagePolls: true,
            },
        }),
        prisma.eventCollaborator.findUnique({
            where: { eventId_userId: { eventId, userId } },
        }),
        prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    ]);
    if (!event) return false;
    // Los administradores y moderadores pueden gestionar cualquier evento (igual que en Gala).
    if (user?.role === "ADMIN" || user?.role === "MODERATOR") return true;

    // Bloqueo de edición: nominados/categorías/tiers/preguntas NO se pueden editar
    // mientras el evento esté publicado (APPROVED) o en revisión (PENDING). Hay que
    // volver a borrador desde Ajustes ("Quiero hacer cambios"). No afecta a los admins.
    if (
        (permission === "canManageNominees" || permission === "canManagePolls") &&
        (event.status === "APPROVED" || event.status === "PENDING")
    ) {
        return false;
    }

    if (event.userId === userId) return true;
    if (!collab) return false;

    const defaultMap: Record<CollabPermission, boolean> = {
        canEditSettings: event.defaultCanEditSettings,
        canRegenerateKey: event.defaultCanRegenerateKey,
        canDeleteEvent: event.defaultCanDeleteEvent,
        canManageNominees: event.defaultCanManageNominees,
        canManagePolls: event.defaultCanManagePolls,
    };
    return collab[permission] ?? defaultMap[permission] ?? false;
}

/** Notifica a otros clientes del evento que los datos cambiaron (Pusher, best-effort). */
export async function triggerDataChanged(eventId: string, triggeredBy: string, dataType: string) {
    try {
        await pusherServer.trigger(eventChannel(eventId), PUSHER_EVENTS.DATA_CHANGED, {
            dataType,
            triggeredBy,
        });
    } catch {
        // no-op: los fallos de Pusher nunca deben romper la acción
    }
}
