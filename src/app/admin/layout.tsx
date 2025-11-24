import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
    LayoutDashboard, 
    Users, 
    Calendar, 
    CheckSquare, 
    ShieldAlert, 
    LogOut 
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  // @ts-ignore
  const role = session?.user?.role;

  // Doble check de seguridad en renderizado
  if (!session || (role !== 'ADMIN' && role !== 'MODERATOR')) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 flex font-sans selection:bg-red-900/30">
      
      {/* SIDEBAR FIJA */}
      <aside className="w-64 bg-neutral-900 border-r border-white/10 flex flex-col fixed h-full z-50">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
             <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
             <h1 className="font-bold tracking-widest text-white text-sm">ADMIN CONSOLE</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <NavLink href="/admin" icon={<LayoutDashboard size={18} />} label="Dashboard" />
            
            <div className="pt-6 pb-2 px-3 text-[10px] font-bold text-gray-600 uppercase tracking-wider">Moderación</div>
            <NavLink href="/admin/reviews" icon={<CheckSquare size={18} />} label="Solicitudes" highlight />
            <NavLink href="/admin/reports" icon={<ShieldAlert size={18} />} label="Reportes" />

            <div className="pt-6 pb-2 px-3 text-[10px] font-bold text-gray-600 uppercase tracking-wider">Datos</div>
            <NavLink href="/admin/users" icon={<Users size={18} />} label="Usuarios" />
            <NavLink href="/admin/events" icon={<Calendar size={18} />} label="Eventos" />
        </nav>

        <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-3 py-3 bg-black/30 rounded-lg mb-2">
                <div className="w-8 h-8 bg-red-600 rounded-md flex items-center justify-center font-bold text-xs text-white">
                    {session.user.name?.[0] || "A"}
                </div>
                <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{session.user.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase truncate">{role}</p>
                </div>
            </div>
            <Link href="/" className="flex items-center justify-center gap-2 w-full py-2 text-xs font-bold text-gray-500 hover:text-white transition-colors">
                <LogOut size={14} /> Salir al sitio
            </Link>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 ml-64 p-8 md:p-12 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, icon, label, highlight }: any) {
    return (
        <Link 
            href={href} 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                highlight 
                ? "text-amber-400 hover:bg-amber-400/10 hover:text-amber-300" 
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
        >
            {icon}
            <span className="text-sm font-medium">{label}</span>
        </Link>
    )
}