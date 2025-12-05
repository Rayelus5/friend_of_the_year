"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import { PLANS } from "@/lib/plans";
import CheckoutButton from "@/components/premium/CheckoutButton";
import ManageButton from "@/components/premium/ManageButton";

// Datos visuales de los planes
const PRICING_DATA = [
    {
        key: 'free',
        title: "Free",
        price: "GRATIS",
        description: "Prueba la experiencia sin compromiso.",
        features: ["1 Evento Activo", "5 Categorías máximo por evento", "12 Participantes máximo por evento", "Votación Anónima", "Resultados Modo Gala", "Con publicidad"],
        priceId: null
    },
    {
        key: 'premium',
        title: "Premium",
        price: "4.99€",
        period: "/mes",
        description: "Para grupos de amigos activos.",
        features: ["5 Eventos Activos", "10 Categorías máximo por evento", "30 Participantes máximo por evento", "Generación de imágenes con IA", "Estadísticas básicas", "Todo lo de Free"],
        priceId: PLANS.PREMIUM.priceId,
        highlight: true
    },
    {
        key: 'plus',
        title: "Plus",
        price: "8.99€",
        period: "/mes",
        description: "Para disfrutar de eventos sin anuncios.",
        features: ["10 Eventos Activos", "15 Categorías máximo por evento", "50 Participantes máximo por evento", "Generación de imágenes con IA", "Soporte prioritario", "Estadísticas Avanzadas", "Sin publicidad"],
        priceId: PLANS.PLUS.priceId
    },
    {
        key: 'unlimited',
        title: "Unlimited",
        price: "12.99€",
        period: "/mes",
        description: "Para organizadores de eventos serios. Aumenta tus límites al máximo nivel, incluyendo desactivación de voto anónimo.",
        features: ["20 Eventos Activos", "30 Categorías máximo por evento", "100 Participantes máximo por evento", "Generación de imágenes con IA", "Soporte prioritario", "Estadísticas Avanzadas", "Sin publicidad", "Desactivación de voto anónimo"],
        priceId: PLANS.PLUS.priceId, // ajusta al id correcto si procede
        enterpriseLike: true // <- NUEVO: marca para render enterprise-style dentro del map
    },
];

// Variantes de animación
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
};

const cardVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 50, damping: 15 }
    }
};

export default function PricingSection({ currentPlanSlug }: { currentPlanSlug: string }) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <div className="max-w-7xl mx-auto text-center">

            {/* HERO TEXT ANIMADO */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mb-20"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/20 border border-indigo-600/40 mb-6 backdrop-blur-sm">
                    <Sparkles size={12} className="text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-300 tracking-widest uppercase">Upgrade your party</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white mb-6">
                    Elige tu nivel <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">Premium</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    Desbloquea todo el potencial de POLLNOW. Crea más eventos, invita a más amigos y gestiona múltiples galas simultáneamente.
                </p>
            </motion.div>

            {/* GRID DE TARJETAS */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-3 gap-6 relative"
                onMouseLeave={() => setHoveredIndex(null)}
            >
                {PRICING_DATA.map((plan, index) => {
                    const isCurrent = currentPlanSlug === plan.key;
                    const isHovered = hoveredIndex === index;
                    const isBlur = hoveredIndex !== null && hoveredIndex !== index;
                    const isLastItem = index === PRICING_DATA.length - 1;
                    const isEnterpriseLike = !!plan.enterpriseLike;

                    // Si es enterprise-like, dale md:col-span-3 para que ocupe el ancho full del grid
                    const colSpanClass = isEnterpriseLike ? "md:col-span-3" : "md:col-span-1";

                    // RENDER "enterprise-style" INLINE dentro del map
                    if (isEnterpriseLike) {
                        return (
                            <motion.div
                                key={plan.key}
                                variants={cardVariants}
                                onMouseEnter={() => setHoveredIndex(index)}
                                className={clsx(
                                    "relative p-1 rounded-[2rem] transition-transform duration-500 ease-out",
                                    colSpanClass
                                )}
                            >
                                <div className="relative overflow-hidden rounded-[2rem] border border-blue-600/40 bg-gradient-to-r from-blue-900/60 via-black to-indigo-400/70 p-[1px] cursor-pointer hover:scale-102 transition-all duration-300">
                                    <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 px-8 py-12 md:py-20 bg-black/80 rounded-[2rem]">
                                        {/* Glow decorativo */}
                                        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-blue-600/20 blur-3xl" />
                                        <div className="pointer-events-none absolute right-0 bottom-0 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />

                                        {/* Texto principal */}
                                        <div className="relative text-left max-w-2xl">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-600/40 mb-4">
                                                <Sparkles size={12} className="text-blue-300" />
                                                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-blue-200">
                                                    Perfecto para profesionales
                                                </span>
                                            </div>

                                            <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
                                                Plan {plan.title}
                                            </h3>

                                            <p className="text-sm md:text-base text-gray-300 mb-4">
                                                {plan.description}
                                            </p>

                                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-8 text-gray-300">
                                                {plan.features.map((f, i) => (
                                                    <li key={i} className="flex items-center gap-2">
                                                        <div className="mt-0.5 p-1 rounded-full bg-blue-600/20 text-blue-400">
                                                            <Check size={10} strokeWidth={3} />
                                                        </div>
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Precio + CTA */}
                                        <div className="relative flex flex-col items-center md:items-end gap-4 ">
                                            {/* Price block (recommended: numeric fields) */}
                                            <div className="text-center md:text-right">
                                                <span className="block text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-1">
                                                    Precio (Oferta de salida)
                                                </span>

                                                <div className="flex items-baseline items-center gap-3 justify-start md:justify-end mt-5 md:mt-0">
                                                    {/* Original price (tached) */}
                                                    <div className="flex flex-col justify-end p-2 rounded-xl bg-blue-950/40 border border-blue-400/30">
                                                        <span
                                                            className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs md:text-sm justify-center font-semibold bg-blue-600 text-white"
                                                            aria-hidden="true"
                                                        >
                                                            -{Math.round((1 - 12.99 / 24.99) * 100)}%
                                                        </span>

                                                        <span
                                                            className="text-md md:text-xl text-gray-400 line-through opacity-80"
                                                            aria-hidden="true"
                                                        >
                                                            €{24.99.toFixed(2)}
                                                        </span>

                                                    </div>

                                                    {/* Discounted price (prominent) */}
                                                    <div className="text-5xl md:text-6xl font-extrabold text-blue-300">
                                                        {plan.price}
                                                        {plan.period && <span className="text-sm text-gray-400 font-medium ml-2">{plan.period}</span>}
                                                    </div>
                                                </div>

                                                {/* Hidden accessibility text describing the offer for screen readers */}
                                                <span className="sr-only">
                                                    Original price 24.99€. Now {plan.price}€.
                                                </span>
                                            </div>


                                            {/* CTA: si es current muestra Manage, si tiene priceId muestra Checkout, si no es priceId (ej enterprise) link a contacto */}
                                            {isCurrent ? (
                                                plan.priceId ? (
                                                    <ManageButton />
                                                ) : (
                                                    <div className="w-full py-3 rounded-xl font-bold border border-green-500/30 text-green-400 bg-green-500/5 cursor-default flex items-center justify-center gap-2">
                                                        <Check size={16} /> Plan Actual
                                                    </div>
                                                )
                                            ) : plan.priceId ? (
                                                <CheckoutButton priceId={plan.priceId} highlight={plan.highlight || false} />
                                            ) : (
                                                <Link
                                                    href="/about#contact"
                                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm md:text-base bg-white text-black hover:bg-gray-100 transition-colors border border-white/10"
                                                >
                                                    Contactar
                                                    <ArrowRight size={16} />
                                                </Link>
                                            )}

                                            <span className="text-[11px] text-gray-500 max-w-xs text-center md:text-right">
                                                {isCurrent ? "Gracias por confiar en nosotros." : "Elije el máximo nivel de creación de eventos en Pollnow."}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    }

                    // RENDER NORMAL (los demás planes)
                    return (
                        <motion.div
                            key={plan.key}
                            variants={cardVariants}
                            onMouseEnter={() => setHoveredIndex(index)}
                            className={clsx(
                                "cursor-pointer relative p-5 md:p-8 rounded-[2rem] flex flex-col transition-transform duration-500 ease-out border-2 max-h-[700px]",
                                colSpanClass,
                                plan.highlight
                                    ? "bg-neutral-900 border-indigo-600/50 shadow-[0_0_40px_-10px_rgba(59,130,246,0.15)]"
                                    : "bg-black border-white/20",
                                isBlur ? "scale-95 opacity-40 blur-[2px] grayscale-[0.5]" : "scale-100 opacity-100",
                                isHovered && "scale-[1.03] border-indigo-400 z-10 bg-neutral-900"
                            )}
                        >
                            {/* Badge de "Popular" */}
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-indigo-400 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                                    Más Popular
                                </div>
                            )}

                            {/* Header de la Tarjeta */}
                            <div className="mb-8">
                                <h3 className={clsx("text-xl font-bold mb-2", plan.highlight ? "text-white" : "text-gray-300")}>
                                    {plan.title}
                                </h3>
                                <div className="flex items-baseline justify-center gap-1 flex-wrap">
                                    <span className={clsx("text-4xl md:text-5xl font-black tracking-tight", plan.highlight ? "text-indigo-300" : "text-gray-200")}>
                                        {plan.price}
                                    </span>
                                    {plan.period && <span className="text-sm text-gray-500 font-medium">{plan.period}</span>}
                                </div>
                                <p className="text-sm mt-4 text-gray-400 leading-relaxed">{plan.description}</p>
                            </div>

                            {/* Lista de Features */}
                            <ul className={clsx(
                                "space-y-4 mb-8 flex-1",
                                isLastItem ? "grid grid-cols-1 lg:text-center text-left md:m-auto pb-10 max-w-[700px]" : "text-left"
                            )}>
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                        <div className={clsx(
                                            "mt-0.5 p-1 rounded-full flex-shrink-0",
                                            plan.highlight ? "bg-indigo-600/20 text-indigo-400" : "bg-white/10 text-gray-500"
                                        )}>
                                            <Check size={10} strokeWidth={3} />
                                        </div>
                                        <span className="text-left">{f}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Botón de Acción */}
                            <div className="mt-auto">
                                {isCurrent ? (
                                    plan.priceId ? (
                                        <div className="animate-in zoom-in duration-300">
                                            <ManageButton />
                                        </div>
                                    ) : (
                                        <div className="w-full py-3 rounded-xl font-bold border border-green-500/30 text-green-400 bg-green-500/5 cursor-default flex items-center justify-center gap-2">
                                            <Check size={16} /> Plan Actual
                                        </div>
                                    )
                                ) : plan.priceId ? (
                                    <CheckoutButton priceId={plan.priceId} highlight={plan.highlight || false} />
                                ) : (
                                    <button className="w-full py-3 rounded-xl font-bold border border-white/10 text-gray-400 cursor-not-allowed bg-white/5">
                                        Incluido
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* TARJETA ENTERPRISE FULL-WIDTH (OPCIONAL - puedes mantenerla si quieres) */}
            <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="mt-10 w-full"
            >
                <div className="relative overflow-hidden rounded-[2rem] border border-indigo-600/40 bg-gradient-to-r from-indigo-900/60 via-black to-indigo-400/70 p-[1px] cursor-pointer hover:scale-102 transition-all duration-300 ">
                    <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 px-8 py-12 md:py-20 bg-black/80 rounded-[2rem]">
                        {/* Glow decorativo */}
                        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-indigo-600/20 blur-3xl" />
                        <div className="pointer-events-none absolute right-0 bottom-0 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />

                        {/* Texto principal */}
                        <div className="relative text-left max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/40 border border-indigo-600/40 mb-4">
                                <Sparkles size={12} className="text-indigo-300" />
                                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-indigo-200">
                                    Para empresas y grandes creadores
                                </span>
                            </div>

                            <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
                                Plan Enterprise
                            </h3>

                            <p className="text-sm md:text-base text-gray-300 mb-4">
                                Eventos ilimitados, máxima personalización y soporte prioritario. Diseñamos contigo la solución perfecta para tus galas y comunidades.
                            </p>

                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-8 text-gray-300">
                                <li className="flex items-center gap-2">
                                    <div className="mt-0.5 p-1 rounded-full bg-indigo-600/20 text-indigo-400">
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                    Eventos y categorías ilimitadas
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="mt-0.5 p-1 rounded-full bg-indigo-600/20 text-indigo-400">
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                    Límites de participantes a medida
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="mt-0.5 p-1 rounded-full bg-indigo-600/20 text-indigo-400">
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                    Integraciones y features custom
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="mt-0.5 p-1 rounded-full bg-indigo-600/20 text-indigo-400">
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                    Soporte prioritario 1:1
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="mt-0.5 p-1 rounded-full bg-indigo-600/20 text-indigo-400">
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                    Sin publicidad
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="mt-0.5 p-1 rounded-full bg-indigo-600/20 text-indigo-400">
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                    Adaptamos el servicio a tu presupuesto
                                </li>
                            </ul>
                        </div>

                        {/* Precio + CTA */}
                        <div className="relative flex flex-col items-center md:items-end gap-4">
                            <div className="text-center md:text-right">
                                <span className="block text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-1">
                                    Precio
                                </span>
                                <div className="flex items-baseline gap-2 justify-start md:justify-end">
                                    <span className="text-4xl md:text-6xl font-black text-indigo-200">
                                        HABLEMOS
                                    </span>
                                </div>
                            </div>

                            <Link
                                href="/about#contact"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm md:text-base bg-white text-black hover:bg-gray-100 transition-colors border border-white/10"
                            >
                                Hablar sobre Enterprise
                                <ArrowRight size={16} />
                            </Link>

                            <span className="text-[11px] text-gray-500 max-w-xs text-center md:text-right">
                                Cuéntanos tu caso y adaptamos POLLNOW a las necesidades de tu empresa o comunidad.
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="mt-16 text-sm text-gray-600"
            >
                Pagos seguros procesados por Stripe. Puedes cancelar en cualquier momento.
            </motion.p>
        </div>
    );
}
