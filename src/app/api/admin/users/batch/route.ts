// app/api/admin/users/batch/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Opcional: importa tu auth() si la tienes y valida permisos admin
// import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, ids, role, ban, plan } = body as {
            action: string;
            ids: string[];
            role?: string;
            ban?: boolean;
            plan?: string;
        };

        // Validación básica
        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "No se recibieron ids." }, { status: 400 });
        }

        // -> PROTEGE AQUÍ: comprobar que el usuario logueado es admin
        // const session = await auth();
        // if (!session?.user || !session.user.isAdmin) {
        //   return NextResponse.json({ error: "No autorizado." }, { status: 403 });
        // }

        if (action === "delete") {
            await prisma.user.deleteMany({ where: { id: { in: ids } } });
            return NextResponse.json({ success: true });
        }

        if (action === "ban") {
            if (typeof ban !== "boolean") {
                return NextResponse.json({ error: "Falta parámetro ban." }, { status: 400 });
            }
            await prisma.user.updateMany({ where: { id: { in: ids } }, data: { ipBan: ban } });
            return NextResponse.json({ success: true });
        }

        if (action === "setRole") {
            if (!role) return NextResponse.json({ error: "Falta role." }, { status: 400 });
            await prisma.user.updateMany({ where: { id: { in: ids } }, data: { role } });
            return NextResponse.json({ success: true });
        }

        if (action === "setPlan") {
            // plan puede ser "free" | "premium" | "plus" | "unlimited"
            // Ajusta price IDs a tus constantes PLANS
            const PRICE_MAP: Record<string, string | null> = {
                free: null,
                premium: process.env.PRICE_PREMIUM_ID ?? null,
                plus: process.env.PRICE_PLUS_ID ?? null,
                unlimited: process.env.PRICE_UNLIMITED_ID ?? null,
            };

            if (!plan || !(plan in PRICE_MAP)) {
                return NextResponse.json({ error: "Plan no válido." }, { status: 400 });
            }

            const stripePriceId = PRICE_MAP[plan];
            const subscriptionStatus = plan === "free" ? "free" : "active";

            await prisma.user.updateMany({
                where: { id: { in: ids } },
                data: { stripePriceId, subscriptionStatus },
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Acción no soportada." }, { status: 400 });
    } catch (err) {
        console.error("Error batch admin users:", err);
        return NextResponse.json({ error: "Error interno." }, { status: 500 });
    }
}