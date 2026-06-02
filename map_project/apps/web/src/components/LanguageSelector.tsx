"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function LanguageSelector() {
    const [lang, setLang] = useState("English");
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="absolute bottom-6 right-4 z-[1000] pointer-events-auto">
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-white border border-slate-200 pl-4 pr-2 py-1.5 rounded text-[11px] font-medium text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-6 transition-colors"
                >
                    {lang}
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                    <div className="absolute bottom-full mb-1 right-0 w-32 bg-white border border-slate-100 shadow-xl rounded-lg py-1 flex flex-col overflow-hidden">
                        {["Amharic", "English", "Oromo", "Tigrinya"].map((l) => (
                            <button
                                key={l}
                                onClick={() => {
                                    setLang(l);
                                    setIsOpen(false);
                                }}
                                className={`text-left px-4 py-2 text-[10px] font-medium hover:bg-slate-50 transition-colors ${lang === l ? "text-primary bg-primary/5" : "text-slate-600"}`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
