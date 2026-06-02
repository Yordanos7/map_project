import { useState, useRef } from "react";
import {
    PersonStanding,
    Search,
    MapPin,
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
    Clock,
    Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { env } from "@map_project/env/web";

type TabMode = "search" | "admin" | "layers" | "analysis";

interface SelectedArea {
    name: string;
    bbox: [number, number, number, number];
    geojson: any;
}

interface FloatingSidebarProps {
    activeLayers: string[];
    onToggleLayer: (layerId: string) => void;
    onLocateAdmin?: (bbox: [number, number, number, number], geojson: any, name: string) => void;
    onLocatePoint?: (lat: number, lng: number, label: string) => void;
    onClearAdminBoundary?: () => void;
    onSetTimeFilter?: (year: number | null) => void;
}

export default function FloatingSidebar({ activeLayers, onToggleLayer, onLocateAdmin, onLocatePoint, onClearAdminBoundary, onSetTimeFilter }: FloatingSidebarProps) {
    const [activeTab, setActiveTab] = useState<TabMode>("search");
    const [isOpen, setIsOpen] = useState(true);
    const [selectedArea, setSelectedArea] = useState<SelectedArea | null>(null);

    const handleAreaLocated = (bbox: [number, number, number, number], geojson: any, name: string) => {
        setSelectedArea({ name, bbox, geojson });
        onLocateAdmin?.(bbox, geojson, name);
        setActiveTab("layers");
    };

    const handleClearArea = () => {
        setSelectedArea(null);
        onClearAdminBoundary?.();
    };

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
        { id: "admin", icon: Grid3x3 },
        { id: "layers", icon: Layers },
        { id: "analysis", icon: BarChart3 },
    ];

    return (
        <div className="absolute top-4 left-4 z-[1000] w-80 floating-panel flex flex-col max-h-[calc(100vh-2rem)] pointer-events-auto">
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
                {activeTab === "search" && <SearchPanel onLocateAdmin={onLocateAdmin} onLocatePoint={onLocatePoint} />}
                {activeTab === "admin" && <AdminPanel onLocateAdmin={handleAreaLocated} />}
                {activeTab === "layers" && (
                    <ThematicLayersPanel
                        activeLayers={activeLayers}
                        onToggleLayer={onToggleLayer}
                        selectedArea={selectedArea}
                        onClearArea={handleClearArea}
                        onGoToAdmin={() => setActiveTab("admin")}
                    />
                )}
                {activeTab === "analysis" && <AnalysisPanel
                    onSetTimeFilter={onSetTimeFilter}
                    activeLayers={activeLayers}
                />}
            </div>
        </div>
    );
}

interface SearchResultItem {
    id: string;
    name: string;
    category: string;
    type: "settlement" | "health" | "education" | "admin" | "coordinate";
    lat?: number;
    lon?: number;
    place?: string;
    population?: string;
    amenity?: string;
    subtitle?: string;
    adminLevel?: 1 | 2 | 3;
    pcode?: string;
}

function parseCoordinates(input: string): [number, number] | null {
    const raw = input.trim();
    const parts = raw.replace(/[()]/g, "").split(/[,\s]+/).filter(Boolean);
    if (parts.length !== 2) return null;
    const lat = Number(parts[0]);
    const lon = Number(parts[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
    return [lat, lon];
}

function SearchPanel({ onLocateAdmin, onLocatePoint }: { onLocateAdmin?: (bbox: [number, number, number, number], geojson: any, name: string) => void; onLocatePoint?: (lat: number, lng: number, label: string) => void; }) {
    const [query, setQuery] = useState("");
    const [loadingAction, setLoadingAction] = useState(false);
    const coordinates = parseCoordinates(query);

    const resultsQuery = useQuery({
        ...trpc.map.searchLocations.queryOptions({ query: query.trim() }),
        enabled: !coordinates && query.trim().length >= 3,
        staleTime: 1000 * 60,
    });

    const results = resultsQuery.data ?? [];
    const isSearching = resultsQuery.isLoading;

    const handleSelect = async (item: SearchResultItem) => {
        if (item.type === "coordinate" && item.lat !== undefined && item.lon !== undefined) {
            onLocatePoint?.(item.lat, item.lon, item.name);
            return;
        }

        if (item.type === "admin" && item.adminLevel && item.pcode) {
            setLoadingAction(true);
            try {
                const input = encodeURIComponent(JSON.stringify({ level: item.adminLevel, pcode: item.pcode }));
                const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/trpc/map.getAdminBoundary?input=${input}`, {
                    credentials: "include",
                });
                const json = await res.json();
                const serviceData = json?.result?.data;
                if (serviceData) {
                    onLocateAdmin?.(serviceData.bbox, serviceData.geojson, serviceData.name);
                }
            } finally {
                setLoadingAction(false);
            }
            return;
        }

        if (item.lat !== undefined && item.lon !== undefined) {
            onLocatePoint?.(item.lat, item.lon, item.name);
        }
    };

    const coordinateResult: SearchResultItem[] = coordinates
        ? [{
            id: "coordinate-search",
            name: `Go to ${coordinates[0].toFixed(5)}, ${coordinates[1].toFixed(5)}`,
            category: "Coordinates",
            type: "coordinate",
            lat: coordinates[0],
            lon: coordinates[1],
        }]
        : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-tighter">Global Search</h2>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-primary" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search places, coordinates, admin units..."
                    className="w-full pl-10 pr-4 py-2 text-sm border-b border-slate-200 focus:outline-none focus:border-primary placeholder:text-slate-400"
                />
            </div>

            <div className="space-y-4">
                {query.trim().length < 3 ? (
                    <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
                        Type at least 3 characters to search the database, or enter coordinates like <span className="font-semibold">9.03, 38.76</span>.
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-slate-500">
                            <span>Results</span>
                            {isSearching && <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Searching…</span>}
                        </div>

                        <div className="space-y-2">
                            {coordinateResult.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelect(item)}
                                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-primary hover:bg-primary/5 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-slate-700">{item.name}</p>
                                        <span className="text-[10px] text-slate-500">{item.category}</span>
                                    </div>
                                </button>
                            ))}

                            {results.length === 0 && !isSearching && coordinateResult.length === 0 ? (
                                <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">No matching places found.</div>
                            ) : null}

                            {results.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelect(item)}
                                    disabled={loadingAction}
                                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-60"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">{item.name}</p>
                                            <p className="mt-1 text-[11px] text-slate-500">{item.category}{item.place ? ` · ${item.place}` : item.amenity ? ` · ${item.amenity}` : item.subtitle ? ` · ${item.subtitle}` : ""}</p>
                                        </div>
                                        <span className="text-[10px] text-slate-500">{item.type === "admin" ? "Admin" : "Feature"}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function AdminPanel({ onLocateAdmin }: { onLocateAdmin?: (bbox: [number, number, number, number], geojson: any, name: string) => void }) {
    const [regionPcode, setRegionPcode] = useState("");
    const [zonePcode, setZonePcode] = useState("");
    const [woredaPcode, setWoredaPcode] = useState("");
    const [locating, setLocating] = useState(false);

    const { data: regions, isLoading: regionsLoading } = useQuery(trpc.map.getRegions.queryOptions());
    const { data: zones, isLoading: zonesLoading } = useQuery({
        ...trpc.map.getZones.queryOptions({ regionPcode }),
        enabled: !!regionPcode
    });
    const { data: woredas, isLoading: woredasLoading } = useQuery({
        ...trpc.map.getWoredas.queryOptions({ zonePcode }),
        enabled: !!zonePcode
    });

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

// Map display labels to layer IDs — kept for reference
function ThematicLayersPanel({
    activeLayers,
    onToggleLayer,
    selectedArea,
    onClearArea,
    onGoToAdmin,
}: {
    activeLayers: string[];
    onToggleLayer: (id: string) => void;
    selectedArea: SelectedArea | null;
    onClearArea: () => void;
    onGoToAdmin: () => void;
}) {
    const groups = [
        {
            title: "Population & Social",
            icon: PersonStanding,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-100",
            activeBg: "bg-blue-600",
            layers: [
                { id: "population", label: "Population Density", desc: "Human density heatmap" },
                { id: "settlements", label: "Settlement Hierarchy", desc: "Cities, towns & villages" },
                { id: "health", label: "Health Facilities", desc: "Hospitals, clinics, pharmacies" },
                { id: "education", label: "Education Facilities", desc: "Schools, universities" },
            ],
        },
        {
            title: "Environment & Natural",
            icon: TreePine,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-100",
            activeBg: "bg-emerald-600",
            layers: [
                { id: "landcover", label: "Land Use / Cover", desc: "Global land classification" },
                { id: "forests", label: "Forests & Biodiversity", desc: "Protected forest areas" },
                { id: "water", label: "Water Resources", desc: "Rivers, lakes & wetlands" },
            ],
        },
        {
            title: "Agriculture & Food",
            icon: Fuel,
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-100",
            activeBg: "bg-amber-600",
            layers: [
                { id: "agroecology", label: "Agro-ecological Zones", desc: "Rangeland & cropland zones" },
                { id: "crops", label: "Crop Distribution", desc: "Agricultural land coverage" },
            ],
        },
        {
            title: "Infrastructure",
            icon: Building2,
            color: "text-slate-600",
            bg: "bg-slate-50",
            border: "border-slate-100",
            activeBg: "bg-slate-700",
            layers: [
                { id: "roads", label: "Road Networks", desc: "Primary, secondary & tracks" },
                { id: "railways", label: "Railways", desc: "Rail lines & stations" },
                { id: "energy-telecom", label: "Energy & Telecom", desc: "Power lines & infrastructure" },
            ],
        },
    ];

    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-tighter">Thematic Data</h2>
                {selectedArea && (
                    <button
                        onClick={onClearArea}
                        className="text-[10px] text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                        <X className="w-3 h-3" /> Clear
                    </button>
                )}
            </div>

            {/* Selected area context banner */}
            {selectedArea ? (
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Filtered Area</p>
                        <p className="text-xs font-semibold text-blue-700 truncate">{selectedArea.name}</p>
                        <p className="text-[10px] text-blue-400 mt-0.5">Layers show data within this boundary</p>
                    </div>
                    <button
                        onClick={onGoToAdmin}
                        className="text-[10px] text-blue-500 hover:text-blue-700 font-semibold shrink-0 mt-0.5"
                    >
                        Change
                    </button>
                </div>
            ) : (
                <button
                    onClick={onGoToAdmin}
                    className="w-full flex items-center gap-2 px-3 py-2.5 border border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
                >
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px] font-medium">Filter by administrative area</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                </button>
            )}

            {/* 4 main group cards */}
            <div className="space-y-2">
                {groups.map((group) => {
                    const isExpanded = expandedGroup === group.title;
                    const activeCount = group.layers.filter(l => activeLayers.includes(l.id)).length;

                    return (
                        <div key={group.title} className={`border rounded-xl overflow-hidden transition-all ${group.border}`}>
                            {/* Group header card */}
                            <button
                                onClick={() => setExpandedGroup(isExpanded ? null : group.title)}
                                className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-all ${
                                    isExpanded ? group.bg : "bg-white hover:" + group.bg
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${group.bg}`}>
                                    <group.icon className={`w-4 h-4 ${group.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-[11px] font-bold uppercase tracking-wider ${group.color}`}>
                                        {group.title}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                        {activeCount > 0
                                            ? `${activeCount} of ${group.layers.length} active`
                                            : `${group.layers.length} layers available`}
                                    </p>
                                </div>
                                {activeCount > 0 && (
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white ${group.activeBg}`}>
                                        {activeCount}
                                    </span>
                                )}
                                <ChevronRight className={`w-3.5 h-3.5 text-slate-300 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                            </button>

                            {/* Expanded layers */}
                            {isExpanded && (
                                <div className={`${group.bg} border-t ${group.border} divide-y ${group.border}`}>
                                    {group.layers.map((layer) => {
                                        const isActive = activeLayers.includes(layer.id);
                                        return (
                                            <label
                                                key={layer.id}
                                                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:brightness-95 transition-all"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-slate-300 accent-current shrink-0"
                                                    checked={isActive}
                                                    onChange={() => onToggleLayer(layer.id)}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-[12px] font-semibold ${
                                                        isActive ? group.color : "text-slate-600"
                                                    }`}>
                                                        {layer.label}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">{layer.desc}</p>
                                                </div>
                                                {isActive && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" style={{ color: "inherit" }} />
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

interface AnalysisPanelProps {
    onSetTimeFilter?: (year: number | null) => void;
}

function AnalysisPanel({ onSetTimeFilter }: AnalysisPanelProps) {
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [timeYear, setTimeYear] = useState(2020);
    const [timeActive, setTimeActive] = useState(false);

    const activate = (tool: string) => setActiveTool(activeTool === tool ? null : tool);

    return (
        <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-tighter">Advanced Analysis</h2>

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
                                const nextYear = Number(e.target.value);
                                setTimeYear(nextYear);
                                if (timeActive) onSetTimeFilter?.(nextYear);
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
