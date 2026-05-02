"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, Send, HelpCircle } from "lucide-react";
import ssgiLogo from "@/assets/ssgi-logo.png";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-navy-dark navy-gradient text-primary-foreground">
            <header className="px-6 py-4 flex items-center justify-between border-b border-navy-light/30 glass-panel sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-3 hover:scale-105 transition-transform">
                    <img src={ssgiLogo.src} alt="SSGI Logo" className="h-9 w-9 object-contain" />
                    <div className="hidden sm:block">
                        <h1 className="text-sm font-display font-bold text-primary-foreground leading-tight">Ethio-Map Platform</h1>
                        <p className="text-[10px] text-gold-light tracking-wide">SSGI Contact Center</p>
                    </div>
                </Link>
                <Link href="/" className="flex items-center gap-2 text-sm text-gold-light hover:text-gold transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-16">
                <div className="animate-fade-in text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
                        Get in <span className="text-gold">Touch</span>
                    </h1>
                    <p className="text-lg text-primary-foreground/70 leading-relaxed max-w-2xl mx-auto font-body">
                        Have questions about geospatial data, API access, or platform features? Our technical team is here to assist.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Contact Information */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="glass-panel p-8 rounded-2xl border border-navy-light/20 flex items-start gap-4">
                            <div className="bg-gold/10 p-3 rounded-xl text-gold">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Our Headquarters</h3>
                                <p className="text-primary-foreground/60 text-sm font-body">
                                    Space Science & Geospatial Institute (SSGI)<br />
                                    Bole, Addis Ababa<br />
                                    Ethiopia
                                </p>
                            </div>
                        </div>

                        <div className="glass-panel p-8 rounded-2xl border border-navy-light/20 flex items-start gap-4">
                            <div className="bg-gold/10 p-3 rounded-xl text-gold">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Email Us</h3>
                                <p className="text-primary-foreground/60 text-sm font-body">
                                    Technical: support.map@ssgi.gov.et<br />
                                    General: info@ssgi.gov.et
                                </p>
                            </div>
                        </div>

                        <div className="glass-panel p-8 rounded-2xl border border-navy-light/20 flex items-start gap-4">
                            <div className="bg-gold/10 p-3 rounded-xl text-gold">
                                <Phone className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Call Center</h3>
                                <p className="text-primary-foreground/60 text-sm font-body">
                                    Main Line: +251 11 ... ....<br />
                                    GIS Support: Extension 304
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-7">
                        <div className="glass-panel p-8 rounded-3xl border border-gold/10">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Send className="w-5 h-5 text-gold" />
                                Technical Inquiry
                            </h2>
                            <form className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gold-light uppercase tracking-wider ml-1">Full Name</label>
                                        <input type="text" className="w-full bg-navy/40 border border-navy-light/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gold-light uppercase tracking-wider ml-1">Email Address</label>
                                        <input type="email" className="w-full bg-navy/40 border border-navy-light/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gold-light uppercase tracking-wider ml-1">Subject</label>
                                    <input type="text" placeholder="e.g. WFS Access Request" className="w-full bg-navy/40 border border-navy-light/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gold-light uppercase tracking-wider ml-1">Message</label>
                                    <textarea rows={5} className="w-full bg-navy/40 border border-navy-light/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all resize-none"></textarea>
                                </div>
                                <button className="w-full py-4 mt-2 rounded-xl gold-gradient text-navy-dark font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-gold/20 flex items-center justify-center gap-2">
                                    Send Message
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="mt-16 text-center text-primary-foreground/40 font-body flex items-center justify-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    <span>Response time is typically within 24-48 business hours.</span>
                </div>
            </main>

            <footer className="py-8 border-t border-navy-light/30 text-center text-xs text-primary-foreground/30">
                Space Science & Geospatial Institute © 2026 — Stakeholder Engagement Dept.
            </footer>
        </div>
    );
}
