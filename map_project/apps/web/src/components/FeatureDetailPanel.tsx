"use client";

import {
    Activity,
    BookOpen,
    Building2,
    ExternalLink,
    Globe,
    MapPin,
    Navigation,
    Train,
    X,
    Zap,
} from "lucide-react";

export interface FeaturePanelData {
    title: string;
    type: "Point" | "LineString" | "Polygon" | "MultiLineString" | "MultiPolygon";
    layer: string;
    color: string;
    fields: { label: string; value: string }[];
    coords?: string;
}

interface Props {
    panel: FeaturePanelData;
    onClose: () => void;
}

// ── Layer icon + category label ───────────────────────────────────────────────
function getLayerMeta(layer: string): { icon: React.ReactNode; category: string; bg: string } {
    if (layer.toLowerCase().includes("health"))
        return { icon: <Activity className="w-5 h-5" />, category: "Health Facility", bg: "bg-red-50" };
    if (layer.toLowerCase().includes("education"))
        return { icon: <BookOpen className="w-5 h-5" />, category: "Education Facility", bg: "bg-purple-50" };
    if (layer.toLowerCase().includes("settlement"))
        return { icon: <Building2 className="w-5 h-5" />, category: "Settlement", bg: "bg-blue-50" };
    if (layer.toLowerCase().includes("road"))
        return { icon: <Navigation className="w-5 h-5" />, category: "Road Network", bg: "bg-orange-50" };
    if (layer.toLowerCase().includes("railway"))
        return { icon: <Train className="w-5 h-5" />, category: "Railway", bg: "bg-violet-50" };
    if (layer.toLowerCase().includes("energy"))
        return { icon: <Zap className="w-5 h-5" />, category: "Energy & Telecom", bg: "bg-amber-50" };
    return { icon: <Globe className="w-5 h-5" />, category: layer, bg: "bg-slate-50" };
}

// ── Geometry type pill ────────────────────────────────────────────────────────
function GeomBadge({ type, color }: { type: string; color: string }) {
    const label = type.includes("Line") ? "Line" : type.includes("Point") ? "Point" : "Polygon";
    const symbol = type.includes("Line") ? "⟋" : type.includes("Point") ? "●" : "▬";
    return (
        <span
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
            style={{ color, borderColor: color + "60", background: color + "15" }}
        >
            {symbol} {label}
        </span>
    );
}

// ── Google Maps-style open in maps link ───────────────────────────────────────
function MapsLink({ coords }: { coords: string }) {
    const [lat, lng] = coords.split(",").map((s) => s.trim());
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
            <ExternalLink className="w-3 h-3" />
            Open in Google Maps
        </a>
    );
}

export default function FeatureDetailPanel({ panel, onClose }: Props) {
    const { icon, category, bg } = getLayerMeta(panel.layer);
    const validFields = panel.fields.filter((f) => f.value && f.value !== "N/A" && f.value !== "null");
    const naFields = panel.fields.filter((f) => !f.value || f.value === "N/A" || f.value === "null");

    return (
        <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] w-[340px] max-w-[92vw] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden pointer-events-auto"
            style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
        >
            {/* ── Top colour bar ── */}
            <div className="h-1.5 w-full" style={{ background: panel.color }} />

            {/* ── Header ── */}
            <div className={`px-4 pt-4 pb-3 ${bg} border-b border-slate-100`}>
                <div className="flex items-start gap-3">
                    {/* Icon circle */}
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: panel.color + "20", color: panel.color }}
                    >
                        {icon}
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Category + geom badge */}
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                {category}
                            </span>
                            <GeomBadge type={panel.type} color={panel.color} />
                        </div>
                        {/* Title */}
                        <h3 className="text-base font-bold text-slate-800 leading-snug line-clamp-2">
                            {panel.title}
                        </h3>
                        {/* Coordinates */}
                        {panel.coords && (
                            <div className="flex items-center gap-1.5 mt-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="text-[11px] text-slate-400 font-mono">{panel.coords}</span>
                            </div>
                        )}
                    </div>

                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── Fields ── */}
            <div className="px-4 py-3 space-y-0 max-h-56 overflow-y-auto">
                {validFields.map((field, i) => (
                    <div
                        key={i}
                        className="flex items-start justify-between gap-4 py-2 border-b border-slate-50 last:border-0"
                    >
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 pt-0.5">
                            {field.label}
                        </span>
                        <span className="text-[13px] text-slate-700 font-medium text-right capitalize leading-snug">
                            {field.value}
                        </span>
                    </div>
                ))}

                {/* N/A fields collapsed */}
                {naFields.length > 0 && (
                    <div className="pt-1">
                        {naFields.map((field, i) => (
                            <div
                                key={i}
                                className="flex items-start justify-between gap-4 py-1.5 opacity-35"
                            >
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                                    {field.label}
                                </span>
                                <span className="text-[11px] text-slate-400 text-right">—</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Footer ── */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                        Source: SSGI / OSM
                    </span>
                </div>
                {panel.coords && <MapsLink coords={panel.coords} />}
            </div>
        </div>
    );
}
