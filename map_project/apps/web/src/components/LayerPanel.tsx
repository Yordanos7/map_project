import { useState } from "react";
import { ChevronDown, ChevronRight, Map, Layers, Mountain, Satellite, Grid3x3, TreePine, Droplets, Building2, Train, Wheat, Users, GraduationCap, Heart } from "lucide-react";

interface LayerPanelProps {
    activeLayers: string[];
    onToggleLayer: (layerId: string) => void;
}

interface LayerGroup {
    id: string;
    label: string;
    icon: React.ReactNode;
    layers: { id: string; label: string }[];
}

const LAYER_GROUPS: LayerGroup[] = [
    {
        id: "basemaps",
        label: "Base Maps",
        icon: <Map className="w-4 h-4" />,
        layers: [
            { id: "osm", label: "Vector Basemap (OSM)" },
            { id: "cartographic", label: "Raster Cartographic" },
            { id: "satellite", label: "Satellite Imagery" },
            { id: "terrain", label: "Terrain / Hillshade" },
        ],
    },
    {
        id: "admin",
        label: "Administrative Boundaries",
        icon: <Grid3x3 className="w-4 h-4" />,
        layers: [
            { id: "admin-region", label: "Regions" },
            { id: "admin-zone", label: "Zones" },
            { id: "admin-woreda", label: "Woredas" },
            { id: "admin-kebele", label: "Kebeles" },
        ],
    },
    {
        id: "agriculture",
        label: "Agriculture",
        icon: <Wheat className="w-4 h-4" />,
        layers: [
            { id: "agro-ecological", label: "Agro-Ecological Zones" },
            { id: "crop-suitability", label: "Crop Suitability" },
            { id: "irrigation", label: "Irrigation Schemes" },
        ],
    },
    {
        id: "infrastructure",
        label: "Infrastructure",
        icon: <Building2 className="w-4 h-4" />,
        layers: [
            { id: "roads", label: "Road Networks" },
            { id: "railways", label: "Railways" },
            { id: "energy-telecom", label: "Energy & Telecom" },
        ],
    },
    {
        id: "environment",
        label: "Environment",
        icon: <TreePine className="w-4 h-4" />,
        layers: [
            { id: "lulc", label: "Land Use / Land Cover" },
            { id: "forests", label: "Forest Cover" },
            { id: "biodiversity", label: "Biodiversity Hotspots" },
            { id: "water", label: "Water Resources" },
        ],
    },
    {
        id: "social",
        label: "Social",
        icon: <Users className="w-4 h-4" />,
        layers: [
            { id: "population", label: "Population Density" },
            { id: "settlements", label: "Settlement Hierarchy" },
            { id: "health", label: "Health Facilities" },
            { id: "education", label: "Education Facilities" },
        ],
    },
];

export default function LayerPanel({ activeLayers, onToggleLayer }: LayerPanelProps) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({ basemaps: true });

    const toggle = (groupId: string) => {
        setExpanded((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2 px-3 py-2 mb-2">
                <Layers className="w-4 h-4 text-sidebar-primary" />
                <span className="text-sm font-semibold text-sidebar-foreground tracking-wide uppercase">Layers</span>
            </div>

            {LAYER_GROUPS.map((group) => (
                <div key={group.id}>
                    <button
                        onClick={() => toggle(group.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-md transition-colors"
                    >
                        {expanded[group.id] ? <ChevronDown className="w-3 h-3 text-sidebar-primary" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                        {group.icon}
                        <span className="font-medium">{group.label}</span>
                    </button>

                    {expanded[group.id] && (
                        <div className="ml-6 space-y-0.5 animate-fade-in">
                            {group.layers.map((layer) => (
                                <label
                                    key={layer.id}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent/30 rounded cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={activeLayers.includes(layer.id)}
                                        onChange={() => onToggleLayer(layer.id)}
                                        className="w-3.5 h-3.5 rounded border-sidebar-border accent-gold"
                                    />
                                    <span>{layer.label}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
