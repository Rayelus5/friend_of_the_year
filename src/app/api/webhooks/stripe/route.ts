import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
    apiVersion: "2024-12-18.acacia" as any,
});

export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(req: Request) {
    const headersList = await headers();
    const signature = headersList.get("Stripe-Signature") as string;

    if (!signature) return new NextResponse("Missing Stripe Signature", { status: 400 });

    let buffer: Buffer;
    try {
        const rawBody = await req.arrayBuffer();
        buffer = Buffer.from(rawBody);
    } catch (error) {
        return new NextResponse("Failed to read body", { status: 500 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            buffer,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error("⚠️ Webhook Signature Error:", error.message);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    try {
        const session = event.data.object as any;

        // --- CASO 1: CHECKOUT COMPLETADO (PRIMER PAGO) ---
        if (event.type === "checkout.session.completed") {
            const appUserId = session.metadata?.userId;
            const subscriptionId = session.subscription as string;
            const customerId = session.customer as string;
            const userEmail = session.customer_details?.email; // Email usado en el checkout

            // Recuperar estado FRESCO
            const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
            const priceId = subscription.items.data[0]?.price.id;

            // Estrategia de búsqueda: ID interno -> Email -> Fallo
            let user = null;
            if (appUserId) {
                user = await prisma.user.findUnique({ where: { id: appUserId } });
            } else if (userEmail) {
                user = await prisma.user.findUnique({ where: { email: userEmail } });
            }

            if (user) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        stripeCustomerId: customerId,
                        stripeSubscriptionId: subscriptionId,
                        stripePriceId: priceId,
                        subscriptionStatus: "active",
                        subscriptionEndDate: new Date(subscription.current_period_end * 1000),
                        cancelAtPeriodEnd: subscription.cancel_at_period_end,
                    },
                });
                console.log(`✅ CHECKOUT: Usuario ${user.email} vinculado y activado.`);
            } else {
                console.error("❌ Error: No se encontró usuario para vincular el pago.");
            }
        }

        // --- CASO 2: SUSCRIPCIÓN ACTUALIZADA (RENOVACIÓN O CANCELACIÓN) ---
        if (event.type === "customer.subscription.updated") {
            const subscriptionId = session.id as string;
            const customerId = session.customer as string;

            // 1. Obtener datos FRESCOS de Stripe (siempre)
            const freshSubscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
            const priceId = freshSubscription.items.data[0]?.price.id;

            // 2. Buscar al usuario de forma inteligente (ID Cliente -> Email)
            let userToUpdate = await prisma.user.findUnique({
                where: { stripeCustomerId: customerId },
            });

            // Si no lo encontramos por ID de Cliente (desincronización), buscamos por email
            if (!userToUpdate) {
                console.log(`⚠️ Customer ID ${customerId} no encontrado en DB. Intentando recuperar por email...`);
                const customer = await stripe.customers.retrieve(customerId) as any;
                if (customer.email) {
                    userToUpdate = await prisma.user.findUnique({ where: { email: customer.email } });
                }
            }

            if (userToUpdate) {
                await prisma.user.update({
                    where: { id: userToUpdate.id },
                    data: {
                        // Actualizamos el Customer ID por si estaba mal
                        stripeCustomerId: customerId,
                        stripeSubscriptionId: subscriptionId,
                        stripePriceId: priceId,
                        subscriptionStatus: freshSubscription.status,
                        subscriptionEndDate: new Date(freshSubscription.current_period_end * 1000),
                        cancelAtPeriodEnd: freshSubscription.cancel_at_period_end,
                    },
                });
                console.log(`✅ SYNC: Usuario ${userToUpdate.email} actualizado. Cancelación: ${freshSubscription.cancel_at_period_end}`);
            } else {
                console.error(`❌ Error crítico: No se encontró usuario para la suscripción ${subscriptionId}`);
            }
        }

        // --- CASO 3: SUSCRIPCIÓN ELIMINADA ---
        if (event.type === "customer.subscription.deleted") {
            const customerId = session.customer as string;

            // Misma lógica de búsqueda inteligente
            let userToUpdate = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });

            if (!userToUpdate) {
                const customer = await stripe.customers.retrieve(customerId) as any;
                if (customer.email) userToUpdate = await prisma.user.findUnique({ where: { email: customer.email } });
            }

            if (userToUpdate) {
                await prisma.user.update({
                    where: { id: userToUpdate.id },
                    data: {
                        subscriptionStatus: "free",
                        stripePriceId: null,
                        stripeSubscriptionId: null,
                        subscriptionEndDate: null,
                        cancelAtPeriodEnd: false,
                    },
                });
                console.log(`🗑️ DELETE: Suscripción eliminada para ${userToUpdate.email}`);
            }
        }

        return new NextResponse("OK", { status: 200 });

    } catch (error: any) {
        console.error("🔥 WEBHOOK ERROR:", error);
        return new NextResponse(`Server Error: ${error.message}`, { status: 500 });
    }
}