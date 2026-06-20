"use client";

import { clsx } from "clsx";
import { LifeBuoy } from "lucide-react";
import ImageWithSkeleton from "@/components/ui/ImageWithSkeleton";

type AvatarSize = "sm" | "md" | "lg";

const SIZES: Record<AvatarSize, string> = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
};

const ICON_SIZE: Record<AvatarSize, number> = { sm: 15, md: 18, lg: 22 };

// Paleta de fondos para el fallback de iniciales (color estable por nombre).
const PALETTE = [
    "bg-blue-600/20 text-blue-300",
    "bg-purple-600/20 text-purple-300",
    "bg-emerald-600/20 text-emerald-300",
    "bg-amber-600/20 text-amber-300",
    "bg-pink-600/20 text-pink-300",
    "bg-cyan-600/20 text-cyan-300",
    "bg-indigo-600/20 text-indigo-300",
    "bg-rose-600/20 text-rose-300",
];

function colorFor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    return PALETTE[hash % PALETTE.length];
}

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Avatar redondo reutilizable. Muestra la foto real si existe (con skeleton de
 * carga), o iniciales con color estable por nombre. `variant="support"` pinta el
 * avatar del equipo de soporte (icono sobre degradado azul).
 */
export default function Avatar({
    name,
    image,
    size = "md",
    variant = "user",
    className,
}: {
    name: string | null;
    image?: string | null;
    size?: AvatarSize;
    variant?: "user" | "support";
    className?: string;
}) {
    const base = clsx(
        "relative rounded-full overflow-hidden flex items-center justify-center font-bold shrink-0",
        SIZES[size],
        className,
    );

    if (variant === "support") {
        return (
            <div className={clsx(base, "bg-gradient-to-br from-blue-500 to-indigo-600 text-white")}>
                <LifeBuoy size={ICON_SIZE[size]} />
            </div>
        );
    }

    const safeName = name?.trim() || "Usuario";

    if (image) {
        return (
            <div className={clsx(base, "bg-neutral-800 border-2 border-white/10")}>
                <ImageWithSkeleton src={image} alt={safeName} className="w-full h-full object-cover" />
            </div>
        );
    }

    return (
        <div className={clsx(base, "border-2 border-white/10", colorFor(safeName))}>
            {initials(safeName)}
        </div>
    );
}
