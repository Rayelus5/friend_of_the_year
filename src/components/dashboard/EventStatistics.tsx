"use client";

import { BarChart3, TrendingUp, Users, Lock } from "lucide-react";
import Link from "next/link";

type StatsData = {
  totalVotes: number;
  totalPolls: number;
  votesByPoll: { name: string; votes: number }[];
  activityTimeline: { date: string; count: number }[];
};

type Props = {
  stats: StatsData | null;
  planSlug: string;
};

export default function EventStatistics({ stats, planSlug }: Props) {
  const isFree = planSlug === 'free';
  
  // Usamos datos reales o los mock si es Free
  const displayStats = isFree ? MOCK_STATS : (stats || { 
      totalVotes: 0, 
      totalPolls: 0, 
      votesByPoll: [], 
      activityTimeline: [] 
  });

  // Calcular el valor máximo para normalizar la altura de las gráficas (evitar división por cero)
  const maxTimelineVotes = Math.max(...displayStats.activityTimeline.map(d => d.count), 1);
  const maxPollVotes = Math.max(displayStats.totalVotes, 1);

  return (
    <div className="relative min-h-[600px]">
      
      {/* PAYWALL (Se mantiene igual) */}
      {isFree && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-center animate-in fade-in duration-700">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)]">
                <Lock className="text-white w-8 h-8" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">Desbloquea las Estadísticas</h3>
            <p className="text-gray-300 max-w-md mb-8">
                Obtén insights detallados, gráficos de participación y control total con el plan Premium.
            </p>
            <Link 
                href="/premium" 
                className="px-8 py-4 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform shadow-xl"
            >
                Actualizar a Premium
            </Link>
        </div>
      )}

      <div className={`space-y-8 transition-all ${isFree ? 'opacity-20 filter blur-sm pointer-events-none select-none' : ''}`}>
        
        {/* 1. KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KpiCard 
                title="Votos Totales" 
                value={displayStats.totalVotes} 
                icon={<TrendingUp className="text-blue-400" />} 
            />
            <KpiCard 
                title="Categorías Activas" 
                value={displayStats.totalPolls} 
                icon={<BarChart3 className="text-purple-400" />} 
            />
            <KpiCard 
                title="Participación" 
                value={displayStats.totalVotes > 0 ? "Activa" : "Sin datos"} 
                icon={<Users className="text-green-400" />} 
                subtext="Estado del evento"
            />
        </div>

        {/* 2. RENDIMIENTO POR CATEGORÍA (Barras Horizontales) */}
        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-8">
            <h3 className="text-lg font-bold text-white mb-6">Votos por Categoría</h3>
            <div className="space-y-5">
                {displayStats.votesByPoll.map((item, idx) => (
                    <div key={idx} className="group">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-300 font-medium">{item.name}</span>
                            <span className="text-gray-500 font-mono text-xs">{item.votes} votos</span>
                        </div>
                        <div className="h-3 w-full bg-gray-800/50 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${(item.votes / maxPollVotes) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
                {displayStats.votesByPoll.length === 0 && (
                    <div className="text-center py-8 text-gray-600 text-sm border border-dashed border-white/10 rounded-xl">
                        No hay categorías con votos todavía.
                    </div>
                )}
            </div>
        </div>

        {/* 3. ACTIVIDAD RECIENTE (Timeline Vertical o Barras Reales) */}
        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-8">
            <h3 className="text-lg font-bold text-white mb-6">Actividad Reciente (Últimos días)</h3>
            
            {displayStats.activityTimeline.length > 0 ? (
                <div className="flex gap-2 items-end h-40 border-b border-white/10 pb-2 overflow-x-auto">
                    {displayStats.activityTimeline.map((day, i) => {
                        // Calculamos la altura relativa (max 100%)
                        const heightPercent = (day.count / maxTimelineVotes) * 100;
                        
                        return (
                            <div key={i} className="flex-1 min-w-[40px] flex flex-col justify-end group relative h-full">
                                {/* Tooltip */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black border border-white/20 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                    {day.count} votos <br/> <span className="text-gray-500">{day.date}</span>
                                </div>
                                
                                {/* Barra */}
                                <div 
                                    className="w-full bg-blue-500/30 hover:bg-blue-500/60 transition-all rounded-t-sm relative" 
                                    style={{ height: `${heightPercent}%` }}
                                ></div>
                                
                                {/* Fecha eje X (opcional, solo si hay pocos) */}
                                <div className="text-[9px] text-center text-gray-600 mt-2 truncate w-full">
                                    {day.date.split('-')[2]} {/* Solo el día */}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500 text-sm italic">
                    Aún no hay actividad registrada en la línea de tiempo.
                </div>
            )}
            
            <p className="text-xs text-gray-500 mt-4 text-right">Votos registrados por día</p>
        </div>

      </div>
    </div>
  );
}

// ... (KpiCard y MOCK_STATS se mantienen igual que antes) ...
function KpiCard({ title, value, icon, subtext }: any) {
    return (
        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 flex items-start justify-between">
            <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{title}</p>
                <h4 className="text-3xl font-black text-white">{value}</h4>
                {subtext && <p className="text-xs text-green-400 mt-1 font-medium">{subtext}</p>}
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                {icon}
            </div>
        </div>
    )
}

const MOCK_STATS: StatsData = {
    totalVotes: 1243,
    totalPolls: 8,
    votesByPoll: [
        { name: "El Más Tardón", votes: 342 },
        { name: "Mejor Outfit", votes: 215 },
        { name: "El Alma de la Fiesta", votes: 180 },
        { name: "Peor Conductor", votes: 95 },
    ],
    activityTimeline: [
        { date: "2024-01-01", count: 10 },
        { date: "2024-01-02", count: 45 },
        { date: "2024-01-03", count: 30 },
        { date: "2024-01-04", count: 80 },
        { date: "2024-01-05", count: 120 },
    ]
};