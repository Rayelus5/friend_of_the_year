export const PLANS = {
    FREE: {
        name: "Free",
        slug: "free",
        quota: 1,
        price: 0,
    },
    PREMIUM: {
        name: "Premium",
        slug: "premium",
        quota: 5,
        price: 4.99,
        priceId: "price_1SVIs5AnnRNk3k0PGReKFytd", // Pon aquí el ID real de Stripe cuando lo crees
    },
    PLUS: {
        name: "Premium +",
        slug: "plus",
        quota: 9999, // Infinito a efectos prácticos
        price: 12.99,
        priceId: "price_1SVIsUAnnRNk3k0P85zldNod",
    },
};

export function getPlanFromUser(user: { subscriptionStatus: string | null; stripePriceId: string | null }) {
    // Si la suscripción no está activa, es FREE
    if (user.subscriptionStatus !== 'active') return PLANS.FREE;

    // Si es activa, miramos qué precio está pagando
    if (user.stripePriceId === PLANS.PLUS.priceId) return PLANS.PLUS;
    if (user.stripePriceId === PLANS.PREMIUM.priceId) return PLANS.PREMIUM;

    return PLANS.FREE;
}