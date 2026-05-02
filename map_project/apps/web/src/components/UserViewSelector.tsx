import { useState } from "react";
import { Briefcase, Users, Building, ChevronDown } from "lucide-react";

const views = [
    { id: "public", label: "Public", icon: Users, description: "Story Maps & Interactive Atlases" },
    { id: "policy", label: "Policy Makers", icon: Building, description: "Decision Dashboards & SDG" },
    { id: "investors", label: "Investors", icon: Briefcase, description: "Site Selection & Infrastructure" },
];

export default function UserViewSelector() {
    const [active, setActive] = useState("public");
    const [open, setOpen] = useState(false);

    const current = views.find((v) => v.id === active)!;

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-card/90 backdrop-blur-md border border-border/50 text-foreground hover:bg-muted transition-colors"
            >
                <current.icon className="w-3.5 h-3.5 text-gold" />
                <span className="font-medium text-xs">{current.label}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>

            {open && (
                <div className="absolute top-full mt-1 right-0 z-[1100] glass-panel rounded-lg py-1 w-56 animate-fade-in">
                    {views.map((view) => (
                        <button
                            key={view.id}
                            onClick={() => { setActive(view.id); setOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors ${active === view.id ? "bg-muted" : ""
                                }`}
                        >
                            <view.icon className="w-4 h-4 text-gold" />
                            <div>
                                <div className="text-xs font-medium text-foreground">{view.label}</div>
                                <div className="text-[10px] text-muted-foreground">{view.description}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
