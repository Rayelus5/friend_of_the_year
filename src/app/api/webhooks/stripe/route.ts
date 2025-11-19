import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
});

export async function POST(req: Request) {
    const body = await req.text();
    const signature = headers().get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        // 1. Verificar que la llamada viene realmente de Stripe
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    // 2. Manejar el evento de "Pago Completado"
    if (event.type === "checkout.session.completed") {
        // Recuperamos los datos importantes
        const subscriptionId = session.subscription as string;
        const userId = session.metadata?.userId;

        // Si no hay userId, algo raro pasó (no debería ocurrir si usaste metadata)
        if (!userId) {
            return new NextResponse("User ID not found in metadata", { status: 400 });
        }

        // Obtener detalles de la suscripción para saber el Price ID (el plan)
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0].price.id;

        // 3. Actualizar Usuario en Base de Datos
        await prisma.user.update({
            where: { id: userId },
            data: {
                stripeSubscriptionId: subscriptionId,
                stripeCustomerId: session.customer as string,
                stripePriceId: priceId,
                subscriptionStatus: "active",
                // Opcional: Calcular fecha fin sumando 1 mes, aunque Stripe lo gestiona
                subscriptionEndDate: new Date(subscription.current_period_end * 1000),
            },
        });

        console.log(`✅ Usuario ${userId} actualizado a plan ${priceId}`);
    }

    // 3. Manejar cancelación/impago (Opcional para MVP, pero recomendado)
    if (event.type === "invoice.payment_failed" || event.type === "customer.subscription.deleted") {
        const subscriptionId = session.id; // En estos eventos el object es la sub o invoice
        // Buscaríamos al usuario por subscriptionId y lo pondríamos en 'free' o 'past_due'
        // (Implementación simplificada para MVP: solo activamos)
    }

    return new NextResponse(null, { status: 200 });
}