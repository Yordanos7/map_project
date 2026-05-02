"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

const NotFound = () => {
    const pathname = usePathname();

    useEffect(() => {
        console.error("404 Error: User attempted to access non-existent route:", pathname);
    }, [pathname]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted navy-gradient">
            <div className="text-center glass-panel p-10 rounded-2xl border border-gold/20 shadow-2xl">
                <h1 className="mb-4 text-6xl font-bold text-primary-foreground">404</h1>
                <p className="mb-8 text-xl text-gold-light font-medium">Oops! Page not found</p>
                <Link href="/" className="gold-gradient px-8 py-3 rounded-xl text-navy-dark font-bold transition-transform hover:scale-105 inline-block shadow-lg shadow-gold/20">
                    Return to Home
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
