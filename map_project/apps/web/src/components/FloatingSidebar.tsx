"use client";
import { useState } from "react";
import {
    Bus,
    Bike,
    Walk,
    Bicycle,
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
    Clock
} from "lucide-react";

type TabMode = "search" | "route" | "admin" | "layers" | "analysis" | "data";

export default function FloatingSidebar() {
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
                {activeTab === "admin" && <AdminPanel />}
                {activeTab === "layers" && <ThematicLayersPanel />}
                {activeTab === "analysis" && <AnalysisPanel />}
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
                <button className="p-2 text-slate-400 hover:text-primary"><PersonStanding className="w-4 h-4" /></button>
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

function AdminPanel() {
    return (
        <div className="space-y-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-tighter">Administrative Search</h2>
            <div className="space-y-4">
                {["Region", "Zone", "Woreda", "Kebele"].map((level) => (
                    <div key={level}>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">{level}</label>
                        <select className="w-full bg-slate-50 border border-slate-100 rounded px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary">
                            <option>Select {level}</option>
                        </select>
                    </div>
                ))}
            </div>
            <button className="w-full py-2 border border-primary text-primary text-[10px] font-bold uppercase tracking-widest rounded hover:bg-primary/5 transition-colors">
                Locate Area
            </button>
        </div>
    );
}

function ThematicLayersPanel() {
    const groups = [
        { title: "Population & Social", icon: PersonStanding, layers: ["Population Density", "Settlement Hierarchy", "Health & Education"] },
        { title: "Environment & Natural", icon: TreePine, layers: ["Land Use / Cover", "Forests & Biodiversity", "Water Resources"] },
        { title: "Agriculture & Food", icon: Fuel, layers: ["Agro-ecological zones", "Crop distribution", "Irrigation schemes"] },
        { title: "Infrastructure", icon: Building2, layers: ["Road Networks", "Railways", "Energy & Telecom"] }
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
                            {group.layers.map((layer, j) => (
                                <label key={j} className="flex items-center gap-2 text-xs text-slate-600 hover:text-primary cursor-pointer py-1">
                                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 accent-primary" />
                                    {layer}
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AnalysisPanel() {
    const tools = [
        { label: "Buffering & Proximity", icon: Crosshair },
        { label: "Suitability Analysis", icon: BarChart3 },
        { label: "Measurement Tools", icon: Ruler },
        { label: "3D Terrain Visualization", icon: Box },
        { label: "Time-Slider Control", icon: Clock },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-tighter">Advanced Analysis</h2>
            <div className="grid grid-cols-1 gap-2">
                {tools.map((tool, i) => (
                    <button key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-lg hover:border-primary hover:text-primary transition-all text-left shadow-sm">
                        <tool.icon className="w-4 h-4" />
                        <span className="text-[11px] font-medium">{tool.label}</span>
                    </button>
                ))}
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
