"use client";

import Link from "next/link";
import { ArrowLeft, Database, Search, FileDown, Layers, Map, ChevronRight } from "lucide-react";
import ssgiLogo from "@/assets/ssgi-logo.png";

const catalogItems = [
    { id: "admin", title: "Administrative Boundaries", desc: "Regions, Zones, Woredas, and Kebeles (JSON/WFS)", count: 4 },
    { id: "transport", title: "Transportation & Mobility", desc: "Road networks, Railways, and Airport locations", count: 12 },
    { id: "land", title: "Land Cover & Use", desc: "National LULC maps and urban density models", count: 8 },
    { id: "nature", title: "Natural Resources", desc: "Hydrology, Forest cover, and Protected areas", count: 15 },
    { id: "social", title: "Social Infrastructure", desc: "Health facilities, Schools, and settlement points", count: 22 },
];

export default function DataCatalogPage() {
    return (
        <div className="min-h-screen bg-navy-dark navy-gradient text-primary-foreground">
            <header className="px-6 py-4 flex items-center justify-between border-b border-navy-light/30 glass-panel sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-3 hover:scale-105 transition-transform">
                    <img src={ssgiLogo.src} alt="SSGI Logo" className="h-9 w-9 object-contain" />
                    <div className="hidden sm:block">
                        <h1 className="text-sm font-display font-bold text-primary-foreground leading-tight">Ethio-Map Platform</h1>
                        <p className="text-[10px] text-gold-light tracking-wide">Data Access Portal</p>
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
                        Data <span className="text-gold">Catalog</span>
                    </h1>
                    <p className="text-lg text-primary-foreground/70 leading-relaxed max-w-2xl mx-auto">
                        Discover and access authoritative geospatial datasets categorized for easy integration into your GIS workflows.
                    </p>
                </div>

                {/* Search Bar Placeholder */}
                <div className="mb-12 max-w-2xl mx-auto">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-light/60 group-focus-within:text-gold transition-colors" />
                        <input
                            type="text"
                            placeholder="Search datasets, metadata, tags..."
                            className="w-full bg-navy/50 border border-navy-light/40 rounded-2xl py-4 pl-12 pr-6 text-primary-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 glass-panel transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {catalogItems.map((item) => (
                        <div key={item.id} className="glass-panel p-6 rounded-2xl border border-navy-light/20 hover:border-gold/30 transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-gold/10 p-2.5 rounded-xl text-gold">
                                    {item.id === "admin" ? <Layers className="w-5 h-5" /> : item.id === "transport" ? <Map className="w-5 h-5" /> : <Database className="w-5 h-5" />}
                                </div>
                                <span className="text-[10px] font-bold text-gold-light bg-gold/5 px-2 py-1 rounded-full uppercase tracking-tighter">
                                    {item.count} Layers
                                </span>
                            </div>
                            <h3 className="text-lg font-bold mb-2 group-hover:text-gold transition-colors">{item.title}</h3>
                            <p className="text-sm text-primary-foreground/60 font-body mb-6">
                                {item.desc}
                            </p>
                            <button className="flex items-center gap-2 text-xs font-bold text-gold-light hover:text-gold transition-colors uppercase tracking-widest">
                                Browse Collection
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}

                    {/* External Access card */}
                    <div className="glass-panel p-6 rounded-2xl border border-gold/20 bg-gold/5 flex flex-col justify-center items-center text-center">
                        <FileDown className="w-10 h-10 text-gold mb-3" />
                        <h3 className="font-bold text-gold mb-1">Direct API Access</h3>
                        <p className="text-xs text-primary-foreground/60 mb-4">Connect via WMS/WFS/MVT</p>
                        <button className="gold-gradient px-4 py-2 rounded-lg text-navy-dark text-xs font-bold hover:scale-105 transition-transform">
                            Get Endpoints
                        </button>
                    </div>
                </div>
            </main>

            <footer className="py-8 border-t border-navy-light/30 text-center text-xs text-primary-foreground/30">
                Space Science & Geospatial Institute © 2026 — Data Catalog ISO 19115 Compliant
            </footer>
        </div>
    );
}
