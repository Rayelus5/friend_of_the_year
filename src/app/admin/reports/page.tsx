import { ShieldAlert } from "lucide-react";

export default function AdminReportsPage() {
    return (
        <div className="max-w-4xl mx-auto text-center py-20">
            <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                <ShieldAlert className="text-gray-600" size={40} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Centro de Reportes</h1>
            <p className="text-gray-500 max-w-md mx-auto">
                El sistema de reportes de usuario está en desarrollo. <br />
                Aquí aparecerán las denuncias de contenido inapropiado enviadas por la comunidad.
            </p>

            <div className="mt-10 p-6 bg-blue-900/10 border border-blue-500/20 rounded-xl inline-block text-left">
                <h4 className="text-sm font-bold text-blue-400 mb-2 uppercase tracking-wider">Próximos Pasos</h4>
                <ul className="text-sm text-gray-400 space-y-2 list-disc list-inside">
                    <li>Añadir botón "Reportar" en la página pública de eventos.</li>
                    <li>Crear modelo <code>Report</code> en la base de datos.</li>
                    <li>Conectar esta vista con la tabla de reportes.</li>
                </ul>
            </div>
        </div>
    );
}