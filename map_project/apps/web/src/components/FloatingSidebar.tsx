import { useState, useRef } from "react";
import {
    Bus,
    Bike,
    Footprints,
    PersonStanding,
    Search,
    MapPin,
    Plus,
    X,
    Menu,
    ChevronLeft,
    ChevronRight,
    Utensils,
    Hotel,
    Hospital,
    ShoppingBag,
    School,
    Building2,
    TreePine,
    Coffee,
    Fuel,
    Grid3x3,
    Layers,
    BarChart3,
    Database,
    Crosshair,
    Box,
    Ruler,
    Clock,
    Loader2
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { env } from "@map_project/env/web";

type TabMode = "search" | "route" | "admin" | "layers" | "analysis" | "data";

interface FloatingSidebarProps {
    activeLayers: string[];
    onToggleLayer: (layerId: string) => void;
    onLocateAdmin?: (bbox: [number, number, number, number], geojson: any, name: string) => void;
    onStartBuffer?: (radiusKm: number) => void;
    onStopBuffer?: () => void;
    onStartMeasure?: (mode: "distance" | "area") => void;
    onStopMeasure?: () => void;
    onStartSuitability?: (layers: string[], weights: number[]) => void;
    onStopSuitability?: () => void;
    onSetTimeFilter?: (year: number | null) => void;
}

export default function FloatingSidebar({ activeLayers, onToggleLayer, onLocateAdmin, onStartBuffer, onStopBuffer, onStartMeasure, onStopMeasure, onStartSuitability, onStopSuitability, onSetTimeFilter }: FloatingSidebarProps) {
    const [activeTab, setActiveTab] = useState<TabMode>("search");
    const [isOpen, setIsOpen] = useState(true);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="absolute top-4 left-4 z-[1000] floating-panel w-10 h-10 flex items-center justify-center hover:bg-slate-50"
            >
                <Menu className="w-5 h-5 text-slate-600" />
            </button>
        );
    }

    const tabs = [
        { id: "search", icon: Search },
        { id: "route", icon: Bus },
        { id: "admin", icon: Grid3x3 },
        { id: "layers", icon: Layers },
        { id: "analysis", icon: BarChart3 },
        { id: "data", icon: Database },
    ];

    return (
        <div className="absolute top-4 left-4 z-[1000] w-80 floating-panel flex flex-col max-h-[calc(100vh-2rem)]">
            {/* Header Tabs */}
            <div className="flex border-b border-slate-100">
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-3 border-r border-slate-100 hover:bg-slate-50 transition-colors"
                >
                    <Menu className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex flex-1 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabMode)}
                            className={`tab-button min-w-[40px] ${activeTab === tab.id ? "active" : "text-slate-400"}`}
                        >
                            <tab.icon className="w-4 h-4 mb-1" />
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === "search" && <SearchPanel />}
                {activeTab === "route" && <RoutingPanel />}
                {activeTab === "admin" && <AdminPanel onLocateAdmin={onLocateAdmin} />}
                {activeTab === "layers" && <ThematicLayersPanel activeLayers={activeLayers} onToggleLayer={onToggleLayer} />}
                {activeTab === "analysis" && <AnalysisPanel
                    onStartBuffer={onStartBuffer}
                    onStopBuffer={onStopBuffer}
                    onStartMeasure={onStartMeasure}
                    onStopMeasure={onStopMeasure}
                    onStartSuitability={onStartSuitability}
                    onStopSuitability={onStopSuitability}
                    onSetTimeFilter={onSetTimeFilter}
                    activeLayers={activeLayers}
                />}
                {activeTab === "data" && <DataPanel />}
            </div>
        </div>
    );
}

function SearchPanel() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-tighter">Global Search</h2>
            </div>
            <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-primary" />
                <input
                    type="text"
                    placeholder="Search places, coordinates, admin units..."
                    className="w-full pl-10 pr-4 py-2 text-sm border-b border-slate-200 focus:outline-none focus:border-primary placeholder:text-slate-400"
                />
            </div>

            <div className="space-y-4 pt-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nearby Quick Search</h3>
                <div className="grid grid-cols-4 gap-4">
                    {[Hospital, Hotel, Utensils, Fuel].map((Icon, i) => (
                        <button key={i} className="flex flex-col items-center gap-1 group">
                            <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-500 group-hover:border-primary group-hover:text-primary transition-all shadow-sm">
                                <Icon className="w-5 h-5" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function RoutingPanel() {
    return (
        <div className="space-y-6">
            <div className="flex gap-4 border-b border-slate-100 pb-2 mb-4">
                <button className="p-2 text-primary border-b-2 border-primary"><Bus className="w-4 h-4" /></button>
                <button className="p-2 text-slate-400 hover:text-primary"><Bike className="w-4 h-4" /></button>
                <button className="p-2 text-slate-400 hover:text-primary"><Footprints className="w-4 h-4" /></button>
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-primary" />
                    <input type="text" placeholder="Start location" className="w-full pl-10 pr-4 py-2 text-sm border-b border-slate-200 focus:outline-none focus:border-primary" />
                </div>
                <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-blue-400" />
                    <input type="text" placeholder="End location" className="w-full pl-10 pr-4 py-2 text-sm border-b border-slate-200 focus:outline-none focus:border-primary" />
                </div>
            </div>
            <button className="w-full py-2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded shadow-sm hover:opacity-90 transition-all">
                Find Route
            </button>
        </div>
    );
}

function AdminPanel({ onLocateAdmin }: { onLocateAdmin?: (bbox: [number, number, number, number], geojson: any, name: string) => void }) {
    const [regionPcode, setRegionPcode] = useState("");
    const [zonePcode, setZonePcode] = useState("");
    const [woredaPcode, setWoredaPcode] = useState("");
    const [locating, setLocating] = useState(false);

    const { data: regions, isLoading: regionsLoading } = useQuery(trpc.map.getRegions.queryOptions());
    const { data: zones, isLoading: zonesLoading } = useQuery(
        trpc.map.getZones.queryOptions({ regionPcode }, { enabled: !!regionPcode })
    );
    const { data: woredas, isLoading: woredasLoading } = useQuery(
        trpc.map.getWoredas.queryOptions({ zonePcode }, { enabled: !!zonePcode })
    );

    const selectedPcode = woredaPcode || zonePcode || regionPcode;
    const selectedLevel = woredaPcode ? 3 : zonePcode ? 2 : regionPcode ? 1 : 0;

    const handleLocate = async () => {
        if (!selectedPcode || !onLocateAdmin) return;
        setLocating(true);
        try {
            const input = encodeURIComponent(JSON.stringify({ level: selectedLevel, pcode: selectedPcode }));
            const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/trpc/map.getAdminBoundary?input=${input}`, {
                credentials: "include",
            });
            const json = await res.json();
            const data = json?.result?.data;
            if (data) onLocateAdmin(data.bbox, data.geojson, data.name);
        } finally {
            setLocating(false);
        }
    };

    return (
        <div className="space-y-5">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-tighter">Administrative Search</h2>

            {/* Region */}
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Region</label>
                <select
                    className="w-full bg-slate-50 border border-slate-100 rounded px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary"
                    value={regionPcode}
                    onChange={e => { setRegionPcode(e.target.value); setZonePcode(""); setWoredaPcode(""); }}
                >
                    <option value="">{regionsLoading ? "Loading..." : "Select Region"}</option>
                    {regions?.map(r => <option key={r.adm1_pcode} value={r.adm1_pcode}>{r.adm1_name}</option>)}
                </select>
            </div>

            {/* Zone */}
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Zone</label>
                <select
                    className="w-full bg-slate-50 border border-slate-100 rounded px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-40"
                    value={zonePcode}
                    onChange={e => { setZonePcode(e.target.value); setWoredaPcode(""); }}
                    disabled={!regionPcode}
                >
                    <option value="">{zonesLoading ? "Loading..." : "Select Zone"}</option>
                    {zones?.map(z => <option key={z.adm2_pcode} value={z.adm2_pcode}>{z.adm2_name}</option>)}
                </select>
            </div>

            {/* Woreda */}
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Woreda</label>
                <select
                    className="w-full bg-slate-50 border border-slate-100 rounded px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-40"
                    value={woredaPcode}
                    onChange={e => setWoredaPcode(e.target.value)}
                    disabled={!zonePcode}
                >
                    <option value="">{woredasLoading ? "Loading..." : "Select Woreda"}</option>
                    {woredas?.map(w => <option key={w.adm3_pcode} value={w.adm3_pcode}>{w.adm3_name}</option>)}
                </select>
            </div>

            {/* Kebele — not in dataset */}
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Kebele</label>
                <select disabled className="w-full bg-slate-50 border border-slate-100 rounded px-3 py-2 text-xs text-slate-400 opacity-40 cursor-not-allowed">
                    <option>Not available in dataset</option>
                </select>
            </div>

            <button
                onClick={handleLocate}
                disabled={!selectedPcode || locating}
                className="w-full py-2 border border-primary text-primary text-[10px] font-bold uppercase tracking-widest rounded hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {locating && <Loader2 className="w-3 h-3 animate-spin" />}
                Locate Area
            </button>
        </div>
    );
}

// Map display labels to layer IDs that MapView listens on
const LAYER_ID_MAP: Record<string, string> = {
    "Road Networks": "roads",
    "Railways": "railways",
    "Energy & Telecom": "energy-telecom",
    "Population Density": "population",
    "Settlement Hierarchy": "settlements",
    "Health Facilities": "health",
    "Education Facilities": "education",
    "Land Use / Cover": "landcover",
    "Forests & Biodiversity": "forests",
    "Water Resources": "water",
    "Agro-ecological zones": "agroecology",
    "Crop distribution": "crops",
};

function ThematicLayersPanel({ activeLayers, onToggleLayer }: { activeLayers: string[]; onToggleLayer: (id: string) => void }) {
    const groups = [
        { title: "Population & Social", icon: PersonStanding, layers: ["Population Density", "Settlement Hierarchy", "Health Facilities", "Education Facilities"] },
        { title: "Environment & Natural", icon: TreePine, layers: ["Land Use / Cover", "Forests & Biodiversity", "Water Resources"] },
        { title: "Agriculture & Food", icon: Fuel, layers: ["Agro-ecological zones", "Crop distribution"] },
        { title: "Infrastructure", icon: Building2, layers: ["Road Networks", "Railways", "Energy & Telecom"] },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-tighter text-blue-600">Thematic Data</h2>
            <div className="space-y-4">
                {groups.map((group, i) => (
                    <div key={i} className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <group.icon className="w-3.5 h-3.5" />
                            {group.title}
                        </div>
                        <div className="space-y-1 ml-5">
                            {group.layers.map((layer, j) => {
                                const layerId = LAYER_ID_MAP[layer];
                                const isActive = layerId ? activeLayers.includes(layerId) : false;
                                return (
                                    <label key={j} className="flex items-center gap-2 text-xs text-slate-600 hover:text-primary cursor-pointer py-1">
                                        <input
                                            type="checkbox"
                                            className="w-3.5 h-3.5 rounded border-slate-300 accent-primary"
                                            checked={isActive}
                                            onChange={() => layerId && onToggleLayer(layerId)}
                                        />
                                        <span className={isActive && layerId ? "font-semibold text-primary" : ""}>
                                            {layer}
                                            {layerId === "roads" && isActive && (
                                                <span className="ml-1 text-[9px] font-bold text-green-600 bg-green-50 px-1 rounded">LIVE</span>
                                            )}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface AnalysisPanelProps {
    activeLayers: string[];
    onStartBuffer?: (r: number) => void;
    onStopBuffer?: () => void;
    onStartMeasure?: (mode: "distance" | "area") => void;
    onStopMeasure?: () => void;
    onStartSuitability?: (layers: string[], weights: number[]) => void;
    onStopSuitability?: () => void;
    onSetTimeFilter?: (year: number | null) => void;
}

const SUITABILITY_LAYERS = [
    { id: "roads", label: "Road Networks" },
    { id: "water", label: "Water Resources" },
    { id: "population", label: "Population Density" },
    { id: "health", label: "Health Facilities" },
    { id: "education", label: "Education Facilities" },
];

function AnalysisPanel({ activeLayers, onStartBuffer, onStopBuffer, onStartMeasure, onStopMeasure, onStartSuitability, onStopSuitability, onSetTimeFilter }: AnalysisPanelProps) {
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [bufferRadius, setBufferRadius] = useState(10);
    const [measureMode, setMeasureMode] = useState<"distance" | "area">("distance");
    const [suitWeights, setSuitWeights] = useState<Record<string, number>>(
        Object.fromEntries(SUITABILITY_LAYERS.map(l => [l.id, 1]))
    );
    const [selectedSuitLayers, setSelectedSuitLayers] = useState<string[]>(["roads", "water"]);
    const [timeYear, setTimeYear] = useState(2020);
    const [timeActive, setTimeActive] = useState(false);

    const activate = (tool: string) => {
        if (activeTool === tool) {
            deactivate();
        } else {
            deactivate();
            setActiveTool(tool);
        }
    };

    const deactivate = () => {
        if (activeTool === "buffer") onStopBuffer?.();
        if (activeTool?.startsWith("measure")) onStopMeasure?.();
        if (activeTool === "suitability") onStopSuitability?.();
        setActiveTool(null);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-tighter">Advanced Analysis</h2>

            {/* Buffering & Proximity */}
            <div className="border border-slate-100 rounded-lg overflow-hidden">
                <button
                    onClick={() => activate("buffer")}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-all ${
                        activeTool === "buffer" ? "bg-violet-50 text-violet-700" : "bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                >
                    <Crosshair className="w-4 h-4 shrink-0" />
                    <span className="text-[11px] font-semibold">Buffering & Proximity</span>
                    {activeTool === "buffer" && <span className="ml-auto text-[9px] font-bold bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded">ACTIVE</span>}
                </button>
                {activeTool === "buffer" && (
                    <div className="px-3 pb-3 bg-violet-50 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Radius (km)</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range" min={1} max={100} value={bufferRadius}
                                onChange={e => setBufferRadius(Number(e.target.value))}
                                className="flex-1 accent-violet-600"
                            />
                            <span className="text-xs font-mono font-bold text-violet-700 w-10 text-right">{bufferRadius}km</span>
                        </div>
                        <button
                            onClick={() => onStartBuffer?.(bufferRadius)}
                            className="w-full py-1.5 bg-violet-600 text-white text-[10px] font-bold uppercase rounded hover:bg-violet-700"
                        >
                            Click map to place buffer
                        </button>
                    </div>
                )}
            </div>

            {/* Measurement Tools */}
            <div className="border border-slate-100 rounded-lg overflow-hidden">
                <button
                    onClick={() => activate("measure")}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-all ${
                        activeTool === "measure" ? "bg-sky-50 text-sky-700" : "bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                >
                    <Ruler className="w-4 h-4 shrink-0" />
                    <span className="text-[11px] font-semibold">Measurement Tools</span>
                    {activeTool === "measure" && <span className="ml-auto text-[9px] font-bold bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded">ACTIVE</span>}
                </button>
                {activeTool === "measure" && (
                    <div className="px-3 pb-3 bg-sky-50 space-y-2">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setMeasureMode("distance")}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded border transition-all ${
                                    measureMode === "distance" ? "bg-sky-600 text-white border-sky-600" : "bg-white text-slate-500 border-slate-200"
                                }`}
                            >Distance</button>
                            <button
                                onClick={() => setMeasureMode("area")}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded border transition-all ${
                                    measureMode === "area" ? "bg-sky-600 text-white border-sky-600" : "bg-white text-slate-500 border-slate-200"
                                }`}
                            >Area</button>
                        </div>
                        <button
                            onClick={() => onStartMeasure?.(measureMode)}
                            className="w-full py-1.5 bg-sky-600 text-white text-[10px] font-bold uppercase rounded hover:bg-sky-700"
                        >
                            Start Drawing
                        </button>
                        <button
                            onClick={() => { onStopMeasure?.(); setActiveTool(null); }}
                            className="w-full py-1.5 border border-sky-300 text-sky-600 text-[10px] font-bold uppercase rounded hover:bg-sky-50"
                        >
                            Clear
                        </button>
                    </div>
                )}
            </div>

            {/* Suitability Analysis */}
            <div className="border border-slate-100 rounded-lg overflow-hidden">
                <button
                    onClick={() => activate("suitability")}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-all ${
                        activeTool === "suitability" ? "bg-emerald-50 text-emerald-700" : "bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                >
                    <BarChart3 className="w-4 h-4 shrink-0" />
                    <span className="text-[11px] font-semibold">Suitability Analysis</span>
                    {activeTool === "suitability" && <span className="ml-auto text-[9px] font-bold bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded">ACTIVE</span>}
                </button>
                {activeTool === "suitability" && (
                    <div className="px-3 pb-3 bg-emerald-50 space-y-2">
                        <p className="text-[10px] text-slate-500">Select layers and set weights (1–5)</p>
                        {SUITABILITY_LAYERS.map(l => (
                            <div key={l.id} className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={selectedSuitLayers.includes(l.id)}
                                    onChange={e => setSelectedSuitLayers(prev =>
                                        e.target.checked ? [...prev, l.id] : prev.filter(x => x !== l.id)
                                    )}
                                    className="accent-emerald-600"
                                />
                                <span className="text-[11px] text-slate-600 flex-1">{l.label}</span>
                                <input
                                    type="number" min={1} max={5} value={suitWeights[l.id]}
                                    onChange={e => setSuitWeights(prev => ({ ...prev, [l.id]: Number(e.target.value) }))}
                                    className="w-10 text-center text-xs border border-slate-200 rounded py-0.5 bg-white"
                                    disabled={!selectedSuitLayers.includes(l.id)}
                                />
                            </div>
                        ))}
                        <button
                            onClick={() => {
                                const layers = selectedSuitLayers;
                                const weights = layers.map(l => suitWeights[l] ?? 1);
                                onStartSuitability?.(layers, weights);
                            }}
                            disabled={selectedSuitLayers.length === 0}
                            className="w-full py-1.5 bg-emerald-600 text-white text-[10px] font-bold uppercase rounded hover:bg-emerald-700 disabled:opacity-40"
                        >
                            Run Analysis
                        </button>
                        <button
                            onClick={() => { onStopSuitability?.(); setActiveTool(null); }}
                            className="w-full py-1.5 border border-emerald-300 text-emerald-600 text-[10px] font-bold uppercase rounded hover:bg-emerald-50"
                        >
                            Clear
                        </button>
                        <div className="flex items-center gap-2 pt-1">
                            <span className="w-3 h-3 rounded-sm" style={{ background: "#16a34a" }} /><span className="text-[10px]">High</span>
                            <span className="w-3 h-3 rounded-sm ml-2" style={{ background: "#eab308" }} /><span className="text-[10px]">Medium</span>
                            <span className="w-3 h-3 rounded-sm ml-2" style={{ background: "#dc2626" }} /><span className="text-[10px]">Low</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Time-Slider Control */}
            <div className="border border-slate-100 rounded-lg overflow-hidden">
                <button
                    onClick={() => activate("time")}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-all ${
                        activeTool === "time" ? "bg-amber-50 text-amber-700" : "bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                >
                    <Clock className="w-4 h-4 shrink-0" />
                    <span className="text-[11px] font-semibold">Time-Slider Control</span>
                    {timeActive && <span className="ml-auto text-[9px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">ACTIVE</span>}
                </button>
                {activeTool === "time" && (
                    <div className="px-3 pb-3 bg-amber-50 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Year: {timeYear}</label>
                        <input
                            type="range" min={2000} max={2024} value={timeYear}
                            onChange={e => {
                                setTimeYear(Number(e.target.value));
                                if (timeActive) onSetTimeFilter?.(Number(e.target.value));
                            }}
                            className="w-full accent-amber-500"
                        />
                        <div className="flex justify-between text-[9px] text-slate-400">
                            <span>2000</span><span>2012</span><span>2024</span>
                        </div>
                        <button
                            onClick={() => {
                                const next = !timeActive;
                                setTimeActive(next);
                                onSetTimeFilter?.(next ? timeYear : null);
                            }}
                            className={`w-full py-1.5 text-[10px] font-bold uppercase rounded transition-all ${
                                timeActive ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-white border border-amber-300 text-amber-600 hover:bg-amber-50"
                            }`}
                        >
                            {timeActive ? "Disable Filter" : "Enable Filter"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function DataPanel() {
    return (
        <div className="space-y-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-tighter">Data Access</h2>
            <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <h3 className="text-xs font-bold text-blue-700 mb-2 font-display uppercase tracking-wider">OGC Services</h3>
                    <p className="text-[10px] text-blue-600 mb-4 font-body leading-relaxed">Connect directly via WMS / WFS / WMTS / WCS endpoints for your desktop GIS.</p>
                    <button className="w-full py-1.5 bg-blue-600 text-white text-[9px] font-bold uppercase rounded shadow-sm hover:bg-blue-700">Get Endpoint URL</button>
                </div>

                <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Downloadable Products</h3>
                    {["Official Boundary Dataset", "Digital Topo Sheets (1:10k)", "LULC Web Atlas"].map((p, i) => (
                        <button key={i} className="w-full flex items-center justify-between p-3 bg-white border border-slate-50 rounded hover:bg-slate-50 text-[11px] text-slate-600 transition-colors">
                            {p}
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
