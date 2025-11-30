"use client";

import { useState, useRef } from "react";
import { updateProfile, changePassword } from "@/app/lib/user-actions";
import { User, Lock, Save, Camera, UploadCloud, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";


type UserData = {
    name: string | null;
    username: string | null;
    image: string | null;
    email: string | null;
    hasPassword: boolean;
};

type Toast = {
    id: number;
    text: string;
    type: "success" | "error";
};

export default function ProfileForm({ user }: { user: UserData }) {
    const [loading, setLoading] = useState(false);

    // Notificaciones flotantes
    const [toasts, setToasts] = useState<Toast[]>([]);

    // Form state controlado para validar en tiempo real
    const [name, setName] = useState(user.name || "");
    const [username, setUsername] = useState(user.username || "");

    // Estado para previsualizar la imagen antes de guardar
    const [previewImage, setPreviewImage] = useState(user.image || "");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Helpers de toasts
    const pushToast = (text: string, type: "success" | "error") => {
        const id = Date.now() + Math.random();
        setToasts((prev) => {
            const next = [...prev, { id, text, type }];
            // Máximo 3 a la vez
            return next.slice(-3);
        });

        // Autocierre a los 5s
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    };

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    // Handler para subir imagen local
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar tamaño (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                pushToast("La imagen es demasiado grande (máx 2MB).", "error");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setPreviewImage(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    // Validación y sanitización del username (@)
    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.toLowerCase();

        // Solo minúsculas y guion bajo
        value = value.replace(/[^a-z_]/g, "");

        // Máx 20 caracteres
        if (value.length > 20) {
            value = value.slice(0, 20);
        }

        setUsername(value);
    };

    // Validación del nombre público
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Permitir solo letras (cualquier idioma) y espacios
        const nameRegex = /^[\p{L}\s]*$/u;
        if (!nameRegex.test(value)) {
            return; // Ignorar si mete símbolos o números
        }

        if (value.length > 25) {
            return; // Máx 25 caracteres
        }

        setName(value);
    };

    // Handler genérico para formularios
    async function handleAction(action: any, formData: FormData) {
        setLoading(true);

        // Sobrescribimos valores del form por lo que tenemos en el estado controlado
        if (action === updateProfile) {
            formData.set("name", name.trim());
            formData.set("username", username.trim());
            formData.set("image", previewImage);
        }

        const res = await action(formData);

        if (res?.error) {
            pushToast(res.error, "error");
        }
        if (res?.success) {
            pushToast(res.success, "success");

            // Si la acción fue cambiar contraseña, cerramos sesión
            if (action === changePassword) {
                setTimeout(async () => {
                    await signOut({ callbackUrl: "/login" });
                }, 2000);
            }
        }

        setLoading(false);
    }

    return (
        <>
            {/* TOASTS FLOTANTES */}
            <div className="fixed top-20 inset-x-4 md:inset-x-auto md:right-6 z-50 flex flex-col items-center md:items-end gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            layout
                            initial={{ opacity: 0, y: -16, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.9 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className={`pointer-events-auto w-full max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-md
                    ${toast.type === "success"
                                    ? "bg-emerald-900/80 border-emerald-500/40 text-emerald-100"
                                    : "bg-red-900/80 border-red-500/40 text-red-100"
                                }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <p>{toast.text}</p>
                                <button
                                    type="button"
                                    onClick={() => removeToast(toast.id)}
                                    className="ml-2 text-xs text-gray-300 hover:text-white cursor-pointer"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>


            <div className="space-y-8">
                {/* TARJETA 1: PERFIL PÚBLICO */}
                <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-8">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <User className="text-blue-500" size={20} /> Perfil Público
                    </h2>

                    <form
                        action={(fd) => handleAction(updateProfile, fd)}
                        className="space-y-6"
                    >
                        {/* ZONA DE AVATAR INTERACTIVA */}
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="relative group">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-32 h-32 rounded-full bg-gray-800 overflow-hidden relative border-4 border-white/10 cursor-pointer group-hover:border-blue-500 transition-colors shadow-xl"
                                >
                                    {previewImage ? (
                                        <img
                                            src={previewImage}
                                            alt="Avatar"
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-600">
                                            {user.name?.[0] || "U"}
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <Camera className="text-white mb-1" size={24} />
                                        <span className="text-[10px] uppercase font-bold text-gray-300">
                                            Cambiar
                                        </span>
                                    </div>
                                </div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>

                            <div className="flex-1 w-full space-y-4">
                                <div>
                                    <label className="block text-xs uppercase text-gray-500 mb-2">
                                        URL de Avatar (o sube una imagen ←)
                                    </label>
                                    <div className="relative">
                                        <UploadCloud className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                        <input
                                            name="image"
                                            value={previewImage}
                                            onChange={(e) => setPreviewImage(e.target.value)}
                                            placeholder="https://..."
                                            className="w-full bg-black border border-white/20 rounded-lg py-2 pl-10 pr-4 text-white text-sm focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-600 mt-2">
                                        Puedes pegar una URL externa o pulsar en el círculo para subir desde tu equipo.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-2">
                                    Nombre en pantalla
                                </label>
                                <input
                                    required
                                    name="name"
                                    value={name}
                                    onChange={handleNameChange}
                                    maxLength={25}
                                    className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                    placeholder="Cómo te verán los demás"
                                />
                                <p className="text-[10px] text-gray-500 mt-1">
                                    Solo letras y espacios, máximo 25 caracteres.
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-2">
                                    Username (@)
                                </label>
                                <input
                                    required
                                    name="username"
                                    value={username}
                                    onChange={handleUsernameChange}
                                    maxLength={20}
                                    className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                    placeholder="tu_usuario"
                                />
                                <p className="text-[10px] text-gray-500 mt-1">
                                    Solo minúsculas y guion bajo (_), máximo 20 caracteres.
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-900/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                            >
                                <Save size={16} /> {loading ? "Guardando..." : "Guardar Perfil"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* TARJETA 2: SEGURIDAD */}
                {user.hasPassword && (
                    <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-8">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Lock className="text-amber-500" size={20} /> Seguridad
                        </h2>

                        <form
                            action={(fd) => handleAction(changePassword, fd)}
                            className="space-y-6"
                        >
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-2">
                                    Email (No modificable)
                                </label>
                                <input
                                    disabled
                                    value={user.email || ""}
                                    className="w-full bg-white/5 border border-white/5 rounded-lg p-3 text-gray-400 cursor-not-allowed"
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                                <div>
                                    <label className="block text-xs uppercase text-gray-500 mb-2">
                                        Contraseña Actual
                                    </label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        required
                                        className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-gray-500 mb-2">
                                        Nueva Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        required
                                        minLength={6}
                                        className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    disabled={loading}
                                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
                                >
                                    Actualizar Contraseña
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </>
    );
}