// app/api/admin/events/batch/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, ids, status } = body as {
            action: string;
            ids: string[];
            status?: string;
        };

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "No se recibieron ids." }, { status: 400 });
        }

        if (action === "delete") {
            // Borrado masivo
            await prisma.event.deleteMany({
                where: { id: { in: ids } },
            });
            return NextResponse.json({ success: true });
        }

        if (action === "updateStatus") {
            if (!status) {
                return NextResponse.json({ error: "Falta el nuevo status." }, { status: 400 });
            }
            await prisma.event.updateMany({
                where: { id: { in: ids } },
                data: { status },
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Acción no soportada." }, { status: 400 });
    } catch (err) {
        console.error("Error batch admin events:", err);
        return NextResponse.json({ error: "Error interno." }, { status: 500 });
    }
}