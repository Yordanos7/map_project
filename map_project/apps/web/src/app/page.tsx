"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import HeroSection from "@/components/HeroSection";
import FloatingSidebar from "@/components/FloatingSidebar";
import MapActionButtons from "@/components/MapActionButtons";
import LayerSwitcher from "@/components/LayerSwitcher";
import LanguageSelector from "@/components/LanguageSelector";
import DataAccessPanel from "@/components/DataAccessPanel";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function Home() {
  const [showMap, setShowMap] = useState(false);
  const [activeLayers, setActiveLayers] = useState<string[]>(["osm"]);

  const handleToggleLayer = useCallback((layerId: string) => {
    const basemapKeys = ["osm", "satellite", "terrain", "cartographic"];
    setActiveLayers((prev) => {
      if (basemapKeys.includes(layerId)) {
        // Radio behavior for basemaps
        const withoutBasemaps = prev.filter((l) => !basemapKeys.includes(l));
        return [...withoutBasemaps, layerId];
      }
      return prev.includes(layerId) ? prev.filter((l) => l !== layerId) : [...prev, layerId];
    });
  }, []);

  if (!showMap) {
    return <HeroSection onEnterMap={() => setShowMap(true)} />;
  }

  return (
    <main className="h-screen w-screen overflow-hidden relative bg-[#f8f9fa] selection:bg-primary/20">
      {/* Interactive Map Surface */}
      <div className="absolute inset-0 z-0">
        <MapView activeLayers={activeLayers} />
      </div>

      {/* Floating UI Layer */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <FloatingSidebar />
        <MapActionButtons />
        <LayerSwitcher activeLayers={activeLayers} onToggleLayer={handleToggleLayer} />
        <LanguageSelector />
        <DataAccessPanel />
      </div>

      {/* Optional Attribution or Scale bar could go here */}
      <div className="absolute bottom-1 right-12 z-[1000] pointer-events-auto">
        <div className="bg-white/40 border border-slate-100 px-2 py-0.5 rounded text-[8px] text-slate-400 font-medium">
          200 km
        </div>
      </div>
    </main>
  );
}
