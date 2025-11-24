import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    Users,
    Calendar,
    CheckSquare,
    ShieldAlert,
    LogOut,
    LayoutDashboard,
    MessageSquare
} from "lucide-react";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // Verificación de servidor por seguridad (adicional al middleware)
    // @ts-ignore - El tipo user se extiende en auth.d.ts
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex font-sans">

            {/* SIDEBAR */}
            <aside className="w-64 bg-black border-r border-white/10 flex flex-col fixed h-full z-50">
                <div className="p-6 border-b border-white/10 flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-bold text-white">A</div>
                    <h1 className="font-bold tracking-wider">ADMIN <span className="text-xs text-gray-500 font-normal block">Panel</span></h1>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">

                    <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors mb-4">
                        <LayoutDashboard size={18} /> Dashboard
                    </Link>

                    <p className="px-3 text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 mt-4">Moderación</p>

                    <NavLink href="/admin/review" icon={<CheckSquare size={18} />} label="Solicitudes" activeColor="text-amber-400" />
                    {/* Futuro: <NavLink href="/admin/reports" icon={<ShieldAlert size={18} />} label="Reportes" /> */}

                    <p className="px-3 text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 mt-6">Gestión</p>

                    <NavLink href="/admin/users" icon={<Users size={18} />} label="Usuarios" />
                    <NavLink href="/admin/events" icon={<Calendar size={18} />} label="Eventos" />

                    <div className="text-xs font-bold text-gray-500 uppercase px-3 mb-2 mt-6">Soporte</div>

                    {/* Futuro: <NavLink href="/admin/chats" icon={<MessageSquare size={18} />} label="Chats" /> */}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center font-bold text-xs text-gray-400 overflow-hidden">
                            {/* @ts-ignore */}
                            {session.user.image ? (
                                <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                session.user.name?.substring(0, 2).toUpperCase()
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{session.user.name}</p>
                            {/* @ts-ignore */}
                            <p className="text-[10px] text-gray-500 uppercase">{session.user.role}</p>
                        </div>
                    </div>
                    <Link href="/" className="mt-2 flex items-center justify-center gap-2 w-full py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors">
                        <LogOut size={14} /> Salir al sitio
                    </Link>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}

function NavLink({ href, icon, label, activeColor = "text-blue-400" }: any) {
    return (
        <Link href={href} className={`flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all group`}>
            <span className={`group-hover:${activeColor} transition-colors`}>{icon}</span>
            <span className="text-sm font-medium">{label}</span>
        </Link>
    )
}