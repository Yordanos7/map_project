"use client";
import { useState } from "react";
import { Smartphone, Apple, Play, ChevronDown } from "lucide-react";

export default function MapActionButtons() {
    const [isAppOpen, setIsAppOpen] = useState(false);

    return (
        <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2">
            <div className="relative">
                <button
                    onClick={() => setIsAppOpen(!isAppOpen)}
                    className="bg-white border border-slate-200 px-4 py-1.5 rounded text-[11px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 transition-colors"
                >
                    Get the App
                    <ChevronDown className={`w-3 h-3 transition-transform ${isAppOpen ? "rotate-180" : ""}`} />
                </button>

                {isAppOpen && (
                    <div className="absolute top-full mt-1 right-0 w-40 bg-white border border-slate-100 shadow-xl rounded-lg py-1 flex flex-col overflow-hidden">
                        <a
                            href="https://play.google.com/store/search?q=edas&c=apps"
                            target="_blank"
                            className="flex items-center gap-2 px-3 py-2 text-[10px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            <div className="w-5 h-5 flex items-center justify-center bg-slate-100 rounded">
                                <Play className="w-3 h-3 text-slate-500 fill-slate-500" />
                            </div>
                            Play Store
                        </a>
                        <a
                            href="https://apps.apple.com/us/app/edas/id6754965109"
                            target="_blank"
                            className="flex items-center gap-2 px-3 py-2 text-[10px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            <div className="w-5 h-5 flex items-center justify-center bg-slate-100 rounded">
                                <Apple className="w-3 h-3 text-slate-500 fill-slate-500" />
                            </div>
                            App Store
                        </a>
                    </div>
                )}
            </div>

            <button className="bg-white border border-slate-200 px-6 py-1.5 rounded text-[11px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
                Login
            </button>
        </div>
    );
}
