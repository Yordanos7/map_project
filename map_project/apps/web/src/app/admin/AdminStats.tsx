"use client";

import { Skeleton } from "@map_project/ui/components/skeleton";
import { Activity, BookOpen, Building2, MapPin, Users } from "lucide-react";

interface Stats {
    roadSigns: number;
    health: number;
    education: number;
    settlements: number;
    users: number;
}

const STAT_CARDS = [
    { key: "users" as const, label: "Users", icon: Users, color: "text-blue-500" },
    { key: "roadSigns" as const, label: "Road Signs", icon: MapPin, color: "text-yellow-500" },
    { key: "health" as const, label: "Health Facilities", icon: Activity, color: "text-red-500" },
    { key: "education" as const, label: "Education Facilities", icon: BookOpen, color: "text-green-500" },
    { key: "settlements" as const, label: "Settlements", icon: Building2, color: "text-purple-500" },
];

export default function AdminStats({ stats, isLoading }: { stats?: Stats; isLoading: boolean }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="border rounded-xl p-4 bg-card flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${color}`} />
                        <span className="text-sm text-muted-foreground">{label}</span>
                    </div>
                    {isLoading ? (
                        <Skeleton className="h-8 w-16" />
                    ) : (
                        <span className="text-3xl font-bold">{stats?.[key]?.toLocaleString() ?? 0}</span>
                    )}
                </div>
            ))}
        </div>
    );
}
