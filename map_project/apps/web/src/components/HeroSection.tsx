import ethiopiaRelief from "@/assets/ethiopia-relief.jpg";
import ssgiLogo from "@/assets/ssgi-logo.png";
import { ArrowRight, Globe, Satellite } from "lucide-react";

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

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={onEnterMap}
                            className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl gold-gradient text-navy-dark font-semibold text-base hover:scale-105 transition-transform shadow-lg shadow-gold/20"
                        >
                            <Globe className="w-5 h-5" />
                            Explore the Map
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <a
                            href="/login?redirect=/admin"
                            className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl border border-white/30 bg-white/90 text-navy-dark font-semibold text-base hover:bg-white transition-transform shadow-lg shadow-slate-200"
                        >
                            Login
                        </a>
                    </div>
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
