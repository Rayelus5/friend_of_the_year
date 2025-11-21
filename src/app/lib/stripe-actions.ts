'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { redirect } from "next/navigation";

// Inicialización de Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
});

/**
 * Función para determinar la URL base de forma dinámica
 */
function getBaseUrl() {
    // 1. PRIORIDAD MÁXIMA: Variable manual definida en Vercel (Tu dominio real)
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }
    // 2. Fallback: URL automática de Vercel (útil para ramas de preview)
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    // 3. Localhost
    return 'http://localhost:3000';
}

// --- 1. CREAR SESIÓN DE PAGO (CHECKOUT) ---
export async function createCheckoutSession(priceId: string) {
    const session = await auth();

    if (!session?.user?.id || !session.user.email) {
        return { error: "No user session found." };
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { stripeCustomerId: true, email: true },
    });

    if (!user) {
        return { error: "User not found." };
    }

    // Obtener o crear Customer ID
    let customerId = user.stripeCustomerId;
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            name: session.user.name || undefined,
            metadata: { userId: session.user.id }
        });
        customerId = customer.id;

        await prisma.user.update({
            where: { id: session.user.id },
            data: { stripeCustomerId: customerId }
        });
    }

    try {
        const BASE_URL = getBaseUrl();

        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${BASE_URL}/dashboard/profile?checkout_status=success`,
            cancel_url: `${BASE_URL}/premium?checkout_status=cancelled`,
            metadata: {
                userId: session.user.id // Importante para el webhook
            }
        });

        if (checkoutSession.url) {
            redirect(checkoutSession.url);
        }
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        // Si es un error de redirección (NEXT_REDIRECT), lo dejamos pasar
        if ((error as any).digest?.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        return { error: "Error interno al iniciar el pago." };
    }
}

// --- 2. CREAR SESIÓN DEL PORTAL DE CLIENTE (GESTIONAR) ---
export async function createCustomerPortalSession() {
    const session = await auth();
    if (!session?.user?.id) return;

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });

    if (!user?.stripeCustomerId) {
        throw new Error("No tienes una suscripción activa para gestionar.");
    }

    try {
        const BASE_URL = getBaseUrl();

        // Crear sesión del portal de facturación
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${BASE_URL}/dashboard/profile`,
        });

        if (portalSession.url) {
            redirect(portalSession.url);
        }
    } catch (error) {
        console.error("Stripe Portal Error:", error);
        if ((error as any).digest?.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        return { error: "Error al abrir el portal." };
    }
}