"use client";

import { useState } from "react";
import {
    toggleUserBan,
    changeUserRole,
    deleteUser,
    adminUpdateUser,
    adminSetUserPassword,
} from "@/app/lib/admin-actions";
import {
    ShieldAlert,
    Shield,
    Trash2,
    Lock,
    UserCog,
    Calendar,
} from "lucide-react";
import { Bouncy } from "ldrs/react";
import "ldrs/react/Bouncy.css";
import { useRouter } from "next/navigation";

const PREMIUM_PRICE_ID = "price_1SVz0lAnnRNk3k0PSEZ15Dr0";
const UNLIMITED_PRICE_ID = "price_1SVz24AnnRNk3k0PvSjAEVQA";

type User = {
    id: string;
    role: "USER" | "ADMIN" | "MODERATOR";
    ipBan: boolean;
    name: string | null;
    username: string;
    email: string;
    stripePriceId: string | null;
    subscriptionStatus: string;
    subscriptionEndDate: string | null;
    cancelAtPeriodEnd: boolean;
};

type ProfileState = {
    name: string;
    username: string;
    email: string;
    stripePriceId: string | null;
    subscriptionStatus: string; // "free" | "active"
    subscriptionEndDate: string; // "YYYY-MM-DD" o ""
    cancelAtPeriodEnd: boolean;
};

function getPlanKeyFromProfile(profile: {
    stripePriceId: string | null;
}): "free" | "premium" | "unlimited" {
    if (profile.stripePriceId === PREMIUM_PRICE_ID) return "premium";
    if (profile.stripePriceId === UNLIMITED_PRICE_ID) return "unlimited";
    return "free";
}

export default function UserActions({ user }: { user: User }) {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState(user.role);

    const [profile, setProfile] = useState<ProfileState>(() => ({
        name: user.name ?? "",
        username: user.username ?? "",
        email: user.email ?? "",
        stripePriceId: user.stripePriceId ?? null,
        subscriptionStatus: user.subscriptionStatus || "free",
        subscriptionEndDate: user.subscriptionEndDate
            ? new Date(user.subscriptionEndDate).toISOString().slice(0, 10)
            : "",
        cancelAtPeriodEnd: user.cancelAtPeriodEnd ?? false,
    }));

    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

    // ───────────── BAN / ROLE / DELETE ─────────────

    const handleBanToggle = async () => {
        const msg = user.ipBan
            ? "¿Desbloquear usuario?"
            : "¿Banear usuario permanentemente?";
        if (!confirm(msg)) return;

        setLoading(true);
        await toggleUserBan(user.id);
        setLoading(false);
        router.refresh();
    };

    const handleRoleChange = async (
        newRole: "USER" | "ADMIN" | "MODERATOR"
    ) => {
        if (!confirm(`¿Cambiar rol de ${user.name || "usuario"} a ${newRole}?`))
            return;

        setLoading(true);
        await changeUserRole(user.id, newRole);
        setRole(newRole);
        setLoading(false);
        router.refresh();
    };

    const handleDelete = async () => {
        const confirmText = prompt(
            `Escribe "BORRAR" para eliminar permanentemente a ${user.name} y todos sus datos.`
        );
        if (confirmText !== "BORRAR") return;

        setLoading(true);
        await deleteUser(user.id);
        router.push("/admin/users");
    };

    // ───────────── PERFIL + PLAN ─────────────

    const handleProfileSave = async () => {
        setProfileError(null);
        setProfileSuccess(null);
        setProfileSaving(true);

        const res = await adminUpdateUser(user.id, {
            name: profile.name.trim(),
            username: profile.username.trim(),
            email: profile.email.trim(),
            stripePriceId: profile.stripePriceId || null,
            subscriptionStatus: profile.subscriptionStatus,
            subscriptionEndDate: profile.subscriptionEndDate || null,
            cancelAtPeriodEnd: profile.cancelAtPeriodEnd,
        });

        if (res?.error) {
            setProfileError(res.error);
        } else {
            setProfileSuccess("Datos actualizados correctamente.");
        }

        setProfileSaving(false);
        router.refresh();
    };

    // ───────────── PASSWORD RESET ─────────────

    const handlePasswordSave = async () => {
        setPasswordError(null);
        setPasswordSuccess(null);

        if (!newPassword || newPassword.length < 6) {
            setPasswordError(
                "La nueva contraseña debe tener al menos 6 caracteres."
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("Las contraseñas no coinciden.");
            return;
        }

        setPasswordSaving(true);

        const res = await adminSetUserPassword(user.id, newPassword);

        if (res?.error) {
            setPasswordError(res.error);
        } else {
            setPasswordSuccess("Contraseña actualizada correctamente.");
            setNewPassword("");
            setConfirmPassword("");
        }

        setPasswordSaving(false);
    };

    const currentPlan = getPlanKeyFromProfile(profile);

    return (
        <div className="space-y-6">
            {/* DATOS BÁSICOS + PLAN */}
            <div className="bg-neutral-900 border border-white/10 rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <UserCog size={16} /> Datos de Usuario & Plan
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400 uppercase block mb-1">
                            Nombre
                        </label>
                        <input
                            type="text"
                            value={profile.name}
                            onChange={(e) =>
                                setProfile((p) => ({
                                    ...p,
                                    name: e.target.value,
                                }))
                            }
                            className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 uppercase block mb-1">
                            Username (@)
                        </label>
                        <input
                            type="text"
                            value={profile.username}
                            onChange={(e) =>
                                setProfile((p) => ({
                                    ...p,
                                    username: e.target.value,
                                }))
                            }
                            className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 uppercase block mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={profile.email}
                            onChange={(e) =>
                                setProfile((p) => ({
                                    ...p,
                                    email: e.target.value,
                                }))
                            }
                            className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 uppercase block mb-1">
                            Plan
                        </label>

                        <select
                            value={currentPlan}
                            onChange={(e) => {
                                const value = e.target.value as
                                    | "free"
                                    | "premium"
                                    | "unlimited";

                                setProfile((p) => {
                                    let stripePriceId: string | null = null;
                                    if (value === "premium")
                                        stripePriceId = PREMIUM_PRICE_ID;
                                    if (value === "unlimited")
                                        stripePriceId = UNLIMITED_PRICE_ID;

                                    return {
                                        ...p,
                                        subscriptionStatus:
                                            value === "free"
                                                ? "free"
                                                : "active",
                                        stripePriceId,
                                    };
                                });
                            }}
                            className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 cursor-pointer"
                        >
                            <option value="free">Free</option>
                            <option value="premium">Premium</option>
                            <option value="unlimited">Unlimited</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 uppercase block mb-1 flex items-center gap-1">
                            <Calendar size={12} /> Fin de suscripción
                        </label>
                        <input
                            type="date"
                            value={profile.subscriptionEndDate}
                            onChange={(e) =>
                                setProfile((p) => ({
                                    ...p,
                                    subscriptionEndDate: e.target.value,
                                }))
                            }
                            className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">
                            Déjalo vacío para borrar la fecha de fin.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 mt-4 md:mt-6">
                        <input
                            id="cancelAtPeriodEnd"
                            type="checkbox"
                            checked={profile.cancelAtPeriodEnd}
                            onChange={(e) =>
                                setProfile((p) => ({
                                    ...p,
                                    cancelAtPeriodEnd: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 accent-blue-500"
                        />
                        <label
                            htmlFor="cancelAtPeriodEnd"
                            className="text-xs text-gray-400"
                        >
                            Cancelar al final del periodo actual
                        </label>
                    </div>
                </div>

                {profileError && (
                    <div className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                        {profileError}
                    </div>
                )}
                {profileSuccess && (
                    <div className="mt-3 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                        {profileSuccess}
                    </div>
                )}

                <div className="pt-2 flex justify-end">
                    <button
                        onClick={handleProfileSave}
                        disabled={profileSaving}
                        className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                        {profileSaving ? (
                            <Bouncy size="28" speed="1.75" color="white" />
                        ) : (
                            "Guardar cambios"
                        )}
                    </button>
                </div>
            </div>

            {/* PERMISOS Y ROLES */}
            <div className="bg-neutral-900 border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Shield size={16} /> Permisos y Roles
                </h3>
                <div className="flex gap-2">
                    {(["USER", "MODERATOR", "ADMIN"] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => handleRoleChange(r)}
                            disabled={loading || role === r}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                                role === r
                                    ? "bg-blue-600 border-blue-500 text-white cursor-default"
                                    : "bg-black border-white/10 text-gray-500 hover:text-white hover:border-white/30"
                            }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTRASEÑA (admin reset) */}
            <div className="bg-neutral-900 border border-amber-500/20 rounded-xl p-6 space-y-3">
                <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Lock size={16} /> Seguridad
                </h3>
                <p className="text-xs text-gray-400">
                    Como administrador, puedes establecer una nueva contraseña
                    para este usuario. No se requiere la contraseña actual.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div>
                        <label className="text-xs text-gray-400 uppercase block mb-1">
                            Nueva contraseña
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 uppercase block mb-1">
                            Confirmar contraseña
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
                            className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {passwordError && (
                    <div className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                        {passwordError}
                    </div>
                )}
                {passwordSuccess && (
                    <div className="mt-3 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                        {passwordSuccess}
                    </div>
                )}

                <div className="pt-2 flex justify-end">
                    <button
                        onClick={handlePasswordSave}
                        disabled={passwordSaving}
                        className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                        {passwordSaving ? (
                            <Bouncy size="28" speed="1.75" color="white" />
                        ) : (
                            "Actualizar contraseña"
                        )}
                    </button>
                </div>
            </div>

            {/* ZONA DE PELIGRO */}
            <div className="bg-red-950/10 border border-red-500/20 rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert size={16} /> Zona de Riesgo
                </h3>

                <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/5">
                    <div>
                        <p className="text-white text-sm font-bold">
                            Banear Usuario
                        </p>
                        <p className="text-xs text-gray-500">
                            Impide el acceso a la plataforma.
                        </p>
                    </div>
                    <button
                        onClick={handleBanToggle}
                        disabled={loading}
                        className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${
                            user.ipBan
                                ? "bg-green-600 text-white hover:bg-green-500"
                                : "bg-red-600 text-white hover:bg-red-500"
                        }`}
                    >
                        {user.ipBan ? "Desbloquear" : "Banear"}
                    </button>
                </div>

                <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="w-full py-3 text-xs font-bold text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <Bouncy size="45" speed="1.75" color="red" />
                    ) : (
                        <>
                            <Trash2 size={14} /> Eliminar Cuenta Completamente
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}