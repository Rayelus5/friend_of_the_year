"use client";

import Link from "next/link";

export const CustomAdBannerVertical = () => {
    return (
        <Link href="/about#contact">
            <img src="./ads/Vertical.jpg" alt="Publicidad banner" className="w-full h-auto" />
        </Link>
    );
}
