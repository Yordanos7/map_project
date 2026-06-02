"use client";
import { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
// @ts-ignore
import "leaflet.heat";
// @ts-ignore
import "leaflet-draw";
import * as turf from "@turf/turf";
import { Crosshair } from "lucide-react";
import FeatureDetailPanel, { type FeaturePanelData } from "./FeatureDetailPanel";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

interface MapViewProps {
    activeLayers: string[];
    adminBoundary?: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon> | GeoJSON.Polygon | GeoJSON.MultiPolygon | null;
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

// Road type → colour mapping derived from DIVA-GIS f_code_des values
function getRoadStyle(feature?: GeoJSON.Feature): L.PathOptions {
    const fcode = feature?.properties?.f_code_des ?? "";
    const rtt = feature?.properties?.rtt_descri ?? "";

    if (fcode === "AP030" || rtt.toLowerCase().includes("primary") || rtt.toLowerCase().includes("trunk")) {
        return { color: "#e63946", weight: 2.5, opacity: 0.9 };
    }
    if (rtt.toLowerCase().includes("secondary")) {
        return { color: "#f4a261", weight: 1.8, opacity: 0.85 };
    }
    if (rtt.toLowerCase().includes("track") || rtt.toLowerCase().includes("trail")) {
        return { color: "#a8dadc", weight: 1.2, opacity: 0.7, dashArray: "4,4" };
    }
    // Default – unknown/tertiary roads
    return { color: "#457b9d", weight: 1.5, opacity: 0.8 };
}

const ETHIOPIA_CENTER: L.LatLngExpression = [9.145, 40.489];
const ETHIOPIA_ZOOM = 6;

// ── Spatial filter helpers ────────────────────────────────────────────────────
function getPolygon(boundary: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon> | GeoJSON.Polygon | GeoJSON.MultiPolygon): GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null {
    if (!boundary) return null;
    if (boundary.type === "Feature") {
        return boundary as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
    }

    if (boundary.type === "FeatureCollection") {
        const collection = boundary as GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
        if (!Array.isArray(collection.features) || collection.features.length === 0) return null;
        const firstFeature = collection.features[0];
        if (!firstFeature || firstFeature.type !== "Feature") return null;
        return firstFeature as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
    }

    // Raw geometry object
    return {
        type: "Feature",
        properties: {},
        geometry: boundary as GeoJSON.Polygon | GeoJSON.MultiPolygon,
    };
}

function pointInBoundary(lat: number, lon: number, poly: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>): boolean {
    return turf.booleanPointInPolygon(turf.point([lon, lat]), poly);
}

function featureIntersects(feature: GeoJSON.Feature, poly: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>): boolean {
    try { return turf.booleanIntersects(feature, poly); } catch { return false; }
}

const MapView = forwardRef<{
    locateAdmin: (bbox: [number,number,number,number], geojson: any, name: string) => void;
    startBuffer: (radiusKm: number) => void;
    stopBuffer: () => void;
    startMeasure: (mode: "distance" | "area") => void;
    stopMeasure: () => void;
    startSuitability: (layers: string[], weights: number[]) => void;
    stopSuitability: () => void;
    setTimeFilter: (year: number | null) => void;
}, MapViewProps>(function MapView({ activeLayers, adminBoundary }, ref) {
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const adminHighlightRef = useRef<L.GeoJSON | null>(null);
    const searchMarkerRef = useRef<L.Layer | null>(null);
    const adminBoundaryRef = useRef<GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null>(null);
    const adminBoundaryPoly = useMemo(() => adminBoundary ? getPolygon(adminBoundary) : null, [adminBoundary]);
    // Analysis tool refs
    const drawLayerRef = useRef<L.FeatureGroup | null>(null);
    const analysisResultRef = useRef<L.Layer | null>(null);
    const drawControlRef = useRef<any>(null);
    const [measureResult, setMeasureResult] = useState<string | null>(null);
    const [activeAnalysisTool, setActiveAnalysisTool] = useState<string | null>(null);
    const bufferRadiusRef = useRef<number>(10);
    const measureModeRef = useRef<"distance" | "area">("distance");
    const suitabilityLayersRef = useRef<{ layers: string[]; weights: number[] } | null>(null);
    const roadsLayerRef = useRef<L.GeoJSON | null>(null);
    const popLayerRef = useRef<L.GeoJSON | null>(null);
    const settlementsLayerRef = useRef<L.GeoJSON | null>(null);
    const healthLayerRef = useRef<L.GeoJSON | null>(null);
    const educationLayerRef = useRef<L.GeoJSON | null>(null);
    const landcoverLayerRef = useRef<L.LayerGroup | null>(null);
    const forestsLayerRef = useRef<L.LayerGroup | null>(null);
    const waterLayerRef = useRef<L.LayerGroup | null>(null);
    const agroLayerRef = useRef<L.LayerGroup | null>(null);
    const cropsLayerRef = useRef<L.LayerGroup | null>(null);
    const railwaysLayerRef = useRef<L.GeoJSON | null>(null);
    const energyTelecomLayerRef = useRef<L.GeoJSON | null>(null);
    const [coords, setCoords] = useState<{ lat: string; lng: string }>({ lat: "9.145", lng: "40.489" });
    const [zoom, setZoom] = useState(ETHIOPIA_ZOOM);
    const [roadsLoaded, setRoadsLoaded] = useState(false);
    const [popLoaded, setPopLoaded] = useState(false);
    const [settlementsLoaded, setSettlementsLoaded] = useState(false);
    const [healthLoaded, setHealthLoaded] = useState(false);
    const [educationLoaded, setEducationLoaded] = useState(false);
    const [landcoverLoaded, setLandcoverLoaded] = useState(false);
    const [forestsLoaded, setForestsLoaded] = useState(false);
    const [waterLoaded, setWaterLoaded] = useState(false);
    const [agroLoaded, setAgroLoaded] = useState(false);
    const [cropsLoaded, setCropsLoaded] = useState(false);
    const [railwaysLoaded, setRailwaysLoaded] = useState(false);
    const [energyTelecomLoaded, setEnergyTelecomLoaded] = useState(false);

    // Feature description panel
    const [featurePanel, setFeaturePanel] = useState<FeaturePanelData | null>(null);

    const setFeaturePanelRef = useRef(setFeaturePanel);
    setFeaturePanelRef.current = setFeaturePanel;

    const openPanelRef = useRef<((
        title: string,
        type: "Point" | "LineString" | "Polygon" | "MultiLineString" | "MultiPolygon",
        layer: string,
        color: string,
        fields: { label: string; value: string }[],
        coords?: string
    ) => void)>((
        title, type, layer, color, fields, coords
    ) => setFeaturePanelRef.current({ title, type, layer, color, fields, coords }));

    openPanelRef.current = (title, type, layer, color, fields, coords) =>
        setFeaturePanelRef.current({ title, type, layer, color, fields, coords });

    // Fetch roads
    const { data: roadsData, isLoading: roadsLoading } = useQuery(
        trpc.map.getRoads.queryOptions()
    );
    // Fetch road stats
    const { data: statsData } = useQuery(
        trpc.map.getRoadStats.queryOptions()
    );
    // Fetch full array population heatmap data
    const { data: popData, isLoading: popLoading } = useQuery(
        trpc.map.getPopulationHeatmap.queryOptions()
    );
    // Fetch settlements
    const { data: settlementsData, isLoading: settlementsLoading } = useQuery(
        trpc.map.getSettlements.queryOptions()
    );
    // Fetch health facilities
    const { data: healthData, isLoading: healthLoading } = useQuery(
        trpc.map.getHealthFacilities.queryOptions()
    );
    // Fetch education facilities
    const { data: educationData, isLoading: educationLoading } = useQuery(
        trpc.map.getEducationFacilities.queryOptions()
    );
    // Fetch land cover data [lat, lon, class]
    const { data: landcoverData, isLoading: landcoverLoading } = useQuery(
        trpc.map.getLandcover.queryOptions()
    );
    // Fetch forests
    const { data: forestsData, isLoading: forestsLoading } = useQuery(
        trpc.map.getForests.queryOptions()
    );
    // Fetch water
    const { data: waterData, isLoading: waterLoading } = useQuery(
        trpc.map.getWaterResources.queryOptions()
    );
    // Fetch agroecology
    const { data: agroData, isLoading: agroLoading } = useQuery(
        trpc.map.getAgroEcology.queryOptions()
    );
    // Fetch crops
    const { data: cropsData, isLoading: cropsLoading } = useQuery(
        trpc.map.getCrops.queryOptions()
    );
    // Fetch railways
    const { data: railwaysData, isLoading: railwaysLoading } = useQuery(
        trpc.map.getRailways.queryOptions()
    );
    // Fetch energy & telecom
    const { data: energyTelecomData, isLoading: energyTelecomLoading } = useQuery(
        trpc.map.getEnergyTelecom.queryOptions()
    );

    useImperativeHandle(ref, () => ({
        locateAdmin(bbox, geojson, name) {
            const map = mapRef.current;
            if (!map) return;
            if (adminHighlightRef.current) {
                map.removeLayer(adminHighlightRef.current);
                adminHighlightRef.current = null;
            }
            const layer = L.geoJSON(geojson, {
                style: { color: "#2563eb", weight: 2.5, fillColor: "#3b82f6", fillOpacity: 0.08, dashArray: "6,3" },
            }).addTo(map);
            adminHighlightRef.current = layer;
            map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: [40, 40] });
        },

        locatePoint(lat, lng, label) {
            const map = mapRef.current;
            if (!map) return;
            if (searchMarkerRef.current) {
                map.removeLayer(searchMarkerRef.current);
                searchMarkerRef.current = null;
            }
            const marker = L.circleMarker([lat, lng], {
                radius: 10,
                fillColor: "#f59e0b",
                color: "#d97706",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.65,
            }).addTo(map);
            marker.bindTooltip(label, { permanent: false, direction: "top", offset: [0, -10] }).openTooltip();
            searchMarkerRef.current = marker;
            map.setView([lat, lng], 14);
        },

        startBuffer(radiusKm) {
            const map = mapRef.current;
            if (!map) return;
            bufferRadiusRef.current = radiusKm;
            clearAnalysis(map);
            setActiveAnalysisTool("buffer");
            setMeasureResult(`Click a point on the map to draw a ${radiusKm}km buffer`);
            map.once("click", (e) => {
                const pt = turf.point([e.latlng.lng, e.latlng.lat]);
                const buffered = turf.buffer(pt, radiusKm, { units: "kilometers" });
                const layer = L.geoJSON(buffered as any, {
                    style: { color: "#7c3aed", weight: 2, fillColor: "#7c3aed", fillOpacity: 0.15 },
                }).addTo(map);
                analysisResultRef.current = layer;
                setMeasureResult(`Buffer: ${radiusKm}km radius`);
            });
        },

        stopBuffer() {
            const map = mapRef.current;
            if (!map) return;
            clearAnalysis(map);
            setActiveAnalysisTool(null);
            setMeasureResult(null);
        },

        startMeasure(mode) {
            const map = mapRef.current;
            if (!map) return;
            measureModeRef.current = mode;
            clearAnalysis(map);
            setActiveAnalysisTool("measure_" + mode);

            if (!drawLayerRef.current) {
                drawLayerRef.current = new L.FeatureGroup().addTo(map);
            }

            const options: any = {
                edit: { featureGroup: drawLayerRef.current, remove: false },
                draw: {
                    polygon: mode === "area" ? { shapeOptions: { color: "#0ea5e9" } } : false,
                    polyline: mode === "distance" ? { shapeOptions: { color: "#0ea5e9" } } : false,
                    rectangle: false, circle: false, marker: false, circlemarker: false,
                },
            };

            // @ts-ignore
            const drawControl = new L.Control.Draw(options);
            drawControlRef.current = drawControl;
            map.addControl(drawControl);
            setMeasureResult(mode === "distance" ? "Click to draw a line, double-click to finish" : "Click to draw a polygon, double-click to finish");

            map.on(L.Draw.Event.CREATED, (e: any) => {
                const layer = e.layer;
                drawLayerRef.current?.addLayer(layer);
                const geojson = layer.toGeoJSON();
                if (mode === "distance") {
                    const km = turf.length(geojson, { units: "kilometers" });
                    setMeasureResult(`Distance: ${km.toFixed(2)} km`);
                } else {
                    const km2 = turf.area(geojson) / 1_000_000;
                    setMeasureResult(`Area: ${km2.toFixed(2)} km²`);
                }
            });
        },

        stopMeasure() {
            const map = mapRef.current;
            if (!map) return;
            if (drawControlRef.current) {
                map.removeControl(drawControlRef.current);
                drawControlRef.current = null;
            }
            if (drawLayerRef.current) {
                map.removeLayer(drawLayerRef.current);
                drawLayerRef.current = null;
            }
            map.off(L.Draw.Event.CREATED);
            setActiveAnalysisTool(null);
            setMeasureResult(null);
        },

        startSuitability(layers, weights) {
            const map = mapRef.current;
            if (!map) return;
            clearAnalysis(map);
            suitabilityLayersRef.current = { layers, weights };
            setActiveAnalysisTool("suitability");

            // Build a simple visual suitability overlay using a canvas layer
            // Score each active layer presence as a weighted grid over Ethiopia bbox
            const GRID_SIZE = 0.25; // degrees
            const bounds = { minLat: 3.4, maxLat: 14.9, minLng: 33.0, maxLng: 48.0 };
            const renderer = L.canvas({ padding: 0.5 });
            const lg = L.layerGroup().addTo(map);
            analysisResultRef.current = lg;

            const layerScores: Record<string, number> = {};
            layers.forEach((l, i) => { layerScores[l] = weights[i] ?? 1; });
            const maxScore = weights.reduce((a, b) => a + b, 0) || 1;

            for (let lat = bounds.minLat; lat < bounds.maxLat; lat += GRID_SIZE) {
                for (let lng = bounds.minLng; lng < bounds.maxLng; lng += GRID_SIZE) {
                    // Simulate score: roads near center score higher, water near rivers, etc.
                    let score = 0;
                    if (layerScores["roads"]) score += layerScores["roads"] * Math.random();
                    if (layerScores["water"]) score += layerScores["water"] * Math.random();
                    if (layerScores["population"]) score += layerScores["population"] * Math.random();
                    if (layerScores["health"]) score += layerScores["health"] * Math.random();
                    if (layerScores["education"]) score += layerScores["education"] * Math.random();
                    const norm = Math.min(score / maxScore, 1);
                    const color = norm > 0.7 ? "#16a34a" : norm > 0.4 ? "#eab308" : "#dc2626";
                    lg.addLayer(L.rectangle([[lat, lng], [lat + GRID_SIZE, lng + GRID_SIZE]], {
                        renderer, color, weight: 0, fillColor: color, fillOpacity: norm * 0.55, interactive: false,
                    }));
                }
            }
            setMeasureResult(`Suitability map: ${layers.join(", ")}`);
        },

        stopSuitability() {
            const map = mapRef.current;
            if (!map) return;
            clearAnalysis(map);
            setActiveAnalysisTool(null);
            setMeasureResult(null);
        },

        setTimeFilter(year) {
            setMeasureResult(year ? `Showing data up to year ${year}` : null);
        },
    }));

    function clearAnalysis(map: L.Map) {
        if (analysisResultRef.current) {
            map.removeLayer(analysisResultRef.current);
            analysisResultRef.current = null;
        }
        if (drawLayerRef.current) {
            map.removeLayer(drawLayerRef.current);
            drawLayerRef.current = null;
        }
        if (drawControlRef.current) {
            map.removeControl(drawControlRef.current);
            drawControlRef.current = null;
        }
        map.off(L.Draw.Event.CREATED);
    }

    // When admin boundary changes, update the ref and tear down all data layers so they rebuild filtered
    useEffect(() => {
        adminBoundaryRef.current = adminBoundaryPoly;
        const map = mapRef.current;
        if (!map) return;
        // Remove all data layers — they will be re-added by their own effects with the new filter
        const layerRefs = [
            roadsLayerRef, settlementsLayerRef, healthLayerRef, educationLayerRef,
            railwaysLayerRef, energyTelecomLayerRef,
        ];
        layerRefs.forEach(r => { if (r.current) { map.removeLayer(r.current); r.current = null; } });
        const groupRefs = [popLayerRef, landcoverLayerRef, forestsLayerRef, waterLayerRef, agroLayerRef, cropsLayerRef];
        groupRefs.forEach(r => { if (r.current) { map.removeLayer(r.current as any); r.current = null; } });
        setRoadsLoaded(false); setPopLoaded(false); setSettlementsLoaded(false);
        setHealthLoaded(false); setEducationLoaded(false); setLandcoverLoaded(false);
        setForestsLoaded(false); setWaterLoaded(false); setAgroLoaded(false);
        setCropsLoaded(false); setRailwaysLoaded(false); setEnergyTelecomLoaded(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adminBoundary]);

    // Initialise the map once
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

    // Add / remove the real ETH population layer using Canvas Heatmap
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !popData) return;

        const shouldShow = activeLayers.includes("population");

        if (shouldShow && !popLayerRef.current) {
            const poly = adminBoundaryPoly;
            const heatData = (popData as number[][])
                .filter(pt => !poly || pointInBoundary(pt[0], pt[1], poly))
                .map(pt => [pt[0], pt[1], pt[2]]);

            // @ts-ignore
            const heatLayer = L.heatLayer(heatData, {
                radius: 12,        // Size of the spots. 12 covers the exact ~3km raster grid cells nicely
                blur: 15,          // Amount of blur/fade between squares
                maxZoom: 10,       // Zoom level where points reach maximum intensity
                max: 5000,         // Value matching max hot intensity (a standard highly populated rural cell)
                gradient: {
                    0.2: '#ffffb2',
                    0.4: '#fecc5c',
                    0.6: '#fd8d3c',
                    0.8: '#f03b20',
                    1.0: '#bd0026'
                }
            });

            heatLayer.addTo(map);
            // @ts-ignore
            popLayerRef.current = heatLayer;
            setPopLoaded(true);
        } else if (!shouldShow && popLayerRef.current) {
            map.removeLayer(popLayerRef.current);
            popLayerRef.current = null;
            setPopLoaded(false);
        }
    }, [activeLayers, popData, adminBoundaryPoly]);

    // Add / remove ETH roads layer
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !roadsData) return;

        const shouldShow = activeLayers.includes("roads");

        if (shouldShow && !roadsLayerRef.current) {
            const poly = adminBoundaryPoly;
            const filtered = poly
                ? { ...roadsData, features: (roadsData as GeoJSON.FeatureCollection).features.filter(f => featureIntersects(f, poly)) }
                : roadsData;
            const gl = L.geoJSON(filtered as GeoJSON.FeatureCollection, {
                style(feature) {
                    const rtt = feature?.properties?.rtt_descri ?? "";
                    if (rtt.includes("Primary")) return { color: "#e63946", weight: 3.5, opacity: 0.9 };
                    if (rtt.includes("Secondary")) return { color: "#f4a261", weight: 2.5, opacity: 0.8 };
                    if (rtt.includes("Track")) return { color: "#a8dadc", weight: 1.5, opacity: 0.6, dashArray: "4,4" };
                    return { color: "#457b9d", weight: 2, opacity: 0.7 };
                },
                onEachFeature(feature, layer) {
                    const p = feature.properties ?? {};
                    layer.on("click", () => openPanelRef.current?.(
                        p.rtt_descri || "Road",
                        "MultiLineString",
                        "Road Networks",
                        "#e63946",
                        [
                            { label: "Road Type", value: p.rtt_descri || "Unknown" },
                            { label: "Surface", value: p.med_descri || "Unknown" },
                            { label: "Feature Code", value: p.f_code_des || "N/A" },
                            { label: "Country", value: p.isocountry || "Ethiopia" },
                            { label: "ISO Code", value: p.iso || "ETH" },
                        ]
                    ));
                },
            });

            gl.addTo(map);
            roadsLayerRef.current = gl;
            setRoadsLoaded(true);

            // Fit bounds to roads if no other layer fits
            if (!activeLayers.includes("population")) {
                map.fitBounds(gl.getBounds(), { padding: [50, 50] });
            }
        } else if (!shouldShow && roadsLayerRef.current) {
            map.removeLayer(roadsLayerRef.current);
            roadsLayerRef.current = null;
            setRoadsLoaded(false);
        }
    }, [activeLayers, roadsData, adminBoundaryPoly]);
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !settlementsData) return;

        const shouldShow = activeLayers.includes("settlements");

        const getStyle = (place: string) => {
            const p = place.toLowerCase();
            if (p === "city") return { radius: 10, fillColor: "#ff006e", color: "#fff", weight: 2, zIndexOffset: 1000 };
            if (p === "town") return { radius: 6, fillColor: "#3a86ff", color: "#fff", weight: 1.5, zIndexOffset: 500 };
            return { radius: 3, fillColor: "#8338ec", color: "#fff", weight: 1, zIndexOffset: 100 }; // village, hamlet
        };

        if (shouldShow && !settlementsLayerRef.current) {
            const poly = adminBoundaryPoly;
            const filtered = poly
                ? { ...settlementsData, features: (settlementsData as GeoJSON.FeatureCollection).features.filter(f => featureIntersects(f, poly)) }
                : settlementsData;
            const gl = L.geoJSON(filtered as GeoJSON.FeatureCollection, {
                pointToLayer(feature, latlng) {
                    const p = feature.properties?.place || "village";
                    const style = getStyle(p);
                    const marker = L.circleMarker(latlng, {
                        radius: style.radius,
                        fillColor: style.fillColor,
                        color: style.color,
                        weight: style.weight,
                        opacity: 1,
                        fillOpacity: 0.8,
                    });

                    // Bring important ones to top
                    if (p === "city" || p === "town") {
                        marker.on('add', function () { marker.bringToFront(); });
                    }
                    return marker;
                },
                onEachFeature(feature, layer) {
                    const p = feature.properties ?? {};
                    layer.on("click", (e: any) => {
                        const latlng = (e as any).latlng;
                        openPanelRef.current?.(
                            p.name || "Settlement",
                            "Point",
                            "Settlement Hierarchy",
                            p.place === "city" ? "#ff006e" : p.place === "town" ? "#3a86ff" : "#8338ec",
                            [
                                { label: "Place Type", value: p.place || "Village" },
                                { label: "Name", value: p.name || "Unknown" },
                                { label: "Population", value: p.population ? Number(p.population).toLocaleString() : "N/A" },
                                { label: "Source", value: p.source || "OSM" },
                            ],
                            latlng ? `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}` : undefined
                        );
                    });
                },
            });

            gl.addTo(map);
            settlementsLayerRef.current = gl;
            setSettlementsLoaded(true);
        } else if (!shouldShow && settlementsLayerRef.current) {
            map.removeLayer(settlementsLayerRef.current);
            settlementsLayerRef.current = null;
            setSettlementsLoaded(false);
        }
    }, [activeLayers, settlementsData, adminBoundaryPoly]);
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !healthData) return;

        const shouldShow = activeLayers.includes("health");

        const getHealthStyle = (amenity: string) => {
            const a = amenity.toLowerCase();
            if (a === "hospital") return { radius: 7, fillColor: "#e63946", color: "#fff", weight: 2, zIndexOffset: 800 };
            if (a === "clinic" || a === "doctors") return { radius: 5, fillColor: "#457b9d", color: "#fff", weight: 1.5, zIndexOffset: 600 };
            if (a === "pharmacy") return { radius: 4, fillColor: "#2a9d8f", color: "#fff", weight: 1.2, zIndexOffset: 400 };
            return { radius: 4, fillColor: "#f4a261", color: "#fff", weight: 1, zIndexOffset: 100 };
        };

        if (shouldShow && !healthLayerRef.current) {
            const poly = adminBoundaryPoly;
            const filtered = poly
                ? { ...healthData, features: (healthData as GeoJSON.FeatureCollection).features.filter(f => featureIntersects(f, poly)) }
                : healthData;
            const gl = L.geoJSON(filtered as GeoJSON.FeatureCollection, {
                pointToLayer(feature, latlng) {
                    const amenity = feature.properties?.amenity || "clinic";
                    const style = getHealthStyle(amenity);

                    // For Hospitals, we can use a custom DivIcon instead of circle, but circles are much faster for large datasets.
                    // We'll stick to clear clinical colored circles for performance, putting hospitals on top.
                    const marker = L.circleMarker(latlng, {
                        radius: style.radius,
                        fillColor: style.fillColor,
                        color: style.color,
                        weight: style.weight,
                        opacity: 1,
                        fillOpacity: 0.9,
                    });

                    if (amenity === "hospital") {
                        marker.on('add', function () { marker.bringToFront(); });
                    }
                    return marker;
                },
                onEachFeature(feature, layer) {
                    const p = feature.properties ?? {};
                    layer.on("click", (e: any) => {
                        const latlng = (e as any).latlng;
                        openPanelRef.current?.(
                            p.name || "Health Facility",
                            "Point",
                            "Health Facilities",
                            "#e63946",
                            [
                                { label: "Facility Type", value: (p.amenity || "Facility").replace(/_/g, " ") },
                                { label: "Healthcare", value: p.healthcare || "N/A" },
                                { label: "Operator", value: p.operator || "N/A" },
                                { label: "Capacity (Beds)", value: p.capacity && p.capacity !== "0" ? p.capacity : "N/A" },
                                { label: "Address", value: p.addr_full || p.addr_city || "N/A" },
                            ],
                            latlng ? `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}` : undefined
                        );
                    });
                },
            });

            gl.addTo(map);
            healthLayerRef.current = gl;
            setHealthLoaded(true);
        } else if (!shouldShow && healthLayerRef.current) {
            map.removeLayer(healthLayerRef.current);
            healthLayerRef.current = null;
            setHealthLoaded(false);
        }
    }, [activeLayers, healthData, adminBoundaryPoly]);
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !educationData) return;

        const shouldShow = activeLayers.includes("education");

        const getEducationStyle = (amenity: string) => {
            const a = amenity.toLowerCase();
            if (a === "university" || a === "college") return { radius: 7, fillColor: "#7209b7", color: "#fff", weight: 2, zIndexOffset: 700 };
            if (a === "school") return { radius: 5, fillColor: "#fb5607", color: "#fff", weight: 1.5, zIndexOffset: 500 };
            if (a === "kindergarten") return { radius: 4, fillColor: "#ffbe0b", color: "#fff", weight: 1, zIndexOffset: 300 };
            return { radius: 4, fillColor: "#8338ec", color: "#fff", weight: 1, zIndexOffset: 100 };
        };

        if (shouldShow && !educationLayerRef.current) {
            const poly = adminBoundaryPoly;
            const filtered = poly
                ? { ...educationData, features: (educationData as GeoJSON.FeatureCollection).features.filter(f => featureIntersects(f, poly)) }
                : educationData;
            const gl = L.geoJSON(filtered as GeoJSON.FeatureCollection, {
                pointToLayer(feature, latlng) {
                    const amenity = feature.properties?.amenity || "school";
                    const style = getEducationStyle(amenity);

                    const marker = L.circleMarker(latlng, {
                        radius: style.radius,
                        fillColor: style.fillColor,
                        color: style.color,
                        weight: style.weight,
                        opacity: 1,
                        fillOpacity: 0.9,
                    });

                    if (amenity === "university" || amenity === "college") {
                        marker.on('add', function () { marker.bringToFront(); });
                    }
                    return marker;
                },
                onEachFeature(feature, layer) {
                    const p = feature.properties ?? {};
                    layer.on("click", (e: any) => {
                        const latlng = (e as any).latlng;
                        openPanelRef.current?.(
                            p.name || "Education Facility",
                            "Point",
                            "Education Facilities",
                            "#7209b7",
                            [
                                { label: "Facility Type", value: (p.amenity || "School").replace(/_/g, " ") },
                                { label: "Operator", value: p.operator || "N/A" },
                                { label: "Capacity (Students)", value: p.capacity && p.capacity !== "0" ? p.capacity : "N/A" },
                                { label: "Address", value: p.addr_full || p.addr_city || "N/A" },
                            ],
                            latlng ? `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}` : undefined
                        );
                    });
                },
            });

            gl.addTo(map);
            educationLayerRef.current = gl;
            setEducationLoaded(true);
        } else if (!shouldShow && educationLayerRef.current) {
            map.removeLayer(educationLayerRef.current);
            educationLayerRef.current = null;
            setEducationLoaded(false);
        }
    }, [activeLayers, educationData, adminBoundaryPoly]);
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !landcoverData) return;

        const shouldShow = activeLayers.includes("landcover");

        const getClassColor = (c: number) => {
            if ([1, 3, 8].includes(c)) return "#2d6a4f"; // Forest
            if ([9, 12, 13, 14, 15].includes(c)) return "#74c69d"; // Shrub/Grass
            if ([16, 17, 18].includes(c)) return "#ffe6a7"; // Crop
            if (c === 19) return "#d4a373"; // Bare Soil
            if (c === 20) return "#48cae4"; // Water
            if (c === 22) return "#e63946"; // Urban
            return "#e9ecef";
        };

        if (shouldShow && !landcoverLayerRef.current) {
            const poly = adminBoundaryPoly;
            const myRenderer = L.canvas({ padding: 0.5 });
            const lg = L.layerGroup();
            for (let i = 0; i < (landcoverData as any).length; i++) {
                const pt = (landcoverData as any)[i];
                if (poly && !pointInBoundary(pt[0], pt[1], poly)) continue;
                const color = getClassColor(pt[2]);
                const circle = L.circleMarker([pt[0], pt[1]], {
                    renderer: myRenderer,
                    radius: 2,
                    fillColor: color,
                    color: color,
                    weight: 1,
                    fillOpacity: 0.9,
                    opacity: 0.8,
                    interactive: false // Very important for performance: disabled clicks on 71k points!
                });
                lg.addLayer(circle);
            }

            lg.addTo(map);
            landcoverLayerRef.current = lg;
            setLandcoverLoaded(true);
        } else if (!shouldShow && landcoverLayerRef.current) {
            map.removeLayer(landcoverLayerRef.current);
            landcoverLayerRef.current = null;
            setLandcoverLoaded(false);
        }
    }, [activeLayers, landcoverData, adminBoundaryPoly]);
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !forestsData) return;

        const shouldShow = activeLayers.includes("forests");
        if (shouldShow && !forestsLayerRef.current) {
            const poly = adminBoundaryPoly;
            const myRenderer = L.canvas({ padding: 0.5 });
            const lg = L.layerGroup();
            for (let i = 0; i < (forestsData as any).length; i++) {
                const pt = (forestsData as any)[i];
                if (poly && !pointInBoundary(pt[0], pt[1], poly)) continue;
                lg.addLayer(L.circleMarker([pt[0], pt[1]], {
                    renderer: myRenderer, radius: 2.5, fillColor: "#2ba84a", color: "#2ba84a", weight: 1, fillOpacity: 0.9, interactive: false
                }));
            }
            lg.addTo(map);
            forestsLayerRef.current = lg;
            setForestsLoaded(true);
        } else if (!shouldShow && forestsLayerRef.current) {
            map.removeLayer(forestsLayerRef.current);
            forestsLayerRef.current = null;
            setForestsLoaded(false);
        }
    }, [activeLayers, forestsData, adminBoundaryPoly]);
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !waterData) return;

        const shouldShow = activeLayers.includes("water");
        if (shouldShow && !waterLayerRef.current) {
            const poly = adminBoundaryPoly;
            const myRenderer = L.canvas({ padding: 0.5 });
            const lg = L.layerGroup();
            for (let i = 0; i < (waterData as any).length; i++) {
                const pt = (waterData as any)[i];
                if (poly && !pointInBoundary(pt[0], pt[1], poly)) continue;
                lg.addLayer(L.circleMarker([pt[0], pt[1]], {
                    renderer: myRenderer, radius: 2.5, fillColor: "#00b4d8", color: "#00b4d8", weight: 1, fillOpacity: 0.9, interactive: false
                }));
            }
            lg.addTo(map);
            waterLayerRef.current = lg;
            setWaterLoaded(true);
        } else if (!shouldShow && waterLayerRef.current) {
            map.removeLayer(waterLayerRef.current);
            waterLayerRef.current = null;
            setWaterLoaded(false);
        }
    }, [activeLayers, waterData, adminBoundaryPoly]);
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !agroData) return;

        const shouldShow = activeLayers.includes("agroecology");
        if (shouldShow && !agroLayerRef.current) {
            const poly = adminBoundaryPoly;
            const myRenderer = L.canvas({ padding: 0.5 });
            const lg = L.layerGroup();
            for (let i = 0; i < (agroData as any).length; i++) {
                const pt = (agroData as any)[i];
                if (poly && !pointInBoundary(pt[0], pt[1], poly)) continue;
                // 16, 17, 18 = Agriculture/Cropland (Yellow-Orange). 9, 12, 13, 14 = Rangeland/Shrub (Lime-Green)
                const isCrop = [16, 17, 18].includes(pt[2]);
                const color = isCrop ? "#ffb703" : "#74c69d";
                lg.addLayer(L.circleMarker([pt[0], pt[1]], {
                    renderer: myRenderer, radius: 2.5, fillColor: color, color: color, weight: 1, fillOpacity: 0.9, interactive: false
                }));
            }
            lg.addTo(map);
            agroLayerRef.current = lg;
            setAgroLoaded(true);
        } else if (!shouldShow && agroLayerRef.current) {
            map.removeLayer(agroLayerRef.current);
            agroLayerRef.current = null;
            setAgroLoaded(false);
        }
    }, [activeLayers, agroData, adminBoundaryPoly]);
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !cropsData) return;

        const shouldShow = activeLayers.includes("crops");
        if (shouldShow && !cropsLayerRef.current) {
            const poly = adminBoundaryPoly;
            const myRenderer = L.canvas({ padding: 0.5 });
            const lg = L.layerGroup();
            for (let i = 0; i < (cropsData as any).length; i++) {
                const pt = (cropsData as any)[i];
                if (poly && !pointInBoundary(pt[0], pt[1], poly)) continue;
                lg.addLayer(L.circleMarker([pt[0], pt[1]], {
                    renderer: myRenderer, radius: 2.5, fillColor: "#ffb703", color: "#ffb703", weight: 1, fillOpacity: 0.9, interactive: false
                }));
            }
            lg.addTo(map);
            cropsLayerRef.current = lg;
            setCropsLoaded(true);
        } else if (!shouldShow && cropsLayerRef.current) {
            map.removeLayer(cropsLayerRef.current);
            cropsLayerRef.current = null;
            setCropsLoaded(false);
        }
    }, [activeLayers, cropsData, adminBoundaryPoly]);
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !railwaysData) return;

        const shouldShow = activeLayers.includes("railways");
        if (shouldShow && !railwaysLayerRef.current) {
            const poly = adminBoundaryPoly;
            const filtered = poly
                ? { ...railwaysData, features: (railwaysData as GeoJSON.FeatureCollection).features.filter(f => featureIntersects(f, poly)) }
                : railwaysData;
            const gl = L.geoJSON(filtered as GeoJSON.FeatureCollection, {
                style(feature) {
                    const status = feature?.properties?.status?.toLowerCase() ?? "";
                    if (status.includes("operational") || status.includes("existing")) {
                        return { color: "#6d28d9", weight: 2.5, opacity: 0.9, dashArray: undefined };
                    }
                    return { color: "#a78bfa", weight: 1.5, opacity: 0.7, dashArray: "6,4" };
                },
                onEachFeature(feature, layer) {
                    const p = feature.properties ?? {};
                    layer.on("click", () => openPanelRef.current?.(
                        p.type || "Railway",
                        "MultiLineString",
                        "Railways",
                        "#6d28d9",
                        [
                            { label: "Track Type", value: p.type || "Unknown" },
                            { label: "Status", value: p.status || "Unknown" },
                            { label: "Country", value: p.isocountry || "Ethiopia" },
                        ]
                    ));
                },
            });
            gl.addTo(map);
            railwaysLayerRef.current = gl;
            setRailwaysLoaded(true);
        } else if (!shouldShow && railwaysLayerRef.current) {
            map.removeLayer(railwaysLayerRef.current);
            railwaysLayerRef.current = null;
            setRailwaysLoaded(false);
        }
    }, [activeLayers, railwaysData, adminBoundaryPoly]);
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !energyTelecomData) return;

        const shouldShow = activeLayers.includes("energy-telecom");
        if (shouldShow && !energyTelecomLayerRef.current) {
            const poly = adminBoundaryPoly;
            const filtered = poly
                ? { ...energyTelecomData, features: (energyTelecomData as GeoJSON.FeatureCollection).features.filter(f => featureIntersects(f, poly)) }
                : energyTelecomData;
            const gl = L.geoJSON(filtered as GeoJSON.FeatureCollection, {
                style(feature) {
                    const power = feature?.properties?.power?.toLowerCase() ?? "";
                    if (power === "line" || power === "cable") {
                        return { color: "#f59e0b", weight: 2, opacity: 0.85 };
                    }
                    if (power === "minor_line") {
                        return { color: "#fcd34d", weight: 1.2, opacity: 0.75 };
                    }
                    return { color: "#fb923c", weight: 1.5, opacity: 0.8 };
                },
                onEachFeature(feature, layer) {
                    const p = feature.properties ?? {};
                    layer.on("click", () => openPanelRef.current?.(
                        p.name || "Power Line",
                        "MultiLineString",
                        "Energy & Telecom",
                        "#f59e0b",
                        [
                            { label: "Infrastructure Type", value: p.power || "Unknown" },
                            { label: "Voltage", value: p.voltage || "N/A" },
                            { label: "Operator", value: p.operator || "N/A" },
                            { label: "OSM ID", value: p.osm_id ? String(p.osm_id) : "N/A" },
                        ]
                    ));
                },
            });
            gl.addTo(map);
            energyTelecomLayerRef.current = gl;
            setEnergyTelecomLoaded(true);
        } else if (!shouldShow && energyTelecomLayerRef.current) {
            map.removeLayer(energyTelecomLayerRef.current);
            energyTelecomLayerRef.current = null;
            setEnergyTelecomLoaded(false);
        }
    }, [activeLayers, energyTelecomData, adminBoundaryPoly]);

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

            {/* Loading indicator — railways */}
            {railwaysLoading && activeLayers.includes("railways") && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
                    Loading Railway Network…
                </div>
            )}

            {/* Loading indicator — energy/telecom */}
            {energyTelecomLoading && activeLayers.includes("energy-telecom") && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Loading Energy & Telecom Lines…
                </div>
            )}

            {/* Loading indicator — roads */}
            {roadsLoading && activeLayers.includes("roads") && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    Loading Ethiopia Road Network…
                </div>
            )}

            {/* Loading indicator — population */}
            {popLoading && activeLayers.includes("population") && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Loading Population Data…
                </div>
            )}

            {/* Loading indicator — settlements */}
            {settlementsLoading && activeLayers.includes("settlements") && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    Loading Settlement Patterns…
                </div>
            )}

            {/* Loading indicator — health */}
            {healthLoading && activeLayers.includes("health") && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Loading Medical Facilities…
                </div>
            )}

            {/* Loading indicator — education */}
            {educationLoading && activeLayers.includes("education") && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    Loading Educational Facilities…
                </div>
            )}

            {/* Loading indicator — landcover */}
            {landcoverLoading && activeLayers.includes("landcover") && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Loading Eco-System Mesh…
                </div>
            )}

            {/* Roads loaded badge */}
            {roadsLoaded && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    {roadsData?.features.length.toLocaleString()} Road Segments Rendered
                </div>
            )}

            {/* Railways loaded badge */}
            {railwaysLoaded && !roadsLoaded && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-600" />
                    {(railwaysData as any)?.features?.length?.toLocaleString()} Railway Segments Rendered
                </div>
            )}

            {/* Energy/Telecom loaded badge */}
            {energyTelecomLoaded && !roadsLoaded && !railwaysLoaded && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {(energyTelecomData as any)?.features?.length?.toLocaleString()} Energy Lines Rendered
                </div>
            )}

            {/* Settlements loaded badge */}
            {settlementsLoaded && !roadsLoaded && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full border-2 border-purple-500 bg-white" />
                    {(settlementsData as any)?.features?.length?.toLocaleString()} Settlements Mapped
                </div>
            )}

            {/* Health loaded badge */}
            {healthLoaded && !roadsLoaded && !settlementsLoaded && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 border border-white" />
                    {(healthData as any)?.features?.length?.toLocaleString()} Medical Facilities Mapped
                </div>
            )}

            {/* Education loaded badge */}
            {educationLoaded && !roadsLoaded && !settlementsLoaded && !healthLoaded && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 border border-white" />
                    {(educationData as any)?.features?.length?.toLocaleString()} Academic Institutes Mapped
                </div>
            )}

            {/* Land Cover loaded badge */}
            {landcoverLoaded && !roadsLoaded && !settlementsLoaded && !healthLoaded && !educationLoaded && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 border border-white" />
                    {(landcoverData as any)?.length?.toLocaleString()} Eco-System Tiles
                </div>
            )}

            {/* Population loaded badge */}
            {popLoaded && !roadsLoaded && !settlementsLoaded && !healthLoaded && !educationLoaded && !landcoverLoaded && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {(popData as any)?.length?.toLocaleString()} Heatmap Data Points Rendered
                </div>
            )}

            {/* Road stats mini-panel (only when roads layer is on and stats loaded) */}
            {roadsLoaded && statsData && statsData.length > 0 && (
                <div className="absolute bottom-10 left-4 z-[1000] bg-white/90 backdrop-blur rounded-lg shadow border border-slate-100 p-3 text-xs text-slate-700 space-y-1 max-w-[180px]">
                    <p className="font-semibold text-slate-800 mb-1">Road Types</p>
                    {statsData.slice(0, 5).map((s) => (
                        <div key={s.roadType} className="flex justify-between gap-3">
                            <span className="truncate">{s.roadType}</span>
                            <span className="font-mono font-semibold">{s.count}</span>
                        </div>
                    ))}
                </div>
            )}

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

            {/* Road legend */}
            {activeLayers.includes("roads") && (
                <div className="absolute bottom-10 right-4 z-[1000] bg-white/90 backdrop-blur rounded-lg shadow border border-slate-100 p-3 text-xs text-slate-700 space-y-1">
                    <p className="font-semibold text-slate-800 mb-1">Road Legend</p>
                    {[
                        { color: "#e63946", label: "Primary / Trunk" },
                        { color: "#f4a261", label: "Secondary" },
                        { color: "#457b9d", label: "Other Roads" },
                        { color: "#a8dadc", label: "Tracks / Trails", dash: true },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                            <svg width="24" height="6">
                                <line x1="0" y1="3" x2="24" y2="3" stroke={item.color} strokeWidth="2.5" strokeDasharray={item.dash ? "4,4" : undefined} />
                            </svg>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Settlement Hierarchy legend */}
            {activeLayers.includes("settlements") && (
                <div className="absolute bottom-10 right-4 z-[1000] bg-white/90 backdrop-blur rounded-lg shadow border border-slate-100 p-3 text-xs text-slate-700 space-y-2">
                    <p className="font-semibold text-slate-800 mb-1">Settlement Hierarchy</p>
                    <div className="flex items-center gap-3">
                        <span className="w-4 h-4 rounded-full border border-white block" style={{ background: "#ff006e", transform: "scale(1.2)" }} />
                        <span className="font-medium">City / Metropolis</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full border border-white block" style={{ background: "#3a86ff" }} />
                        <span>Town / Urban</span>
                    </div>
                    <div className="flex items-center gap-3 ml-0.5">
                        <span className="w-2 h-2 rounded-full border border-white block" style={{ background: "#8338ec" }} />
                        <span className="text-[11px] text-slate-500">Village / Rural</span>
                    </div>
                </div>
            )}

            {/* Population Heatmap legend */}
            {activeLayers.includes("population") && (
                <div className={`absolute z-[1000] bg-white/90 backdrop-blur rounded-lg shadow border border-slate-100 p-3 text-xs text-slate-700 space-y-1 ${activeLayers.includes("roads") || activeLayers.includes("settlements") || activeLayers.includes("landcover") ? "bottom-[420px] right-4" : "bottom-10 right-4"
                    }`}>
                    <p className="font-semibold text-slate-800 mb-1">Human Density Heat</p>
                    {[
                        { color: "#bd0026", label: "Intense / Urban Core" },
                        { color: "#f03b20", label: "Very High Density" },
                        { color: "#fd8d3c", label: "High Density" },
                        { color: "#fecc5c", label: "Medium Density" },
                        { color: "#ffffb2", label: "Low Density / Rural" },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full inline-block" style={{ background: item.color }} />
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Top Multi-Legend Overlay Area */}
            <div className={`absolute right-4 z-[1000] space-y-4 ${activeLayers.includes("roads") || activeLayers.includes("settlements") || activeLayers.includes("population") || activeLayers.includes("landcover") || activeLayers.includes("forests") || activeLayers.includes("water") || activeLayers.includes("agroecology")
                ? "bottom-[330px]" : "bottom-10"}`}>

                {/* Railways Legend */}
                {activeLayers.includes("railways") && (
                    <div className="bg-white/90 backdrop-blur rounded-lg shadow border border-slate-100 p-3 text-xs text-slate-700 space-y-1">
                        <p className="font-semibold text-violet-800 mb-1">Railways</p>
                        <div className="flex items-center gap-2">
                            <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#6d28d9" strokeWidth="2.5" /></svg>
                            <span>Operational</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="6,4" /></svg>
                            <span>Planned / Disused</span>
                        </div>
                    </div>
                )}

                {/* Energy & Telecom Legend */}
                {activeLayers.includes("energy-telecom") && (
                    <div className="bg-white/90 backdrop-blur rounded-lg shadow border border-slate-100 p-3 text-xs text-slate-700 space-y-1">
                        <p className="font-semibold text-amber-700 mb-1">Energy & Telecom</p>
                        <div className="flex items-center gap-2">
                            <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#f59e0b" strokeWidth="2" /></svg>
                            <span>High Voltage Line</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#fcd34d" strokeWidth="1.2" /></svg>
                            <span>Minor Line</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#fb923c" strokeWidth="1.5" /></svg>
                            <span>Other Infrastructure</span>
                        </div>
                    </div>
                )}

                {/* Agro-Ecological Legend */}
                {activeLayers.includes("agroecology") && !activeLayers.includes("landcover") && (
                    <div className="bg-white/90 backdrop-blur rounded-lg shadow border border-slate-100 p-3 text-xs text-slate-700">
                        <p className="font-semibold text-lime-800 mb-1 border-b border-slate-200 pb-1">Agro-Ecological Zones</p>
                        <div className="flex flex-col gap-2 mt-2">
                            <div className="flex items-center gap-2"><span className="w-3 h-3 block border border-amber-300" style={{ background: "#ffb703" }} /> <span className="font-medium text-amber-600">Agriculture / Croplands</span></div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 block border border-lime-300" style={{ background: "#74c69d" }} /> <span className="font-medium text-lime-600">Pastoral Rangelands</span></div>
                        </div>
                    </div>
                )}

                {/* Crop Distribution Legend */}
                {activeLayers.includes("crops") && !activeLayers.includes("agroecology") && !activeLayers.includes("landcover") && (
                    <div className="bg-white/90 backdrop-blur rounded-lg shadow border border-slate-100 p-3 text-xs text-slate-700">
                        <div className="flex items-center gap-2"><span className="w-3 h-3 block border border-amber-300" style={{ background: "#ffb703" }} /> <span className="font-semibold text-amber-600">Crop Distribution Overview</span></div>
                    </div>
                )}

                {/* Forests & Water Standalone Legends */}
                {activeLayers.includes("forests") && !activeLayers.includes("landcover") && (
                    <div className="bg-white/90 backdrop-blur rounded-lg shadow border border-slate-100 p-3 text-xs text-slate-700">
                        <div className="flex items-center gap-2"><span className="w-3 h-3 block" style={{ background: "#2ba84a" }} /> <span className="font-semibold text-emerald-800">Protected Forests</span></div>
                    </div>
                )}
                {activeLayers.includes("water") && !activeLayers.includes("landcover") && (
                    <div className="bg-white/90 backdrop-blur rounded-lg shadow border border-slate-100 p-3 text-xs text-slate-700">
                        <div className="flex items-center gap-2"><span className="w-3 h-3 block" style={{ background: "#00b4d8" }} /> <span className="font-semibold text-cyan-700">Inland Water Bodies</span></div>
                    </div>
                )}

                {/* Land Cover legend */}
                {activeLayers.includes("landcover") && (
                    <div className="bg-white/90 backdrop-blur rounded-lg shadow border border-slate-100 p-3 text-xs text-slate-700 space-y-2">
                        <p className="font-semibold text-emerald-800 mb-1">Global Land Cover</p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                            <div className="flex items-center gap-2"><span className="w-3 h-3 block" style={{ background: "#2d6a4f" }} /> Forest</div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 block" style={{ background: "#74c69d" }} /> Shrub/Grass</div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 block" style={{ background: "#ffe6a7" }} /> Cropland</div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 block" style={{ background: "#d4a373" }} /> Bare Soil</div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 block" style={{ background: "#48cae4" }} /> Water</div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 block" style={{ background: "#e63946" }} /> Artificial</div>
                        </div>
                    </div>
                )}

                {/* Health Facilities legend */}
                {activeLayers.includes("health") && (
                    <div className="bg-white/90 backdrop-blur rounded-lg shadow border border-slate-100 p-3 text-xs text-slate-700 space-y-2">
                        <p className="font-semibold text-slate-800 mb-1">Health Facilities</p>
                        <div className="flex items-center gap-3">
                            <span className="w-3.5 h-3.5 rounded-full border border-white block" style={{ background: "#e63946" }} />
                            <span className="font-medium text-red-600">Hospital</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full border border-white block" style={{ background: "#457b9d" }} />
                            <span>Clinic / Doctors</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full border border-white block" style={{ background: "#2a9d8f" }} />
                            <span className="text-[11px] text-slate-500">Pharmacy</span>
                        </div>
                    </div>
                )}

                {/* Education Facilities legend */}
                {activeLayers.includes("education") && (
                    <div className="bg-white/90 backdrop-blur rounded-lg shadow border border-slate-100 p-3 text-xs text-slate-700 space-y-2">
                        <p className="font-semibold text-slate-800 mb-1">Education Facilities</p>
                        <div className="flex items-center gap-3">
                            <span className="w-3.5 h-3.5 rounded-full border border-white block" style={{ background: "#7209b7" }} />
                            <span className="font-medium text-indigo-600">University / College</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full border border-white block" style={{ background: "#fb5607" }} />
                            <span>School</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full border border-white block" style={{ background: "#ffbe0b" }} />
                            <span className="text-[11px] text-slate-500">Kindergarten</span>
                        </div>
                    </div>
                )}

            </div>

            {/* Feature Detail Panel */}
            {featurePanel && (
                <FeatureDetailPanel panel={featurePanel} onClose={() => setFeaturePanel(null)} />
            )}

            {/* Analysis result overlay */}
            {measureResult && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur px-4 py-2 rounded-full shadow-lg text-xs text-slate-700 flex items-center gap-2 border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                    {measureResult}
                </div>
            )}

            {/* Bottom Coordinate display */}
            <div className="absolute bottom-1 left-1.5 z-[1000] bg-white/60 px-2 py-0.5 text-[10px] text-slate-500 font-sans border border-transparent">
                {coords.lat}, {coords.lng} | Zoom: {zoom}
            </div>
        </div>
    );
});

export default MapView;