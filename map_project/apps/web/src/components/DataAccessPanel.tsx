"use client";
import { Download, Share2, Database, ChevronRight, X } from "lucide-react";
import { useState } from "react";

export default function DataAccessPanel() {
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="absolute bottom-4 right-16 z-[1000] w-10 h-10 bg-white shadow-lg flex items-center justify-center rounded-lg border border-slate-100 hover:bg-slate-50 transition-all text-slate-600 pointer-events-auto"
                title="Data Access"
            >
                <Database className="w-5 h-5" />
            </button>
        );
    }

    return (
        <div className="absolute bottom-4 right-16 z-[1000] w-72 bg-white/95 backdrop-blur-md shadow-2xl rounded-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 pointer-events-auto">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-primary" />
                    Data & API Access
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="p-4 space-y-4">
                <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connect to OGC Services</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {["WMS", "WFS", "WMTS", "WCS"].map((s) => (
                            <button key={s} className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-semibold text-slate-600 hover:border-primary hover:text-primary transition-all">
                                {s} Link
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Download Datasets</h4>
                    <div className="space-y-1">
                        {[
                            "Admin Boundaries (GeoJSON)",
                            "Road Network (SHP)",
                            "Population Grids (TIFF)"
                        ].map((d, i) => (
                            <button key={i} className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded text-[11px] text-slate-600 transition-colors group">
                                <span className="truncate">{d}</span>
                                <Download className="w-3 h-3 text-slate-300 group-hover:text-primary" />
                            </button>
                        ))}
                    </div>
                </div>

                <button className="w-full mt-2 py-2 flex items-center justify-center gap-2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded shadow-sm hover:opacity-90 transition-all">
                    <Share2 className="w-3.5 h-3.5" />
                    Share Map View
                </button>
            </div>
        </div>
    );
}
