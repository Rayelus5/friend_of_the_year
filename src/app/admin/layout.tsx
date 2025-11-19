import Link from "next/link";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-indigo-500/30 flex">

            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 bg-neutral-900/50 flex flex-col fixed h-full backdrop-blur-xl">
                <div className="p-6 border-b border-white/5">
                    <h1 className="font-bold tracking-wider text-white">FOTY ADMIN</h1>
                    <p className="text-xs text-gray-500 mt-1">Panel de Control</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/admin" className="block px-4 py-2 rounded-lg hover:bg-white/5 text-sm font-medium transition">
                        Dashboard
                    </Link>
                    <Link href="/admin/participants" className="block px-4 py-2 rounded-lg hover:bg-white/5 text-sm font-medium transition">
                        👥 Participantes
                    </Link>
                    <Link href="/admin/polls" className="block px-4 py-2 rounded-lg hover:bg-white/5 text-sm font-medium transition">
                        🗳️ Encuestas
                    </Link>
                </nav>

                <div className="p-4 border-t border-white/5">
                    <Link href="/" className="block text-xs text-center text-gray-500 hover:text-white transition">
                        ← Volver a la Web
                    </Link>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 ml-64 p-8 md:p-12 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}