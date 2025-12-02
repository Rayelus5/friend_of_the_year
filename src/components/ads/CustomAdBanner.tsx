"use client";

import Link from "next/link";

export const CustomAdBanner = () => {
    return (
        <Link href="/about#contact">
            <img src="./ads/Horizontal.jpg" alt="Publicidad banner" className="w-full h-auto" />
        </Link>
    );
};