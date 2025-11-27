"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Bouncy } from "ldrs/react";
import "ldrs/react/Bouncy.css";

type AdminPaginationProps = {
    currentPage: number;
    totalPages: number;
    basePath: string;
    query?: Record<string, string | number | null | undefined>;
};

function buildPageUrl(
    basePath: string,
    page: number,
    query?: Record<string, string | number | null | undefined>
) {
    const params = new URLSearchParams();

    if (query) {
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined && value !== null && value !== "") {
                params.set(key, String(value));
            }
        }
    }

    if (page > 1) {
        params.set("page", String(page));
    }

    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
}

export default function AdminPagination({
    currentPage,
    totalPages,
    basePath,
    query,
}: AdminPaginationProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    if (totalPages <= 1) return null;

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        const url = buildPageUrl(basePath, page, query);
        startTransition(() => {
            router.push(url);
        });
    };

    // Pequeño helper para mostrar un rango de páginas
    const getPages = () => {
        const pages: (number | "dots")[] = [];
        const maxButtons = 5;

        if (totalPages <= maxButtons) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        }

        const start = Math.max(1, currentPage - 1);
        const end = Math.min(totalPages, currentPage + 1);

        if (start > 1) {
            pages.push(1);
            if (start > 2) pages.push("dots");
        }

        for (let i = start; i <= end; i++) pages.push(i);

        if (end < totalPages) {
            if (end < totalPages - 1) pages.push("dots");
            pages.push(totalPages);
        }

        return pages;
    };

    const pages = getPages();

    return (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-4">
            <div className="flex items-center gap-2 text-xs text-gray-400">
                {isPending && (
                    <Bouncy size="26" speed="1.75" color="#9ca3af" />
                )}
                <span>
                    Página <span className="font-bold text-gray-200">{currentPage}</span>{" "}
                    de <span className="font-bold text-gray-200">{totalPages}</span>
                </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
                <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1 || isPending}
                    className="px-3 py-1.5 rounded-lg border border-white/10 bg-black/60 text-gray-300 hover:border-white/40 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                    Anterior
                </button>

                {pages.map((p, idx) =>
                    p === "dots" ? (
                        <span key={`dots-${idx}`} className="px-2 text-gray-500">
                            ...
                        </span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => goToPage(p)}
                            disabled={isPending}
                            className={`min-w-[32px] px-2 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${p === currentPage
                                    ? "bg-blue-600 border-blue-500 text-white"
                                    : "bg-black/60 border-white/10 text-gray-300 hover:border-white/40 hover:text-white"
                                }`}
                        >
                            {p}
                        </button>
                    )
                )}

                <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages || isPending}
                    className="px-3 py-1.5 rounded-lg border border-white/10 bg-black/60 text-gray-300 hover:border-white/40 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );
}