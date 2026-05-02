import ethiopiaRelief from "@/assets/ethiopia-relief.jpg";
import ssgiLogo from "@/assets/ssgi-logo.png";
import { ArrowRight, Globe, Database, Satellite, MapPin } from "lucide-react";
import Link from "next/link";

interface HeroSectionProps {
    onEnterMap: () => void;
}

export default function HeroSection({ onEnterMap }: HeroSectionProps) {
    return (
        <div className="relative min-h-screen flex flex-col">
            {/* Background */}
            <div className="absolute inset-0">
                <img src={ethiopiaRelief.src} alt="Ethiopia 3D Relief" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-navy-dark/90 via-navy/70 to-navy-dark/95" />
            </div>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                    <img src={ssgiLogo.src} alt="SSGI" className="h-12 w-12 object-contain" />
                    <div>
                        <h2 className="text-sm font-display font-bold text-primary-foreground">Space Science & Geospatial Institute</h2>
                        <p className="text-xs text-gold-light">Federal Democratic Republic of Ethiopia</p>
                    </div>
                </div>
                <nav className="hidden md:flex items-center gap-6 text-sm text-primary-foreground/80 font-medium">
                    <Link href="/about" className="hover:text-gold transition-colors">About</Link>
                    <Link href="/data-catalog" className="hover:text-gold transition-colors">Data Catalog</Link>
                    <Link href="/services" className="hover:text-gold transition-colors">Services</Link>
                    <Link href="/contact" className="hover:text-gold transition-colors">Contact</Link>
                </nav>
            </div>

            {/* Hero content */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="animate-fade-in max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-gold/10 text-gold text-xs font-medium mb-6">
                        <Satellite className="w-3.5 h-3.5" />
                        National Address System Foundation
                    </div>
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-primary-foreground leading-tight mb-4">
                        Ethio-Map <span className="text-gold">Platform</span>
                    </h1>
                    <p className="text-lg md:text-xl text-primary-foreground/70 max-w-2xl mx-auto mb-8 font-body">
                        Ethiopia's authoritative national geoportal — unifying fragmented geospatial data into a single digital foundation for sustainable development.
                    </p>

                    <button
                        onClick={onEnterMap}
                        className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl gold-gradient text-navy-dark font-semibold text-base hover:scale-105 transition-transform shadow-lg shadow-gold/20"
                    >
                        <Globe className="w-5 h-5" />
                        Explore the Map
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Feature cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 max-w-4xl w-full animate-fade-in" style={{ animationDelay: "0.3s" }}>
                    {[
                        { icon: MapPin, title: "Multi-Scale Data", desc: "From national boundaries to kebele-level detail" },
                        { icon: Database, title: "OGC Standards", desc: "WMS, WFS, MVT — fully interoperable services" },
                        { icon: Satellite, title: "Satellite Imagery", desc: "High-resolution annual mosaics and terrain models" },
                    ].map((card) => (
                        <div key={card.title} className="glass-panel bg-navy/40 backdrop-blur-md border-navy-light/30 rounded-xl p-5 text-left">
                            <card.icon className="w-8 h-8 text-gold mb-3" />
                            <h3 className="text-sm font-semibold text-primary-foreground mb-1">{card.title}</h3>
                            <p className="text-xs text-primary-foreground/60">{card.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom bar */}
            <div className="relative z-10 flex items-center justify-center gap-8 py-4 text-[10px] text-primary-foreground/40">
                <span>FOSS & Open Standards</span>
                <span>•</span>
                <span>WMS / WFS / MVT</span>
                <span>•</span>
                <span>ISO 19115 Metadata</span>
            </div>
        </div>
    );
}
