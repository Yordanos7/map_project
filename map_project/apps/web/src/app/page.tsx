"use client";

import { useState, useCallback, useRef } from "react";
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
  const mapRef = useRef<{
    locateAdmin: (bbox: [number,number,number,number], geojson: any, name: string) => void;
    startBuffer: (radiusKm: number) => void;
    stopBuffer: () => void;
    startMeasure: (mode: "distance" | "area") => void;
    stopMeasure: () => void;
    startSuitability: (layers: string[], weights: number[]) => void;
    stopSuitability: () => void;
    setTimeFilter: (year: number | null) => void;
  } | null>(null);

  const handleToggleLayer = useCallback((layerId: string) => {
    const basemapKeys = ["osm", "satellite", "terrain", "cartographic"];
    setActiveLayers((prev) => {
      if (basemapKeys.includes(layerId)) {
        const withoutBasemaps = prev.filter((l) => !basemapKeys.includes(l));
        return [...withoutBasemaps, layerId];
      }
      return prev.includes(layerId) ? prev.filter((l) => l !== layerId) : [...prev, layerId];
    });
  }, []);

  const handleLocateAdmin = useCallback((bbox: [number,number,number,number], geojson: any, name: string) => {
    mapRef.current?.locateAdmin(bbox, geojson, name);
  }, []);

  const handleStartBuffer = useCallback((radiusKm: number) => mapRef.current?.startBuffer(radiusKm), []);
  const handleStopBuffer = useCallback(() => mapRef.current?.stopBuffer(), []);
  const handleStartMeasure = useCallback((mode: "distance" | "area") => mapRef.current?.startMeasure(mode), []);
  const handleStopMeasure = useCallback(() => mapRef.current?.stopMeasure(), []);
  const handleStartSuitability = useCallback((layers: string[], weights: number[]) => mapRef.current?.startSuitability(layers, weights), []);
  const handleStopSuitability = useCallback(() => mapRef.current?.stopSuitability(), []);
  const handleSetTimeFilter = useCallback((year: number | null) => mapRef.current?.setTimeFilter(year), []);

  if (!showMap) {
    return <HeroSection onEnterMap={() => setShowMap(true)} />;
  }

  return (
    <main className="h-screen w-screen overflow-hidden relative bg-[#f8f9fa] selection:bg-primary/20">
      <div className="absolute inset-0 z-0">
        <MapView activeLayers={activeLayers} ref={mapRef} />
      </div>

      <div className="absolute inset-0 pointer-events-none z-10">
        <FloatingSidebar
          activeLayers={activeLayers}
          onToggleLayer={handleToggleLayer}
          onLocateAdmin={handleLocateAdmin}
          onStartBuffer={handleStartBuffer}
          onStopBuffer={handleStopBuffer}
          onStartMeasure={handleStartMeasure}
          onStopMeasure={handleStopMeasure}
          onStartSuitability={handleStartSuitability}
          onStopSuitability={handleStopSuitability}
          onSetTimeFilter={handleSetTimeFilter}
        />
        <MapActionButtons />
        <LayerSwitcher activeLayers={activeLayers} onToggleLayer={handleToggleLayer} />
        <LanguageSelector />
        <DataAccessPanel />
      </div>

      <div className="absolute bottom-1 right-12 z-[1000] pointer-events-auto">
        <div className="bg-white/40 border border-slate-100 px-2 py-0.5 rounded text-[8px] text-slate-400 font-medium">
          200 km
        </div>
      </div>
    </main>
  );
}
