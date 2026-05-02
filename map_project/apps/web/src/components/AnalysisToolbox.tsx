"use client";
import { useState } from "react";
import { Ruler, Box, Clock, Download, ChevronLeft, ChevronRight, CircleDot, Layers3, BarChart3, FileDown } from "lucide-react";
import { Button } from "@map_project/ui/components/button";

const tools = [
    { id: "buffer", label: "Buffer & Proximity", icon: CircleDot, description: "Calculate distances around points" },
    { id: "3d", label: "3D Terrain", icon: Box, description: "Toggle 3D terrain visualization" },
    { id: "timeslider", label: "Time Slider", icon: Clock, description: "Visualize temporal changes" },
    { id: "measure", label: "Measure", icon: Ruler, description: "Measure distances and areas" },
    { id: "overlay", label: "Layer Overlay", icon: Layers3, description: "Overlay and compare layers" },
    { id: "statistics", label: "Statistics", icon: BarChart3, description: "Zonal statistics analysis" },
];

export default function AnalysisToolbox() {
    const [open, setOpen] = useState(false);
    const [activeTool, setActiveTool] = useState<string | null>(null);

    return (
        <>
            {/* Toggle button */}
            <button
                onClick={() => setOpen(!open)}
                className="absolute top-4 right-16 z-[1000] glass-panel w-10 h-10 flex items-center justify-center rounded-lg text-foreground hover:bg-accent/20 transition-colors"
                title="Analysis Toolbox"
            >
                {open ? <ChevronRight className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
            </button>

            {/* Toolbox panel */}
            {open && (
                <div className="absolute top-16 right-4 z-[1000] glass-panel rounded-xl p-4 w-56 animate-slide-in-left">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Analysis Toolbox</h3>
                    <div className="space-y-1">
                        {tools.map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTool === tool.id
                                    ? "bg-primary text-primary-foreground"
                                    : "text-foreground hover:bg-muted"
                                    }`}
                            >
                                <tool.icon className="w-4 h-4 flex-shrink-0" />
                                <div className="text-left">
                                    <div className="font-medium text-xs">{tool.label}</div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-border">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Data Access</h4>
                        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                            <FileDown className="w-4 h-4" />
                            <span className="font-medium text-xs">Download Data (WMS/WFS)</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
