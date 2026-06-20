"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanFromUser } from "@/lib/user-plan";
import { canCreateDrawingEvent, clampDrawingTime } from "@/lib/event-modes";
import { collectEventBlobUrls, deleteBlobsBatched } from "@/lib/blob-cleanup";
import { pusherServer, eventChannel, PUSHER_EVENTS } from "@/lib/pusher";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

const EVENT_MODES = ["GALA", "TIERLIST", "PREGUNTAS", "DIBUJO"] as const;
type EventModeValue = (typeof EVENT_MODES)[number];

async function triggerDataChanged(eventId: string, triggeredBy: string, dataType: string) {
    try {
        await pusherServer.trigger(eventChannel(eventId), PUSHER_EVENTS.DATA_CHANGED, {
            dataType,
            triggeredBy,
        });
    } catch {
        // no-op
    }
}

async function getCollaboratorPermission(
    eventId: string,
    userId: string,
    permission: "canEditSettings" | "canDeleteEvent" | "canRegenerateKey"
): Promise<{ isOwner: boolean; allowed: boolean }> {
    const [event, collab] = await Promise.all([
        prisma.event.findUnique({
            where: { id: eventId },
            select: {
                userId: true,
                defaultCanEditSettings: true,
                defaultCanRegenerateKey: true,
                defaultCanDeleteEvent: true,
            },
        }),
        prisma.eventCollaborator.findUnique({
            where: { eventId_userId: { eventId, userId } },
        }),
    ]);
    if (!event) return { isOwner: false, allowed: false };
    if (event.userId === userId) return { isOwner: true, allowed: true };

    const defaultMap = {
        canEditSettings: event.defaultCanEditSettings,
        canRegenerateKey: event.defaultCanRegenerateKey,
        canDeleteEvent: event.defaultCanDeleteEvent,
    };
    const allowed = !!(collab && (collab[permission] ?? defaultMap[permission]));
    return { isOwner: false, allowed };
}

// Esquema de validación
const eventSchema = z.object({
  title: z
    .string()
    .min(3, "El título es muy corto")
    .regex(
      /^[\w\s\-\.,:;!¡?¿()áéíóúÁÉÍÓÚñÑüÜ]+$/,
      "El título contiene caracteres no permitidos."
    ),
  description: z.string().optional(),
});

// --- CREAR EVENTO ---
export async function createEvent(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { _count: { select: { events: true } } },
  });

  if (!user) return { error: "Usuario no encontrado" };

  const plan = await getPlanFromUser(user);
  const currentEvents = user._count.events;

  if (currentEvents >= plan.quota) {
    return {
      error: `Has alcanzado el límite de tu plan ${plan.name}. Actualiza a Premium.`,
    };
  }

  const titleRaw = formData.get("title") as string;
  const descRaw = formData.get("description") as string;
  const tagsRaw = formData.get("tags") as string;

  const validated = eventSchema.safeParse({
    title: titleRaw,
    description: descRaw,
  });

  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { title, description } = validated.data;

  // --- MODO DEL EVENTO ---
  const modeRaw = (formData.get("mode") as string | null)?.toUpperCase();
  const mode: EventModeValue = EVENT_MODES.includes(modeRaw as EventModeValue)
    ? (modeRaw as EventModeValue)
    : "GALA";

  const slug =
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") +
    "-" +
    Math.floor(Math.random() * 10000);

  const defaultGalaDate = new Date();
  defaultGalaDate.setDate(defaultGalaDate.getDate() + 2);

  // Fecha de fin/cierre elegida por el usuario (modos no-DIBUJO).
  // El cliente la envía en ISO; si falta o es inválida/pasada, se usa el valor por defecto.
  let chosenGalaDate: Date | null = null;
  if (mode !== "DIBUJO") {
    const galaDateStr = formData.get("galaDate") as string | null;
    if (galaDateStr) {
      const parsed = new Date(galaDateStr);
      if (!isNaN(parsed.getTime()) && parsed > new Date()) {
        chosenGalaDate = parsed;
      }
    }
  }

  // Datos espec\u00edficos de modo (solo se rellenan para DIBUJO)
  const drawingData: {
    drawingPrompt?: string;
    drawingTimeLimit?: number | null;
    drawingPhase?: "DRAWING";
    drawingDeadline?: Date;
    votingDeadline?: Date;
    galaDate?: Date;
  } = {};

  if (mode === "DIBUJO") {
    // 1) El plan debe permitirlo y no superar el m\u00e1ximo de eventos DIBUJO
    const check = await canCreateDrawingEvent(session.user.id, plan);
    if (!check.ok) return { error: check.error };

    // 2) Fechas obligatorias: cierre de dibujo < cierre de votaci\u00f3n
    const drawingDeadlineStr = formData.get("drawingDeadline") as string | null;
    const votingDeadlineStr = formData.get("votingDeadline") as string | null;
    const drawingDeadline = drawingDeadlineStr ? new Date(drawingDeadlineStr) : null;
    const votingDeadline = votingDeadlineStr ? new Date(votingDeadlineStr) : null;

    if (!drawingDeadline || isNaN(drawingDeadline.getTime()) || !votingDeadline || isNaN(votingDeadline.getTime())) {
      return { error: "Debes indicar las fechas de cierre de dibujo y de votaci\u00f3n." };
    }
    if (drawingDeadline <= new Date()) {
      return { error: "La fecha de cierre de dibujo debe ser futura." };
    }
    if (votingDeadline <= drawingDeadline) {
      return { error: "El cierre de votaci\u00f3n debe ser posterior al cierre de dibujo." };
    }

    // 3) Tiempo por participante (clamp al rango del plan; "ilimitado" si lo permite)
    const wantsUnlimited = formData.get("drawingUnlimited") === "on";
    const timeRaw = formData.get("drawingTimeLimit") as string | null;
    const requested = wantsUnlimited ? null : timeRaw ? parseInt(timeRaw, 10) : null;
    const timeLimit = clampDrawingTime(requested, plan);

    drawingData.drawingPrompt = ((formData.get("drawingPrompt") as string | null) ?? "").slice(0, 500);
    drawingData.drawingTimeLimit = timeLimit;
    drawingData.drawingPhase = "DRAWING";
    drawingData.drawingDeadline = drawingDeadline;
    drawingData.votingDeadline = votingDeadline;
    drawingData.galaDate = votingDeadline; // El "fin" del evento DIBUJO es el cierre de votaci\u00f3n
  }

  try {
    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        tags: tagsRaw ? tagsRaw.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
        slug,
        userId: session.user.id,
        isPublic: false, // DIBUJO siempre privado; el resto nace privado igualmente
        status: "DRAFT",
        mode,
        galaDate: drawingData.galaDate ?? chosenGalaDate ?? defaultGalaDate,
        ...(mode === "DIBUJO"
          ? {
              drawingPrompt: drawingData.drawingPrompt,
              drawingTimeLimit: drawingData.drawingTimeLimit,
              drawingPhase: drawingData.drawingPhase,
              drawingDeadline: drawingData.drawingDeadline,
              votingDeadline: drawingData.votingDeadline,
            }
          : {}),
      },
    });

    return { success: true, eventId: newEvent.id };
  } catch (error) {
    console.error(error);
    return { error: "Error al crear evento" };
  }
}

// --- ACTUALIZAR EVENTO ---
export async function updateEvent(eventId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;

  const isAdmin =
    session.user.role === "ADMIN" || session.user.role === "MODERATOR";

  // 1) Verificar permisos (dueño, admin o colaborador con canEditSettings)
  const { isOwner, allowed } = await getCollaboratorPermission(eventId, session.user.id, "canEditSettings");
  if (!isAdmin && !allowed) {
    console.warn("Intento de actualizar evento sin permisos", { eventId, userId: session.user.id });
    return;
  }

  // 2) Buscar evento
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, status: true, userId: true },
  });

  if (!event) {
    console.warn("Evento inexistente", { eventId });
    return;
  }

  // 2.bis) Bloqueo de edición: un evento publicado (APPROVED) o en revisión
  // (PENDING) no puede editarlo su dueño/colaborador. Debe pasarlo a borrador
  // con `revertEventToDraft`. Los admins/moderadores sí pueden editar siempre.
  if (!isAdmin && (event.status === "APPROVED" || event.status === "PENDING")) {
    console.warn("Intento de editar evento bloqueado", { eventId, status: event.status });
    return { error: "El evento está publicado o en revisión. Ponlo en borrador para poder editarlo." };
  }

  // 2) Leer datos del formulario
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const galaDateStr = formData.get("galaDate") as string;
  const tagsRaw = formData.get("tags") as string | null;
  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
    : [];

  const isPublicInput = formData.get("isPublic") === "on";
  const isAnonymousVoting = formData.get("isAnonymousVoting") === "on";

  let galaDate: Date | null = null;
  if (galaDateStr && galaDateStr !== "") {
    const parsedDate = new Date(galaDateStr);
    if (!isNaN(parsedDate.getTime())) {
      galaDate = parsedDate;
    }
  }

  // 3) Lógica de isPublic: sólo puede ser true si el evento está APPROVED
  let newIsPublic = false;
  if (event.status === "APPROVED") {
    newIsPublic = isPublicInput;
  }

  // 4) Actualizar evento (ya sabemos que existe y tenemos permisos)
  await prisma.event.update({
    where: { id: eventId },
    data: {
      title,
      description,
      galaDate,
      isPublic: newIsPublic,
      isAnonymousVoting,
      tags,
    },
  });

  // 5) Revalidar rutas
  revalidatePath(`/dashboard/event/${eventId}`);
  if (newIsPublic) revalidatePath("/polls");
  revalidateTag("events-public", {});
  if (isAdmin) {
    revalidatePath("/admin/events");
  }

  await triggerDataChanged(eventId, session.user.id, "settings");
}

// --- BORRAR EVENTO ---
export async function deleteEvent(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const isAdmin =
    session.user.role === "ADMIN" || session.user.role === "MODERATOR";

  const { allowed } = await getCollaboratorPermission(eventId, session.user.id, "canDeleteEvent");
  if (!isAdmin && !allowed) {
    console.warn("Intento de borrar evento sin permisos", { eventId, userId: session.user.id });
    return;
  }

  // Recoger las URLs de Blob ANTES de borrar (el cascade elimina las filas)
  const blobUrls = await collectEventBlobUrls({ eventId });

  await prisma.$transaction(async (tx) => {
    await tx.report.deleteMany({ where: { eventId } });
    await tx.moderationLog.deleteMany({ where: { eventId } });
    await tx.event.delete({ where: { id: eventId } });
  });

  // Borrar los blobs huérfanos (best-effort; no rompe el borrado si falla)
  await deleteBlobsBatched(blobUrls);

  revalidateTag("events-public", {});

  if (isAdmin) {
    revalidatePath("/admin/events");
    redirect("/admin/events");
  } else {
    revalidatePath("/dashboard");
    redirect("/dashboard");
  }
}

// --- ROTAR CLAVE PRIVADA ---
export async function rotateEventKey(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const isAdmin =
    session.user.role === "ADMIN" || session.user.role === "MODERATOR";

  const { allowed } = await getCollaboratorPermission(eventId, session.user.id, "canRegenerateKey");
  if (!isAdmin && !allowed) {
    console.warn("Intento de rotar clave sin permisos", { eventId, userId: session.user.id });
    return;
  }

  await prisma.event.update({
    where: { id: eventId },
    data: { accessKey: crypto.randomUUID() },
  });

  revalidatePath(`/dashboard/event/${eventId}`);
  if (isAdmin) {
    revalidatePath("/admin/events");
  }

  await triggerDataChanged(eventId, session.user.id, "settings");
}

// --- SOLICITAR PUBLICACIÓN (NUEVO) ---
export async function requestEventPublication(eventId: string) {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  const isAdmin =
    session.user.role === "ADMIN" || session.user.role === "MODERATOR";

  // Normalmente el que solicita es el dueño, pero dejamos que admin/mod también puedan
  const event = await prisma.event.findFirst({
    where: isAdmin
      ? { id: eventId }
      : {
          id: eventId,
          userId: session.user.id,
        },
  });

  if (!event) return { error: "Evento no encontrado o sin permisos" };

  if (event.status === "PENDING") return { error: "Ya está en revisión." };
  if (event.status === "APPROVED") return { error: "El evento ya es público." };

  if (event.status !== "DRAFT" && event.status !== "DENIED") {
    return { error: "Estado de evento no válido para solicitud." };
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      status: "PENDING",
      reviewReason: null,
    },
    select: {
      id: true,
      status: true,
      reviewReason: true,
    },
  });

  // Revalidamos la página del evento y, según quién sea, su listado
  revalidatePath(`/dashboard/event/${eventId}`);
  revalidatePath("/dashboard/requests");
  if (isAdmin) {
    revalidatePath("/admin/events");
  }

  return { success: true, event: updated };
}

// --- VOLVER A BORRADOR PARA EDITAR (NUEVO) ---
// Un evento publicado o en revisión no es editable. Esta acción lo devuelve a
// BORRADOR y lo pone en privado para que el usuario pueda hacer cambios y luego
// volver a solicitar la publicación.
export async function revertEventToDraft(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const isAdmin =
    session.user.role === "ADMIN" || session.user.role === "MODERATOR";

  const { allowed } = await getCollaboratorPermission(eventId, session.user.id, "canEditSettings");
  if (!isAdmin && !allowed) {
    console.warn("Intento de revertir evento sin permisos", { eventId, userId: session.user.id });
    return { error: "Sin permisos para editar este evento." };
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, status: true },
  });

  if (!event) return { error: "Evento no encontrado" };

  if (event.status !== "APPROVED" && event.status !== "PENDING") {
    return { error: "El evento ya es editable." };
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      status: "DRAFT",
      isPublic: false,
      reviewReason: null,
    },
    select: {
      id: true,
      status: true,
      isPublic: true,
      reviewReason: true,
    },
  });

  revalidatePath(`/dashboard/event/${eventId}`);
  revalidatePath("/dashboard/requests");
  revalidateTag("events-public", {});
  if (isAdmin) {
    revalidatePath("/admin/events");
  }

  await triggerDataChanged(eventId, session.user.id, "settings");

  return { success: true, event: updated };
}
