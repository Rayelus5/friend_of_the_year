"use client";

import { useState, useRef } from "react";
import { updateProfile, changePassword } from "@/app/lib/user-actions";
import { User, Lock, Save, Camera, UploadCloud } from "lucide-react";
import Image from "next/image";
import { signOut } from "next-auth/react";

type UserData = {
    name: string | null;
    username: string | null;
    image: string | null;
    email: string | null;
    hasPassword: boolean;
};

export default function ProfileForm({ user }: { user: UserData }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Estado para previsualizar la imagen antes de guardar
    const [previewImage, setPreviewImage] = useState(user.image || "");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handler para subir imagen local
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar tamaño (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert("La imagen es demasiado grande (Max 2MB)");
                return;
            }

            // Convertir a Base64 para guardar como string (Solución MVP sin S3)
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setPreviewImage(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handler genérico para formularios
    async function handleAction(action: any, formData: FormData) {
        setLoading(true);
        setMessage(null);
        
        const res = await action(formData);
        
        if (res?.error) {
            setMessage({ text: res.error, type: 'error' });
        }
        if (res?.success) {
            setMessage({ text: res.success, type: 'success' });
            
            // NUEVA LÓGICA: Si la acción fue cambiar contraseña, cerramos sesión
            if (action === changePassword) {
                setTimeout(async () => {
                    // Redirigimos al login forzando recarga
                    await signOut({ callbackUrl: "/login" });
                }, 2000); // Damos 2 segundos para que lea el mensaje de éxito
            }
        }
        
        setLoading(false);
    }

    return (
        <div className="max-w-4xl space-y-8">

            {/* Mensajes Globales */}
            {message && (
                <div className={`p-4 rounded-xl border ${message.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-green-500/10 border-green-500/50 text-green-400'}`}>
                    {message.text}
                </div>
            )}

            {/* TARJETA 1: PERFIL PÚBLICO */}
            <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <User className="text-blue-500" size={20} /> Perfil Público
                </h2>

                <form action={(fd) => handleAction(updateProfile, fd)} className="space-y-6">

                    {/* ZONA DE AVATAR INTERACTIVA */}
                    <div className="flex flex-col md:flex-row items-center gap-8">

                        <div className="relative group">
                            {/* Círculo de Imagen */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-32 h-32 rounded-full bg-gray-800 overflow-hidden relative border-4 border-white/10 cursor-pointer group-hover:border-blue-500 transition-colors shadow-xl"
                            >
                                {previewImage ? (
                                    <Image src={previewImage} alt="Avatar" fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-600">
                                        {user.name?.[0] || "U"}
                                    </div>
                                )}

                                {/* Overlay Hover */}
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <Camera className="text-white mb-1" size={24} />
                                    <span className="text-[10px] uppercase font-bold text-gray-300">Cambiar</span>
                                </div>
                            </div>

                            {/* Input de archivo oculto */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>

                        <div className="flex-1 w-full space-y-4">
                            {/* Input visible de URL (sincronizado con la imagen) */}
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
                            <label className="block text-xs uppercase text-gray-500 mb-2">Nombre Display</label>
                            <input required name="name" defaultValue={user.name || ""} className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-gray-500 mb-2">Username (@)</label>
                            <input required name="username" defaultValue={user.username || ""} className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-900/20 transition-all hover:scale-105 active:scale-95">
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

                    <form action={(fd) => handleAction(changePassword, fd)} className="space-y-6">
                        <div>
                            <label className="block text-xs uppercase text-gray-500 mb-2">Email (No modificable)</label>
                            <input disabled value={user.email || ""} className="w-full bg-white/5 border border-white/5 rounded-lg p-3 text-gray-400 cursor-not-allowed" />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-2">Contraseña Actual</label>
                                <input type="password" name="currentPassword" required className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-amber-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-2">Nueva Contraseña</label>
                                <input type="password" name="newPassword" required minLength={6} className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-amber-500 outline-none" />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button disabled={loading} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50 transition-colors">
                                Actualizar Contraseña
                            </button>
                        </div>
                    </form>
                </div>
            )}

        </div>
    );
}