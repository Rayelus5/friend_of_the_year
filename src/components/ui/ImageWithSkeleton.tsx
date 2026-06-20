"use client";

import { useState } from "react";
import { clsx } from "clsx";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
    /** Clases extra para el skeleton (por defecto un fondo gris pulsante). */
    skeletonClassName?: string;
};

/**
 * <img> con animación de carga: mientras la imagen no ha cargado muestra un
 * fondo gris pulsante (en vez del texto alternativo) y luego hace fade-in.
 *
 * IMPORTANTE: debe usarse dentro de un contenedor posicionado
 * (`relative`/`absolute`), ya que el skeleton se renderiza con `absolute inset-0`.
 */
export default function ImageWithSkeleton({
    className,
    skeletonClassName,
    onLoad,
    onError,
    alt = "",
    ...rest
}: Props) {
    const [loaded, setLoaded] = useState(false);

    return (
        <>
            {!loaded && (
                <div
                    aria-hidden
                    className={clsx(
                        "absolute inset-0 bg-neutral-800 animate-pulse",
                        skeletonClassName,
                    )}
                />
            )}
            <img
                {...rest}
                alt={alt}
                className={clsx(className, "transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0")}
                onLoad={(e) => { setLoaded(true); onLoad?.(e); }}
                onError={(e) => { setLoaded(true); onError?.(e); }}
            />
        </>
    );
}
