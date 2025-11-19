"use client";

import { PLANS, getPlanFromUser } from "@/lib/plans";
import { CreditCard, Sparkles } from "lucide-react";
import Link from "next/link";
import ManageButton from "@/components/premium/ManageButton";

type UserSubscription = {
    subscriptionStatus: string | null;
    stripePriceId: string | null;
    subscriptionEndDate: Date | null;
};

export default function SubscriptionCard({ user }: { user: UserSubscription }) {
    const plan = getPlanFromUser(user);
    const isFree = plan.slug === 'free';

    return (
        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-8 relative overflow-hidden">
            {/* Decoración de fondo */}
            {!isFree && (
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none -mr-16 -mt-16" />
            )}

            <div className="relative z-10">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <CreditCard className="text-purple-500" size={20} /> Suscripción
                </h2>

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-black/40 p-6 rounded-xl border border-white/5">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Plan Actual</p>
                        <div className="flex items-center gap-3">
                            <span className={`text-2xl font-black ${isFree ? 'text-white' : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400'}`}>
                                {plan.name}
                            </span>
                            {!isFree && (
                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded uppercase tracking-wide">
                                    Activo
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                            {isFree
                                ? "Tienes límites en la creación de eventos."
                                : `Disfruta de ${plan.quota > 100 ? 'eventos ilimitados' : plan.quota + ' eventos activos'}.`
                            }
                        </p>
                    </div>

                    <div className="w-full md:w-auto">
                        {isFree ? (
                            <Link
                                href="/premium"
                                className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                <Sparkles size={16} /> Mejorar Plan
                            </Link>
                        ) : (
                            <div className="w-full md:w-48">
                                <ManageButton />
                            </div>
                        )}
                    </div>
                </div>

                {!isFree && user.subscriptionEndDate && (
                    <p className="text-xs text-gray-600 mt-4 text-center md:text-left">
                        Tu suscripción se renueva el {new Date(user.subscriptionEndDate).toLocaleDateString()}
                    </p>
                )}
            </div>
        </div>
    );
}