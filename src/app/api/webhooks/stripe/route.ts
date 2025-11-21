import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { NextResponse } from "next/server";

// 1. Inicializamos sin forzar versión para evitar errores de "Invalid API version"
// Si TypeScript se queja, puedes poner: as any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
    apiVersion: "2024-12-18.acacia", // Ponemos EXACTAMENTE la que sale en tu log de Stripe
});

export async function POST(req: Request) {
    const body = await req.text();
    const signature = headers().get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error("⚠️ Webhook Signature Error:", error.message);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    // Bloque de seguridad para capturar errores lógicos
    try {
        const session = event.data.object as Stripe.Checkout.Session;

        // --- CASO 1: PAGO COMPLETADO ---
        if (event.type === "checkout.session.completed" || event.type === "customer.subscription.updated") {

            // Validar datos mínimos
            if (!session.subscription) {
                console.error("❌ Error: El evento no tiene ID de suscripción.");
                return new NextResponse("Missing subscription ID", { status: 400 });
            }

            const subscriptionId = session.subscription as string;
            const customerId = session.customer as string;

            console.log(`🔄 Procesando suscripción: ${subscriptionId} para cliente: ${customerId}`);

            // Recuperar detalles de la suscripción de Stripe
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);

            // Validar que existen items
            if (!subscription.items.data.length) {
                console.error("❌ Error: La suscripción no tiene items/precios.");
                return new NextResponse("Invalid subscription data", { status: 400 });
            }

            const priceId = subscription.items.data[0].price.id;

            // Actualizar Base de Datos
            console.log(`💾 Guardando en DB... Precio: ${priceId}`);

            const updatedUser = await prisma.user.update({
                where: { stripeCustomerId: customerId },
                data: {
                    stripeSubscriptionId: subscriptionId,
                    stripePriceId: priceId,
                    subscriptionStatus: "active",
                    subscriptionEndDate: new Date(subscription.current_period_end * 1000),
                },
            });

            console.log(`✅ ÉXITO: Usuario ${updatedUser.email} actualizado a Premium.`);
        }

        // --- CASO 2: SUSCRIPCIÓN CANCELADA ---
        if (event.type === "customer.subscription.deleted") {
            const customerId = session.customer as string;
            console.log(`🗑️ Cancelando suscripción para cliente: ${customerId}`);

            await prisma.user.update({
                where: { stripeCustomerId: customerId },
                data: {
                    subscriptionStatus: "free",
                    stripePriceId: null
                },
            });
        }

        return new NextResponse("OK", { status: 200 });

    } catch (error: any) {
        // Aquí capturamos el error real que causaba el 500
        console.error("🔥 CRITICAL WEBHOOK ERROR:", error);
        // Devolvemos 500 pero con mensaje para debug (solo visible en logs de Vercel)
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
    }
}