"use client";

import { useState } from "react";
import Link from "next/link";
// import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X, User, LayoutDashboard, Home, Vote, Sparkles, Info } from "lucide-react";
import { logoutUser } from "@/app/lib/auth-actions";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

type NavbarProps = {
    user: {
        name: string | null;
        image: string | null;
    } | null;
};

export default function NavbarClient({ user }: NavbarProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

                {/* --- LOGO --- */}
                <Link href="/" className="flex items-center gap-2 group z-50" onClick={closeMenu}>
                    <div className="w-8 h-8 border border-white/20 bg-gradient-to-br from-gray-700 to-black rounded-lg flex items-center justify-center font-bold text-black group-hover:scale-110 transition-transform">
                        <img src="./logo.webp" alt="" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white">POLLNOW</span>
                </Link>

                {/* --- MENÚ DESKTOP (Hidden on Mobile) --- */}
                <div className="hidden md:flex items-center gap-8">
                    <NavLink href="/" active={pathname === "/"}>Home</NavLink>
                    <NavLink href="/polls" active={pathname.startsWith("/polls")}>Events</NavLink>
                    <NavLink href="/dashboard" active={pathname.startsWith("/dashboard")}>Dashboard</NavLink>
                    <NavLink href="/premium" active={pathname.startsWith("/premium")}>
                        <span className="text-indigo-400 drop-shadow-[0_0_8px_rgba(150,100,200,0.8)]">Premium</span>
                    </NavLink>
                    <NavLink href="/about" active={pathname === "/about"}>About</NavLink>
                </div>

                {/* --- ZONA USUARIO DESKTOP --- */}
                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard/profile" className="flex items-center gap-3 p-1 pr-4 rounded-full hover:bg-white/10 transition-colors group border border-white/10">
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 relative">
                                    {user.image ? (
                                        <img src={user.image} alt="Avatar" className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                                            {user.name?.[0] || "U"}
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm font-medium text-gray-200 group-hover:text-white max-w-[100px] truncate">
                                    {user.name || "Usuario"}
                                </span>
                            </Link>

                            <button
                                onClick={() => logoutUser()}
                                className="text-xs text-red-400 hover:text-red-300 font-medium p-3 border border-red-500/20 rounded-full hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Cerrar Sesión"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                                Entrar
                            </Link>
                            <Link
                                href="/register"
                                className="text-sm font-bold bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
                            >
                                Registrarse
                            </Link>
                        </div>
                    )}
                </div>

                {/* --- BOTÓN MENÚ MÓVIL --- */}
                <div className="md:hidden flex items-center z-50">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 text-gray-300 hover:text-white transition-colors"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

            </div>

            {/* --- MENÚ DESPLEGABLE MÓVIL --- */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-16 left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/10 p-6 md:hidden shadow-2xl flex flex-col gap-4 h-[calc(100vh-64px)] overflow-y-auto"
                    >
                        {/* Enlaces de Navegación */}
                        <div className="flex flex-col space-y-2">
                            <MobileNavLink href="/" icon={<Home size={18} />} onClick={closeMenu}>Home</MobileNavLink>
                            <MobileNavLink href="/polls" icon={<Vote size={18} />} onClick={closeMenu}>Events</MobileNavLink>
                            <MobileNavLink href="/dashboard" icon={<LayoutDashboard size={18} />} onClick={closeMenu}>Dashboard</MobileNavLink>
                            <MobileNavLink href="/premium" icon={<Sparkles size={18} className="text-indigo-400" />} onClick={closeMenu}>
                                <span className="text-indigo-400">Premium</span>
                            </MobileNavLink>
                            <MobileNavLink href="/about" icon={<Info size={18} />} onClick={closeMenu}>About</MobileNavLink>
                        </div>

                        <div className="h-px bg-white/10 my-2" />

                        {/* Zona Usuario Móvil */}
                        {user ? (
                            <div className="flex flex-col gap-4">
                                <Link
                                    href="/dashboard/profile"
                                    onClick={closeMenu}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 relative shrink-0">
                                        {user.image ? (
                                            <img src={user.image} alt="Avatar" className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white">
                                                {user.name?.[0] || "U"}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{user.name}</p>
                                        <p className="text-xs text-gray-400">Ver perfil</p>
                                    </div>
                                </Link>

                                <button
                                    onClick={() => logoutUser()}
                                    className="flex items-center justify-center gap-2 w-full p-4 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-bold"
                                >
                                    <LogOut size={18} /> Cerrar Sesión
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <Link
                                    href="/login"
                                    onClick={closeMenu}
                                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-center font-bold hover:bg-white/10"
                                >
                                    Iniciar Sesión
                                </Link>
                                <Link
                                    href="/register"
                                    onClick={closeMenu}
                                    className="w-full py-3 rounded-xl bg-white text-black text-center font-bold hover:bg-gray-200"
                                >
                                    Registrarse
                                </Link>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}

// Componentes Auxiliares

function NavLink({ href, children, active }: { href: string, children: React.ReactNode, active?: boolean }) {
    return (
        <Link
            href={href}
            className={clsx(
                "text-sm font-medium transition-colors relative group",
                active ? "text-white" : "text-gray-400 hover:text-white"
            )}
        >
            {children}
            <span className={clsx(
                "absolute -bottom-1 left-0 h-0.5 bg-blue-500 transition-all duration-300",
                active ? "w-full" : "w-0 group-hover:w-full"
            )}></span>
        </Link>
    )
}

function MobileNavLink({ href, children, icon, onClick }: any) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors font-medium"
        >
            {icon}
            {children}
        </Link>
    )
}