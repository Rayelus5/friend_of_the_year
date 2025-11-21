import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache"; // <--- IMPORTANTE

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

        // --- CASO 1: CHECKOUT COMPLETADO ---
        if (event.type === "checkout.session.completed") {
            const appUserId = session.metadata?.userId;
            const subscriptionId = session.subscription as string;
            const customerId = session.customer as string;
            const userEmail = session.customer_details?.email;

            // Recuperar estado FRESCO
            const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
            const priceId = subscription.items.data[0]?.price.id;

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
                console.log(`✅ CHECKOUT: Usuario ${user.email} activado.`);

                // LIMPIAR CACHÉ DEL PERFIL
                revalidatePath('/dashboard/profile');
            }
        }

        // --- CASO 2: SUSCRIPCIÓN ACTUALIZADA (RENOVACIÓN O CANCELACIÓN) ---
        if (event.type === "customer.subscription.updated") {
            const subscriptionId = session.id as string;
            const customerId = session.customer as string;

            // 1. Obtener datos FRESCOS de Stripe
            const freshSubscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
            const priceId = freshSubscription.items.data[0]?.price.id;

            // 2. Buscar usuario
            let userToUpdate = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });

            if (!userToUpdate) {
                console.log(`⚠️ Customer ID no encontrado. Buscando por email...`);
                const customer = await stripe.customers.retrieve(customerId) as any;
                if (customer.email) {
                    userToUpdate = await prisma.user.findUnique({ where: { email: customer.email } });
                }
            }

            if (userToUpdate) {
                // Lógica extra: Si el estado es 'canceled', forzamos cancelAtPeriodEnd a true (aunque ya sea tarde)
                // para que la UI muestre "Finaliza" en lugar de "Renueva"
                const isCanceling = freshSubscription.cancel_at_period_end || freshSubscription.status === 'canceled';

                await prisma.user.update({
                    where: { id: userToUpdate.id },
                    data: {
                        stripeCustomerId: customerId,
                        stripeSubscriptionId: subscriptionId,
                        stripePriceId: priceId,
                        subscriptionStatus: freshSubscription.status,
                        subscriptionEndDate: new Date(freshSubscription.current_period_end * 1000),
                        cancelAtPeriodEnd: isCanceling,
                    },
                });
                console.log(`✅ SYNC: Usuario ${userToUpdate.email} actualizado. Cancelación: ${isCanceling}`);

                // LIMPIAR CACHÉ DEL PERFIL
                revalidatePath('/dashboard/profile');
            }
        }

        // --- CASO 3: SUSCRIPCIÓN ELIMINADA ---
        if (event.type === "customer.subscription.deleted") {
            const customerId = session.customer as string;

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
                revalidatePath('/dashboard/profile');
            }
        }

        return new NextResponse("OK", { status: 200 });

    } catch (error: any) {
        console.error("🔥 WEBHOOK ERROR:", error);
        return new NextResponse(`Server Error: ${error.message}`, { status: 500 });
    }
}