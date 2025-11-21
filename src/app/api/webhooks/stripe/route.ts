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

    if (!signature) {
        return new NextResponse("Missing Stripe Signature", { status: 400 });
    }

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

        // --- CASO 1: CHECKOUT COMPLETADO ---
        if (event.type === "checkout.session.completed") {
            const appUserId = session.metadata?.userId;
            const subscriptionId = session.subscription as string;
            const customerId = session.customer as string;

            if (!subscriptionId || !customerId || !appUserId) {
                return new NextResponse("Missing essential IDs", { status: 400 });
            }

            console.log(`🔄 Checkout completado: ${subscriptionId}`);

            // Recuperar estado FRESCO
            const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
            const priceId = subscription.items.data[0]?.price.id;

            await prisma.user.update({
                where: { id: appUserId },
                data: {
                    stripeCustomerId: customerId,
                    stripeSubscriptionId: subscriptionId,
                    stripePriceId: priceId,
                    subscriptionStatus: "active",
                    subscriptionEndDate: new Date(subscription.current_period_end * 1000),
                    cancelAtPeriodEnd: subscription.cancel_at_period_end,
                },
            });
        }

        // --- CASO 2: SUSCRIPCIÓN ACTUALIZADA (La clave para tu error) ---
        if (event.type === "customer.subscription.updated") {
            // El objeto 'session' aquí es una Subscription antigua
            const oldSubscription = session;
            const customerId = oldSubscription.customer as string;
            const subscriptionId = oldSubscription.id as string;

            const userToUpdate = await prisma.user.findUnique({
                where: { stripeCustomerId: customerId },
                select: { id: true, email: true }
            });

            if (userToUpdate) {
                // Ignoramos los datos del evento y pedimos los FRESCOS (actualizados) a Stripe
                // Esto arregla el problema de reenviar eventos antiguos
                const freshSubscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

                const priceId = freshSubscription.items.data[0]?.price.id;

                await prisma.user.update({
                    where: { id: userToUpdate.id },
                    data: {
                        stripePriceId: priceId,
                        subscriptionStatus: freshSubscription.status,
                        subscriptionEndDate: new Date(freshSubscription.current_period_end * 1000),

                        // Ahora sí guardamos el valor REAL actual
                        cancelAtPeriodEnd: freshSubscription.cancel_at_period_end,
                    },
                });
                console.log(`✅ SYNC FRESH: ${userToUpdate.email} -> CancelAtEnd: ${freshSubscription.cancel_at_period_end}`);
            }
        }

        // --- CASO 3: SUSCRIPCIÓN ELIMINADA ---
        if (event.type === "customer.subscription.deleted") {
            const customerId = session.customer as string;

            await prisma.user.update({
                where: { stripeCustomerId: customerId },
                data: {
                    subscriptionStatus: "free",
                    stripePriceId: null,
                    stripeSubscriptionId: null,
                    subscriptionEndDate: null,
                    cancelAtPeriodEnd: false,
                },
            });
        }

        return new NextResponse("OK", { status: 200 });

    } catch (error: any) {
        console.error("🔥 WEBHOOK ERROR:", error);
        return new NextResponse(`Server Error: ${error.message}`, { status: 500 });
    }
}