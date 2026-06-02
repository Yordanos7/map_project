"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { trpc, trpcClient } from "@/utils/trpc";
import AdminEditModal from "./AdminEditModal";
import AdminStats from "./AdminStats";
import AdminTable from "./AdminTable";

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = ["Overview", "Users", "Road Signs", "Health", "Education", "Settlements"] as const;
type Tab = (typeof TABS)[number];

// ── Field definitions ─────────────────────────────────────────────────────────
const ROAD_SIGN_FIELDS = [
    { key: "signType", label: "Sign Type" },
    { key: "lat", label: "Latitude", type: "number" },
    { key: "long", label: "Longitude", type: "number" },
    { key: "remark", label: "Remark" },
];
const HEALTH_FIELDS = [
    { key: "name", label: "Name" },
    { key: "amenity", label: "Amenity" },
    { key: "healthcare", label: "Healthcare Type" },
    { key: "operator_t", label: "Operator" },
    { key: "capacity_p", label: "Capacity" },
    { key: "addr_city", label: "City" },
];
const EDUCATION_FIELDS = [
    { key: "name", label: "Name" },
    { key: "amenity", label: "Amenity" },
    { key: "operator_t", label: "Operator" },
    { key: "capacity_p", label: "Capacity" },
    { key: "addr_city", label: "City" },
];
const SETTLEMENT_FIELDS = [
    { key: "name", label: "Name" },
    { key: "place", label: "Place Type" },
    { key: "population", label: "Population" },
    { key: "is_in", label: "Region" },
];

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>("Overview");
    const [editTarget, setEditTarget] = useState<{ entity: string; row: Record<string, unknown> } | null>(null);
    const [deletingId, setDeletingId] = useState<string | number | null>(null);
    const qc = useQueryClient();

    // ── Queries ───────────────────────────────────────────────────────────────
    const statsQ = useQuery(trpc.admin.getStats.queryOptions());
    const usersQ = useQuery({ ...trpc.admin.getUsers.queryOptions(), enabled: activeTab === "Users" });
    const roadsQ = useQuery({ ...trpc.admin.getRoadSigns.queryOptions(), enabled: activeTab === "Road Signs" });
    const healthQ = useQuery({ ...trpc.admin.getHealth.queryOptions(), enabled: activeTab === "Health" });
    const educationQ = useQuery({ ...trpc.admin.getEducation.queryOptions(), enabled: activeTab === "Education" });
    const settlementsQ = useQuery({ ...trpc.admin.getSettlements.queryOptions(), enabled: activeTab === "Settlements" });

    // ── Delete mutations ──────────────────────────────────────────────────────
    const deleteUser = useMutation({
        mutationFn: (id: string) => trpcClient.admin.deleteUser.mutate({ id }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "getUsers"] }); toast.success("User deleted"); },
        onError: () => toast.error("Failed to delete user"),
    });
    const deleteRoadSign = useMutation({
        mutationFn: (id: string) => trpcClient.admin.deleteRoadSign.mutate({ id }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "getRoadSigns"] }); toast.success("Road sign deleted"); },
        onError: () => toast.error("Failed to delete road sign"),
    });
    const deleteHealth = useMutation({
        mutationFn: (gid: number) => trpcClient.admin.deleteHealth.mutate({ gid }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "getHealth"] }); toast.success("Health facility deleted"); },
        onError: () => toast.error("Failed to delete health facility"),
    });
    const deleteEducation = useMutation({
        mutationFn: (gid: number) => trpcClient.admin.deleteEducation.mutate({ gid }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "getEducation"] }); toast.success("Education facility deleted"); },
        onError: () => toast.error("Failed to delete education facility"),
    });
    const deleteSettlement = useMutation({
        mutationFn: (gid: number) => trpcClient.admin.deleteSettlement.mutate({ gid }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "getSettlements"] }); toast.success("Settlement deleted"); },
        onError: () => toast.error("Failed to delete settlement"),
    });

    // ── Update mutations ──────────────────────────────────────────────────────
    const updateRoadSign = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
            trpcClient.admin.updateRoadSign.mutate({ id, data: data as Parameters<typeof trpcClient.admin.updateRoadSign.mutate>[0]["data"] }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "getRoadSigns"] }); toast.success("Road sign updated"); setEditTarget(null); },
        onError: () => toast.error("Failed to update road sign"),
    });
    const updateHealth = useMutation({
        mutationFn: ({ gid, data }: { gid: number; data: Record<string, unknown> }) =>
            trpcClient.admin.updateHealth.mutate({ gid, data: data as Parameters<typeof trpcClient.admin.updateHealth.mutate>[0]["data"] }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "getHealth"] }); toast.success("Health facility updated"); setEditTarget(null); },
        onError: () => toast.error("Failed to update health facility"),
    });
    const updateEducation = useMutation({
        mutationFn: ({ gid, data }: { gid: number; data: Record<string, unknown> }) =>
            trpcClient.admin.updateEducation.mutate({ gid, data: data as Parameters<typeof trpcClient.admin.updateEducation.mutate>[0]["data"] }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "getEducation"] }); toast.success("Education facility updated"); setEditTarget(null); },
        onError: () => toast.error("Failed to update education facility"),
    });
    const updateSettlement = useMutation({
        mutationFn: ({ gid, data }: { gid: number; data: Record<string, unknown> }) =>
            trpcClient.admin.updateSettlement.mutate({ gid, data: data as Parameters<typeof trpcClient.admin.updateSettlement.mutate>[0]["data"] }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "getSettlements"] }); toast.success("Settlement updated"); setEditTarget(null); },
        onError: () => toast.error("Failed to update settlement"),
    });

    // ── Save handler ──────────────────────────────────────────────────────────
    function handleSave(data: Record<string, unknown>) {
        if (!editTarget) return;
        const { entity, row } = editTarget;
        if (entity === "roadSign") updateRoadSign.mutate({ id: row.id as string, data });
        else if (entity === "health") updateHealth.mutate({ gid: row.gid as number, data });
        else if (entity === "education") updateEducation.mutate({ gid: row.gid as number, data });
        else if (entity === "settlement") updateSettlement.mutate({ gid: row.gid as number, data });
    }

    function isSaving() {
        return updateRoadSign.isPending || updateHealth.isPending || updateEducation.isPending || updateSettlement.isPending;
    }

    function getModalFields() {
        if (!editTarget) return [];
        if (editTarget.entity === "roadSign") return ROAD_SIGN_FIELDS;
        if (editTarget.entity === "health") return HEALTH_FIELDS;
        if (editTarget.entity === "education") return EDUCATION_FIELDS;
        if (editTarget.entity === "settlement") return SETTLEMENT_FIELDS;
        return [];
    }

    // ── Delete handler ────────────────────────────────────────────────────────
    function handleDelete(entity: string, id: string | number) {
        setDeletingId(id);
        const done = () => setDeletingId(null);
        if (entity === "user") deleteUser.mutate(id as string, { onSettled: done });
        else if (entity === "roadSign") deleteRoadSign.mutate(id as string, { onSettled: done });
        else if (entity === "health") deleteHealth.mutate(id as number, { onSettled: done });
        else if (entity === "education") deleteEducation.mutate(id as number, { onSettled: done });
        else if (entity === "settlement") deleteSettlement.mutate(id as number, { onSettled: done });
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Manage all map data and application settings</p>
                </div>
                <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    ← Back to App
                </a>
            </div>

            <div className="p-6 space-y-6">
                {/* Tabs */}
                <div className="flex gap-1 border-b overflow-x-auto">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                activeTab === tab
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Overview */}
                {activeTab === "Overview" && (
                    <div className="space-y-6">
                        <AdminStats stats={statsQ.data} isLoading={statsQ.isLoading} />
                        <div className="border rounded-xl p-4 bg-card space-y-2">
                            <h3 className="font-semibold">Quick Navigation</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {(["Users", "Road Signs", "Health", "Education", "Settlements"] as Tab[]).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className="border rounded-lg p-3 text-sm text-left hover:bg-muted/50 transition-colors"
                                    >
                                        Manage {tab} →
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Users */}
                {activeTab === "Users" && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Users</h2>
                        <AdminTable
                            columns={[
                                { key: "id", label: "ID" },
                                { key: "name", label: "Name" },
                                { key: "email", label: "Email" },
                                { key: "emailVerified", label: "Verified" },
                                { key: "createdAt", label: "Created" },
                            ]}
                            data={usersQ.data?.map((u) => ({
                                ...u,
                                emailVerified: u.emailVerified ? "Yes" : "No",
                                createdAt: new Date(u.createdAt).toLocaleDateString(),
                            })) as Record<string, unknown>[]}
                            isLoading={usersQ.isLoading}
                            idKey="id"
                            onEdit={() => {}} // users are read-only in admin
                            onDelete={(id) => handleDelete("user", id)}
                            deletingId={deletingId}
                        />
                    </div>
                )}

                {/* Road Signs */}
                {activeTab === "Road Signs" && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Road Signs</h2>
                        <AdminTable
                            columns={[
                                { key: "id", label: "ID" },
                                { key: "objectid", label: "Object ID" },
                                { key: "signType", label: "Sign Type" },
                                { key: "lat", label: "Lat" },
                                { key: "long", label: "Long" },
                                { key: "remark", label: "Remark" },
                            ]}
                            data={roadsQ.data as Record<string, unknown>[] | undefined}
                            isLoading={roadsQ.isLoading}
                            idKey="id"
                            onEdit={(row) => setEditTarget({ entity: "roadSign", row })}
                            onDelete={(id) => handleDelete("roadSign", id)}
                            deletingId={deletingId}
                        />
                    </div>
                )}

                {/* Health */}
                {activeTab === "Health" && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Health Facilities</h2>
                        <AdminTable
                            columns={[
                                { key: "gid", label: "GID" },
                                { key: "name", label: "Name" },
                                { key: "amenity", label: "Amenity" },
                                { key: "healthcare", label: "Healthcare" },
                                { key: "operator_t", label: "Operator" },
                                { key: "addr_city", label: "City" },
                            ]}
                            data={healthQ.data as Record<string, unknown>[] | undefined}
                            isLoading={healthQ.isLoading}
                            idKey="gid"
                            onEdit={(row) => setEditTarget({ entity: "health", row })}
                            onDelete={(id) => handleDelete("health", id)}
                            deletingId={deletingId}
                        />
                    </div>
                )}

                {/* Education */}
                {activeTab === "Education" && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Education Facilities</h2>
                        <AdminTable
                            columns={[
                                { key: "gid", label: "GID" },
                                { key: "name", label: "Name" },
                                { key: "amenity", label: "Amenity" },
                                { key: "operator_t", label: "Operator" },
                                { key: "capacity_p", label: "Capacity" },
                                { key: "addr_city", label: "City" },
                            ]}
                            data={educationQ.data as Record<string, unknown>[] | undefined}
                            isLoading={educationQ.isLoading}
                            idKey="gid"
                            onEdit={(row) => setEditTarget({ entity: "education", row })}
                            onDelete={(id) => handleDelete("education", id)}
                            deletingId={deletingId}
                        />
                    </div>
                )}

                {/* Settlements */}
                {activeTab === "Settlements" && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Settlements</h2>
                        <AdminTable
                            columns={[
                                { key: "gid", label: "GID" },
                                { key: "name", label: "Name" },
                                { key: "place", label: "Place Type" },
                                { key: "population", label: "Population" },
                                { key: "is_in", label: "Region" },
                            ]}
                            data={settlementsQ.data as Record<string, unknown>[] | undefined}
                            isLoading={settlementsQ.isLoading}
                            idKey="gid"
                            onEdit={(row) => setEditTarget({ entity: "settlement", row })}
                            onDelete={(id) => handleDelete("settlement", id)}
                            deletingId={deletingId}
                        />
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editTarget && (
                <AdminEditModal
                    title={`Edit ${editTarget.entity}`}
                    fields={getModalFields()}
                    initialData={editTarget.row}
                    onSave={handleSave}
                    onClose={() => setEditTarget(null)}
                    loading={isSaving()}
                />
            )}
        </div>
    );
}
