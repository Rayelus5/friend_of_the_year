"use client";

import { useState } from "react";
import { clsx } from "clsx";

export default function EventTabs({
    stats,
    settings,
    participants,
    polls
}: {
    stats: React.ReactNode,
    settings: React.ReactNode,
    participants: React.ReactNode,
    polls: React.ReactNode
}) {
    const [activeTab, setActiveTab] = useState<'stats' | 'settings' | 'participants' | 'polls'>('settings');

    const tabs = [
        { id: 'settings', label: 'Configuración' },
        { id: 'participants', label: 'Nominados' },
        { id: 'polls', label: 'Categorías' },
        { id: 'stats', label: 'Estadísticas' }
    ] as const;

    return (
        <div>
            <div className="flex border-b border-white/10 mb-8 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            "px-6 py-3 text-sm font-bold transition-colors relative whitespace-nowrap cursor-pointer",
                            activeTab === tab.id ? "text-blue-500" : "text-gray-400 hover:text-white"
                        )}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                        )}
                    </button>
                ))}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === 'stats' && stats}
                {activeTab === 'settings' && settings}
                {activeTab === 'participants' && participants}
                {activeTab === 'polls' && polls}
            </div>
        </div>
    );
}