import LayerPanel from "./LayerPanel";
import { X, Globe } from "lucide-react";

interface AppSidebarProps {
    open: boolean;
    onClose: () => void;
    activeLayers: string[];
    onToggleLayer: (layerId: string) => void;
}

export default function AppSidebar({ open, onClose, activeLayers, onToggleLayer }: AppSidebarProps) {
    return (
        <>
            {/* Mobile overlay */}
            {open && (
                <div className="fixed inset-0 bg-foreground/30 z-[1200] lg:hidden" onClick={onClose} />
            )}

            <aside
                className={`fixed lg:relative top-0 left-0 h-full z-[1300] w-72 navy-gradient border-r border-navy-light flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    }`}
            >
                {/* Mobile close button */}
                <div className="flex items-center justify-between p-3 lg:hidden">
                    <div className="flex items-center gap-2 text-sidebar-foreground">
                        <Globe className="w-4 h-4 text-sidebar-primary" />
                        <span className="text-sm font-semibold">Navigation</span>
                    </div>
                    <button onClick={onClose} className="text-sidebar-foreground hover:text-sidebar-primary">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin">
                    <LayerPanel activeLayers={activeLayers} onToggleLayer={onToggleLayer} />
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-sidebar-border text-[10px] text-sidebar-foreground/50 text-center">
                    SSGI © 2026 — OGC Compliant
                </div>
            </aside>
        </>
    );
}
