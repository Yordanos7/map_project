"use client";

import Link from "next/link";
import { ArrowLeft, Settings, Cpu, LineChart, ShieldCheck, Zap, Terminal } from "lucide-react";
import ssgiLogo from "@/assets/ssgi-logo.png";

const services = [
    {
        title: "Web Map Services (WMS)",
        desc: "Standard OGC raster representation for all topographic and administrative layers.",
        icon: Zap
    },
    {
        title: "Feature Services (WFS)",
        desc: "Direct access to vector data for complex analysis and local GIS downloads.",
        icon: Cpu
    },
    {
        title: "Vector Tile Services (MVT)",
        desc: "Lightweight, style-able tiles optimized for modern web and mobile applications.",
        icon: Map
    },
    {
        title: "Spatial Analytics API",
        desc: "Geoprocessing tools for proximity analysis, elevation profiles, and clustering.",
        icon: LineChart
    },
    {
        title: "Geo-Sovereign Identity",
        desc: "Secure authentication for accessing restricted national security geospatial data.",
        icon: ShieldCheck
    },
    {
        title: "Developer Sandbox",
        desc: "RESTful API documentation and SDKs for custom application development.",
        icon: Terminal
    },
];

import { Map } from "lucide-react";

export default function ServicesPage() {
    return (
        <div className="min-h-screen bg-navy-dark navy-gradient text-primary-foreground">
            <header className="px-6 py-4 flex items-center justify-between border-b border-navy-light/30 glass-panel sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-3 hover:scale-105 transition-transform">
                    <img src={ssgiLogo.src} alt="SSGI Logo" className="h-9 w-9 object-contain" />
                    <div className="hidden sm:block">
                        <h1 className="text-sm font-display font-bold text-primary-foreground leading-tight">Ethio-Map Platform</h1>
                        <p className="text-[10px] text-gold-light tracking-wide">Developer & Enterprise Services</p>
                    </div>
                </Link>
                <Link href="/" className="flex items-center gap-2 text-sm text-gold-light hover:text-gold transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-16">
                <div className="animate-fade-in text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
                        Platform <span className="text-gold">Services</span>
                    </h1>
                    <p className="text-lg text-primary-foreground/70 leading-relaxed max-w-2xl mx-auto">
                        Leverage Ethiopia's spatial infrastructure through our high-performance APIs and professional geospatial services.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((item, idx) => (
                        <div
                            key={item.title}
                            className="glass-panel p-8 rounded-2xl border border-navy-light/20 hover:bg-gold/5 transition-all group animate-fade-in"
                            style={{ animationDelay: `${0.1 * idx}s` }}
                        >
                            <item.icon className="w-10 h-10 text-gold mb-6 group-hover:scale-110 transition-transform" />
                            <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                            <p className="text-sm text-primary-foreground/60 leading-relaxed font-body">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-20 p-8 glass-panel rounded-3xl border border-gold/20 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-r from-navy/50 to-gold/5">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-4">Enterprise Geospatial Solutions</h2>
                        <p className="text-primary-foreground/70 font-body">
                            Looking for custom geospatial integration or national-scale analysis? Our team of experts at SSGI provides bespoke solutions tailored to institutional needs.
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <button className="px-8 py-3.5 rounded-xl gold-gradient text-navy-dark font-bold hover:scale-105 transition-transform shadow-lg shadow-gold/20">
                            Inquire Now
                        </button>
                    </div>
                </div>
            </main>

            <footer className="py-8 border-t border-navy-light/30 text-center text-xs text-primary-foreground/30">
                Space Science & Geospatial Institute © 2026 — OGC Compliant Solutions
            </footer>
        </div>
    );
}
