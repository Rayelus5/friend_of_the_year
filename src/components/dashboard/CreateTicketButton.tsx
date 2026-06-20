"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupportChat } from "@/app/lib/support-actions";
import { MessageCirclePlus } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

export default function CreateTicketButton() {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const toast = useToast();

    const handleClick = () => {
        startTransition(async () => {
            const res = await createSupportChat();
            if (res?.chatId) {
                router.push(`/dashboard/support/${res.chatId}`);
            } else {
                console.error(res?.error || "Error al crear ticket");
                toast.error(res?.error || "No se pudo crear el ticket. Inténtalo de nuevo.");
            }
        });
    };

    return (
        <button
            onClick={handleClick}
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 cursor-pointer disabled:opacity-40"
        >
            <MessageCirclePlus size={20} />
            {isPending ? "Creando..." : "Contactar con Soporte"}
        </button>
    );
}
