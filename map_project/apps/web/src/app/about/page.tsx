"use client";

import Link from "next/link";
import { ArrowLeft, Globe, Satellite, MapPin, Award, Users } from "lucide-react";
import ssgiLogo from "@/assets/ssgi-logo.png";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-navy-dark navy-gradient text-primary-foreground">
            <header className="px-6 py-4 flex items-center justify-between border-b border-navy-light/30 glass-panel sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-3 hover:scale-105 transition-transform">
                    <img src={ssgiLogo.src} alt="SSGI Logo" className="h-9 w-9 object-contain" />
                    <div className="hidden sm:block">
                        <h1 className="text-sm font-display font-bold text-primary-foreground leading-tight">Ethio-Map Platform</h1>
                        <p className="text-[10px] text-gold-light tracking-wide">SSGI — From Earth to Space</p>
                    </div>
                </Link>
                <Link href="/" className="flex items-center gap-2 text-sm text-gold-light hover:text-gold transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-16">
                <div className="animate-fade-in text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
                        About <span className="text-gold">Ethio-Map</span>
                    </h1>
                    <p className="text-lg text-primary-foreground/70 leading-relaxed max-w-2xl mx-auto">
                        The Ethio-Map Platform is the National Geospatial Foundation of Ethiopia, serving as the central hub for high-quality, authoritative geospatial information.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                    <div className="glass-panel p-8 rounded-2xl border-navy-light/30">
                        <Globe className="w-10 h-10 text-gold mb-4" />
                        <h3 className="text-xl font-bold mb-3">Our Mission</h3>
                        <p className="text-primary-foreground/60 leading-relaxed font-body">
                            To unify fragmented geospatial data and provide decision-makers, engineers, and citizens with accurate, interoperable spatial insights for sustainable national development.
                        </p>
                    </div>
                    <div className="glass-panel p-8 rounded-2xl border-navy-light/30">
                        <Award className="w-10 h-10 text-gold mb-4" />
                        <h3 className="text-xl font-bold mb-3">SSGI Oversight</h3>
                        <p className="text-primary-foreground/60 leading-relaxed font-body">
                            Owned and managed by the Space Science & Geospatial Institute (SSGI), ensuring sovereignty, security, and international standards compliance.
                        </p>
                    </div>
                </div>

                <div className="space-y-12 mb-20 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                    <div>
                        <h2 className="text-2xl font-bold text-gold mb-4 flex items-center gap-3">
                            <Satellite className="w-6 h-6" />
                            National Strategy
                        </h2>
                        <p className="text-primary-foreground/60 leading-relaxed mb-4">
                            Ethio-Map is a direct implementation of the National Address System and the Spatial Data Infrastructure (SDI) strategy. We provide the "Base Map" upon which all other sectoral developments are built.
                        </p>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gold mb-4 flex items-center gap-3">
                            <Users className="w-6 h-6" />
                            Who We Serve
                        </h2>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-primary-foreground/60">
                            <li className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-gold-light mt-1 flex-shrink-0" />
                                <span>Government Ministries & Bureaus</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-gold-light mt-1 flex-shrink-0" />
                                <span>Private Sector Investors</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-gold-light mt-1 flex-shrink-0" />
                                <span>Academic & Research Institutions</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-gold-light mt-1 flex-shrink-0" />
                                <span>General Public & Communities</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="text-center">
                    <Link href="/" className="inline-flex items-center gap-3 px-8 py-4 rounded-xl gold-gradient text-navy-dark font-bold hover:scale-105 transition-transform shadow-lg shadow-gold/20">
                        Explore the Platform
                    </Link>
                </div>
            </main>

            <footer className="py-8 border-t border-navy-light/30 text-center text-xs text-primary-foreground/30">
                Space Science & Geospatial Institute © 2026 — OGC Compliant Geoportal
            </footer>
        </div>
    );
}
