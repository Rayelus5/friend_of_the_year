export default function AdminDashboard() {
    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">Bienvenido, Admin</h1>
            <p className="text-gray-400 mb-8">IP Autorizada: Sesión Segura.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border border-white/10 bg-neutral-900 hover:border-indigo-500/50 transition-colors group">
                    <h3 className="text-xl font-bold text-white mb-2">Gestión de Amigos</h3>
                    <p className="text-gray-400 text-sm mb-4">Añade, edita o elimina a los participantes recurrentes.</p>
                    <span className="text-indigo-400 text-sm font-mono group-hover:underline"> <a href="/admin/participants"> Ir a Participantes →</a></span>
                </div>

                <div className="p-6 rounded-2xl border border-white/10 bg-neutral-900 hover:border-amber-500/50 transition-colors group">
                    <h3 className="text-xl font-bold text-white mb-2">Gestión de Encuestas</h3>
                    <p className="text-gray-400 text-sm mb-4">Crea nuevas categorías y lanza las votaciones.</p>
                    <span className="text-amber-500 text-sm font-mono group-hover:underline"><a href="/admin/polls"> Ir a Encuestas →</a></span>
                </div>
            </div>
        </div>
    );
}