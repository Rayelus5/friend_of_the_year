"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { clsx } from "clsx";

// Definimos la animación vertical: entra por abajo (100%), sale por arriba (-100%)
const numberVariants: Variants = {
    initial: { y: "100%", opacity: 0, position: "absolute" },
    animate: { y: "0%", opacity: 1, position: "relative" },
    exit: { y: "-100%", opacity: 0, position: "absolute" }
};

// Sub-componente para cada bloque de tiempo (ej: 04)
const TimeUnit = ({ value, label }: { value: number; label: string }) => {
    // Formateamos siempre a dos dígitos (01, 02...)
    const formattedValue = value < 10 ? `0${value}` : value;

    return (
        <div className="flex flex-col items-center mx-1 md:mx-2">
            {/* Contenedor del Número: overflow-hidden corta lo que sale/entra */}
            <div className="relative h-8 md:h-24 w-8 md:w-24 overflow-hidden flex justify-center items-center bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                <AnimatePresence mode="popLayout">
                    <motion.span
                        key={value} // ¡Clave! Al cambiar el valor, fuerza la animación
                        variants={numberVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.4, ease: "backOut" }} // backOut le da un pequeño rebote al final
                        className="font-mono text-lg md:text-5xl font-bold text-white block"
                    >
                        {formattedValue}
                    </motion.span>
                </AnimatePresence>
            </div>

            {/* Etiqueta pequeña debajo (d, h, m, s) */}
            <span className="text-[10px] uppercase tracking-widest text-gray-500 mt-1 font-medium">
                {label}
            </span>
        </div>
    );
};

// Separador parpadeante (:)
const Separator = () => (
    <motion.span
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-gray-500 font-mono text-xl md:text-2xl -mt-4 mx-1"
    >
        :
    </motion.span>
);

export default function Countdown({ targetDate, onEnd }: { targetDate: Date, onEnd?: () => void }) {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);
    const [hasEnded, setHasEnded] = useState(false);

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date().getTime();
            const distance = new Date(targetDate).getTime() - now;

            if (distance < 0) {
                setHasEnded(true);
                if (onEnd) onEnd();
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000),
            });
        };

        // Ejecutar inmediatamente para evitar flash
        calculateTime();

        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [targetDate, onEnd]);

    // Estado de carga o finalizado
    if (hasEnded) {
        return (
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600 animate-pulse tracking-widest"
            >
                COMENZANDO
            </motion.div>
        );
    }

    if (!timeLeft) return null; // O un skeleton loader si prefieres

    return (
        <div className="flex items-center justify-center">

            {/* Lógica: Si quedan días, mostramos Días. Si no, ocultamos Días para centrar H:M:S */}
            {timeLeft.days > 0 && (
                <>
                    <TimeUnit value={timeLeft.days} label={timeLeft.days === 1 ? "DÍA" : "DÍAS"} />
                    <Separator />
                </>
            )}

            <TimeUnit value={timeLeft.hours} label="HRS" />
            <Separator />
            <TimeUnit value={timeLeft.minutes} label="MIN" />
            <Separator />
            <TimeUnit value={timeLeft.seconds} label="SEG" />

        </div>
    );
}