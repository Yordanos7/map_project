"use client";
import { Layers } from "lucide-react";
import { useState } from "react";

interface LayerSwitcherProps {
    activeLayers: string[];
    onToggleLayer: (layerId: string) => void;
}

const BASEMAPS = [
    { id: "osm", label: "National Vector", image: "https://tile.openstreetmap.org/0/0/0.png" },
    { id: "cartographic", label: "Cartographic", image: "https://stamen-tiles.a.ssl.fastly.net/toner/0/0/0.png" },
    { id: "satellite", label: "Satellite Mosaic", image: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/0/0/0" },
    { id: "terrain", label: "Terrain / DEM", image: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/0/0/0" }
];

export default function LayerSwitcher({ activeLayers, onToggleLayer }: LayerSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);

    const currentBasemap = BASEMAPS.find(b => activeLayers.includes(b.id)) || BASEMAPS[0];

    return (
        <div className="absolute bottom-20 left-4 z-[1000] flex flex-col items-start gap-2">
            {isOpen && (
                <div className="flex gap-2 p-2 bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
                    {BASEMAPS.map((map) => (
                        <button
                            key={map.id}
                            onClick={() => onToggleLayer(map.id)}
                            className={`group flex flex-col items-center gap-1 transition-all ${activeLayers.includes(map.id) ? "scale-105" : "opacity-70 hover:opacity-100"
                                }`}
                        >
                            <div
                                className={`w-12 h-12 rounded border-2 overflow-hidden ${activeLayers.includes(map.id) ? "border-primary" : "border-transparent"
                                    }`}
                            >
                                <img src={map.image} alt={map.label} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter truncate w-12 text-center">
                                {map.label}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 rounded-lg bg-white shadow-lg flex flex-col items-center justify-center border border-slate-100 hover:bg-slate-50 transition-colors group"
            >
                <div className="w-8 h-8 rounded border-2 border-primary overflow-hidden mb-0.5">
                    <img src={currentBasemap.image} alt="current" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -top-1 -right-1 bg-primary text-white p-0.5 rounded-full shadow-sm">
                    <Layers className="w-2 h-2" />
                </div>
            </button>
        </div>
    );
}
