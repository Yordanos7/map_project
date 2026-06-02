"use client";

import { Button } from "@map_project/ui/components/button";
import { Input } from "@map_project/ui/components/input";
import { Label } from "@map_project/ui/components/label";
import { useEffect, useState } from "react";

interface AdminEditModalProps {
    title: string;
    fields: { key: string; label: string; type?: string }[];
    initialData: Record<string, unknown>;
    onSave: (data: Record<string, unknown>) => void;
    onClose: () => void;
    loading?: boolean;
}

export default function AdminEditModal({
    title,
    fields,
    initialData,
    onSave,
    onClose,
    loading,
}: AdminEditModalProps) {
    const [form, setForm] = useState<Record<string, unknown>>(initialData);

    useEffect(() => {
        setForm(initialData);
    }, [initialData]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
                <h2 className="text-lg font-semibold">{title}</h2>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {fields.map((f) => (
                        <div key={f.key} className="space-y-1">
                            <Label htmlFor={f.key}>{f.label}</Label>
                            <Input
                                id={f.key}
                                type={f.type ?? "text"}
                                value={String(form[f.key] ?? "")}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value,
                                    }))
                                }
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={() => onSave(form)} disabled={loading}>
                        {loading ? "Saving…" : "Save"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
