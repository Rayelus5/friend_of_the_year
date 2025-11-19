"use client";
import { useEffect, useState } from "react";

// Fíjate en el "?" después de onEnd
export default function Countdown({ targetDate, onEnd }: { targetDate: Date, onEnd?: () => void }) {
    const [timeLeft, setTimeLeft] = useState<string>("--:--:--");

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = new Date(targetDate).getTime() - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft("COMENZANDO");
                // Solo ejecutamos si la función existe
                if (onEnd) onEnd();
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h ${minutes}m`);
            } else {
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate, onEnd]);

    return (
        <div className="text-2xl md:text-4xl font-mono font-light tracking-widest tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
            {timeLeft}
        </div>
    );
}