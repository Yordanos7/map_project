"use client";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair } from "lucide-react";

interface MapViewProps {
    activeLayers: string[];
}

const BASEMAPS: Record<string, L.TileLayer> = {};

function getBasemap(key: string): L.TileLayer {
    if (!BASEMAPS[key]) {
        switch (key) {
            case "osm":
                BASEMAPS[key] = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    attribution: '&copy; OpenStreetMap contributors',
                    maxZoom: 19,
                });
                break;
            case "satellite":
                BASEMAPS[key] = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
                    attribution: '&copy; Esri',
                    maxZoom: 19,
                });
                break;
            case "terrain":
                BASEMAPS[key] = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
                    attribution: '&copy; OpenTopoMap',
                    maxZoom: 17,
                });
                break;
            case "cartographic":
                BASEMAPS[key] = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
                    attribution: '&copy; CARTO',
                    maxZoom: 20,
                });
                break;
            default:
                BASEMAPS[key] = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    attribution: '&copy; OpenStreetMap',
                    maxZoom: 19,
                });
        }
    }
    return BASEMAPS[key];
}

const ETHIOPIA_CENTER: L.LatLngExpression = [9.145, 40.489];
const ETHIOPIA_ZOOM = 6;

export default function MapView({ activeLayers }: MapViewProps) {
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ lat: string; lng: string }>({ lat: "9.145", lng: "40.489" });
    const [zoom, setZoom] = useState(ETHIOPIA_ZOOM);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: ETHIOPIA_CENTER,
            zoom: ETHIOPIA_ZOOM,
            zoomControl: false,
        });

        getBasemap("osm").addTo(map);

        map.on("mousemove", (e) => {
            setCoords({ lat: e.latlng.lat.toFixed(4), lng: e.latlng.lng.toFixed(4) });
        });
        map.on("zoomend", () => setZoom(map.getZoom()));

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Sync active basemap layers
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const basemapKeys = ["osm", "satellite", "terrain", "cartographic"];
        const activeBasemap = activeLayers.find((l) => basemapKeys.includes(l)) || "osm";

        basemapKeys.forEach((key) => {
            const layer = getBasemap(key);
            if (key === activeBasemap) {
                if (!map.hasLayer(layer)) {
                    // Remove other basemaps first
                    basemapKeys.forEach((k) => {
                        if (k !== key && map.hasLayer(getBasemap(k))) map.removeLayer(getBasemap(k));
                    });
                    layer.addTo(map);
                }
            } else {
                if (map.hasLayer(layer)) map.removeLayer(layer);
            }
        });
    }, [activeLayers]);

    const handleLocate = () => {
        mapRef.current?.locate({ setView: true, maxZoom: 14 });
    };

    const handleZoomIn = () => mapRef.current?.zoomIn();
    const handleZoomOut = () => mapRef.current?.zoomOut();
    const handleFullScreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <div className="relative w-full h-full bg-[#f8f9fa]">
            <div ref={containerRef} className="w-full h-full" />

            {/* Right-side Map Controls */}
            <div className="absolute top-1/2 -translate-y-1/2 right-4 z-[1000] flex flex-col gap-1">
                <button
                    onClick={handleZoomIn}
                    title="Zoom In"
                    className="bg-white border border-slate-200 w-8 h-8 flex items-center justify-center rounded-sm text-slate-600 hover:bg-slate-50 shadow-sm transition-colors text-xl font-light"
                >+</button>
                <button
                    onClick={handleZoomOut}
                    title="Zoom Out"
                    className="bg-white border border-slate-200 w-8 h-8 flex items-center justify-center rounded-sm text-slate-600 hover:bg-slate-50 shadow-sm transition-colors text-xl font-light"
                >−</button>
                <button
                    onClick={handleFullScreen}
                    title="Full Screen"
                    className="bg-white border border-slate-200 w-8 h-8 flex items-center justify-center rounded-sm text-slate-600 hover:bg-slate-50 shadow-sm transition-colors mt-1"
                >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2"><path d="M15 3h6v6M9 21H3v-6M21 15v6h-6M3 9V3h6" /></svg>
                </button>
                <button
                    onClick={handleLocate}
                    title="My Location"
                    className="bg-white border border-slate-200 w-8 h-8 flex items-center justify-center rounded-sm text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
                >
                    <Crosshair className="w-4 h-4" />
                </button>
            </div>

            {/* Bottom Coordinate display */}
            <div className="absolute bottom-1 left-1.5 z-[1000] bg-white/60 px-2 py-0.5 text-[10px] text-slate-500 font-sans border border-transparent">
                {coords.lat}, {coords.lng} | Zoom: {zoom}
            </div>
        </div>
    );
}
