"use client";

import Link from "next/link";

export const CustomPollnowBanner = () => {
    return (
        <Link href="/about#contact">
            <img src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fs3-alpha.figma.com%2Fhub%2Ffile%2F4093188630%2F561dfe3e-e5f8-415c-9b26-fbdf94897722-cover.png&f=1&nofb=1&ipt=74f8d74e165a1d232c61cb0306c488e98ec6a8daccb75f67f0e4aa4dc31af6a7" alt="Publicidad banner" className="w-full h-auto" />
        </Link>
    );
};