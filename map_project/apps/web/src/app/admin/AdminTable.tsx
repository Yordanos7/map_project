"use client";

import { Button } from "@map_project/ui/components/button";
import { Skeleton } from "@map_project/ui/components/skeleton";
import { Pencil, Trash2 } from "lucide-react";

interface Column {
    key: string;
    label: string;
}

interface AdminTableProps<T extends Record<string, unknown>> {
    columns: Column[];
    data: T[] | undefined;
    isLoading: boolean;
    idKey: string;
    onEdit: (row: T) => void;
    onDelete: (id: string | number) => void;
    deletingId?: string | number | null;
}

export default function AdminTable<T extends Record<string, unknown>>({
    columns,
    data,
    isLoading,
    idKey,
    onEdit,
    onDelete,
    deletingId,
}: AdminTableProps<T>) {
    if (isLoading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-md" />
                ))}
            </div>
        );
    }

    if (!data?.length) {
        return <p className="text-muted-foreground text-sm py-6 text-center">No records found.</p>;
    }

    return (
        <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
                <thead className="bg-muted/50">
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                                {col.label}
                            </th>
                        ))}
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {data.map((row) => {
                        const id = row[idKey] as string | number;
                        return (
                            <tr key={id} className="hover:bg-muted/30 transition-colors">
                                {columns.map((col) => (
                                    <td key={col.key} className="px-4 py-3 max-w-[200px] truncate">
                                        {String(row[col.key] ?? "—")}
                                    </td>
                                ))}
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button size="icon" variant="ghost" onClick={() => onEdit(row)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => onDelete(id)}
                                            disabled={deletingId === id}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
