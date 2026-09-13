"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import { toast } from "sonner";
import {
  Pencil,
  Check,
  X,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Loader2,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type NavRow = {
  id: string;
  sortOrder: number;
  label: string;
  value: string;
  enabled: boolean;
};

const TARGET_OPTIONS = [
  { value: "all", label: "All Tables", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { value: "first", label: "Miền Đông", color: "text-blue-700 bg-blue-50 border-blue-200" },
  { value: "second", label: "Miền Trung", color: "text-amber-700 bg-amber-50 border-amber-200" },
  { value: "third", label: "Miền Nam", color: "text-purple-700 bg-purple-50 border-purple-200" },
  { value: "fourth", label: "Miền Bắc", color: "text-rose-700 bg-rose-50 border-rose-200" },
] as const;

function getTargetBadge(val: string) {
  // Normalize legacy values
  let normalized = val;
  if (!val || val === "Thông Tin Kết Quả") normalized = "all";
  else if (val.includes("Đông")) normalized = "first";
  else if (val.includes("Trung")) normalized = "second";
  else if (val.includes("Nam")) normalized = "third";
  else if (val.includes("Bắc")) normalized = "fourth";

  const opt = TARGET_OPTIONS.find((o) => o.value === normalized) || {
    label: val,
    color: "text-zinc-700 bg-zinc-50 border-zinc-200",
  };

  return (
    <span className={`inline-flex items-center text-xs font-medium border px-2 py-0.5 rounded ${opt.color}`}>
      {opt.label}
    </span>
  );
}

export default function NavLabelsSettings() {
  const utils = trpc.useUtils();

  const { data: dbLabels, isLoading } = trpc.getNavLabels.useQuery();

  const [rows, setRows] = useState<NavRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ label: string; value: string }>({
    label: "",
    value: "all",
  });
  const [addingNew, setAddingNew] = useState(false);
  const [newDraft, setNewDraft] = useState({ label: "", value: "first", enabled: true });

  useEffect(() => {
    if (dbLabels) {
      setRows(
        dbLabels.map((r: NavRow) => ({
          id: r.id,
          sortOrder: r.sortOrder,
          label: r.label,
          value: r.value || "all",
          enabled: r.enabled,
        }))
      );
    }
  }, [dbLabels]);

  const { mutate: saveLabel, isPending: isSaving } = trpc.saveNavLabel.useMutation({
    onSuccess: () => {
      utils.getNavLabels.invalidate();
      setEditingId(null);
      setAddingNew(false);
      setNewDraft({ label: "", value: "first", enabled: true });
      toast.success("Navigation label saved.");
    },
    onError: (e) => toast.error(e.message),
  });

  const { mutate: deleteLabel, isPending: isDeleting } = trpc.deleteNavLabel.useMutation({
    onSuccess: () => {
      utils.getNavLabels.invalidate();
      toast.success("Navigation label deleted.");
    },
    onError: (e) => toast.error(e.message),
  });

  const { mutate: reorderLabels, isPending: isReordering } = trpc.reorderNavLabels.useMutation({
    onSuccess: () => utils.getNavLabels.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const handleToggle = (id: string, enabled: boolean) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    saveLabel({ id, label: row.label, value: row.value, sortOrder: row.sortOrder, enabled });
  };

  const startEdit = (row: NavRow) => {
    // Normalize target value if needed
    let val = row.value;
    if (!val || val === "Thông Tin Kết Quả") val = "all";
    else if (val.includes("Đông")) val = "first";
    else if (val.includes("Trung")) val = "second";
    else if (val.includes("Nam")) val = "third";
    else if (val.includes("Bắc")) val = "fourth";

    setEditDraft({ label: row.label, value: val });
    setEditingId(row.id);
  };

  const confirmEdit = (row: NavRow) => {
    if (!editDraft.label.trim()) {
      toast.error("Label cannot be empty.");
      return;
    }
    saveLabel({
      id: row.id,
      label: editDraft.label.trim(),
      value: editDraft.value,
      sortOrder: row.sortOrder,
      enabled: row.enabled,
    });
  };

  const confirmAdd = () => {
    if (!newDraft.label.trim()) {
      toast.error("Label cannot be empty.");
      return;
    }
    const nextOrder = rows.length > 0 ? Math.max(...rows.map((r) => r.sortOrder)) + 1 : 0;
    saveLabel({
      label: newDraft.label.trim(),
      value: newDraft.value,
      sortOrder: nextOrder,
      enabled: newDraft.enabled,
    });
  };

  const move = (index: number, direction: "up" | "down") => {
    const next = [...rows];
    const swap = direction === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    const reordered = next.map((r, i) => ({ ...r, sortOrder: i }));
    setRows(reordered);
    reorderLabels(reordered.map((r) => ({ id: r.id, sortOrder: r.sortOrder })));
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading navigation labels...
      </div>
    );
  }

  const isWorking = isSaving || isDeleting || isReordering;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage header navigation tabs and point each tab to its target lottery table. You can freely rename labels without breaking table filters.
        </p>
        <Button
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => { setAddingNew(true); setEditingId(null); setNewDraft({ label: "", value: "first", enabled: true }); }}
          disabled={addingNew || isWorking}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Tab
        </Button>
      </div>

      <div className="rounded border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium text-xs uppercase tracking-wide">
              <th className="px-3 py-2.5 w-8 text-center">#</th>
              <th className="px-3 py-2.5 text-left">Display Label</th>
              <th className="px-3 py-2.5 text-left w-52">Target Table</th>
              <th className="px-3 py-2.5 text-center w-20">Visible</th>
              <th className="px-3 py-2.5 text-center w-28">Order</th>
              <th className="px-3 py-2.5 text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isEditingThis = editingId === row.id;
              return (
                <tr
                  key={row.id}
                  className={`border-b border-zinc-100 last:border-b-0 transition-colors ${isEditingThis ? "bg-primary/5" : "hover:bg-zinc-50"
                    }`}
                >
                  <td className="px-3 py-2.5 text-center">
                    <GripVertical className="h-3.5 w-3.5 inline text-zinc-300" />
                  </td>
                  <td className="px-3 py-2.5">
                    {isEditingThis ? (
                      <Input
                        className="h-7 text-sm"
                        value={editDraft.label}
                        onChange={(e) => setEditDraft((p) => ({ ...p, label: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmEdit(row);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        placeholder="e.g. Sổ Kết Quả Miền Nam"
                      />
                    ) : (
                      <span className={`font-medium ${!row.enabled ? "text-zinc-400 line-through" : "text-zinc-800"}`}>
                        {row.label}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {isEditingThis ? (
                      <select
                        className="h-7 text-xs rounded border border-input bg-background px-2 py-1 font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-full"
                        value={editDraft.value}
                        onChange={(e) => setEditDraft((p) => ({ ...p, value: e.target.value }))}
                      >
                        {TARGET_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      getTargetBadge(row.value)
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Switch
                      checked={row.enabled}
                      onCheckedChange={(checked) => handleToggle(row.id, checked)}
                      disabled={isWorking}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-6 w-6"
                        onClick={() => move(index, "up")}
                        disabled={index === 0 || isWorking}
                        title="Move up"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-6 w-6"
                        onClick={() => move(index, "down")}
                        disabled={index === rows.length - 1 || isWorking}
                        title="Move down"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      {isEditingThis ? (
                        <>
                          <Button
                            variant="ghost" size="icon"
                            className="h-6 w-6 text-primary hover:text-primary/80"
                            onClick={() => confirmEdit(row)} disabled={isSaving}
                          >
                            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-6 w-6 text-zinc-400 hover:text-zinc-600"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost" size="icon"
                            className="h-6 w-6 text-zinc-400 hover:text-primary"
                            onClick={() => startEdit(row)} disabled={isWorking}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-6 w-6 text-zinc-400 hover:text-red-500"
                            onClick={() => {
                              if (rows.length <= 1) { toast.error("Cannot delete the last navigation label."); return; }
                              if (confirm(`Delete "${row.label}"?`)) deleteLabel({ id: row.id });
                            }}
                            disabled={isWorking || rows.length <= 1}
                          >
                            {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {addingNew && (
              <tr className="border-t-2 border-dashed border-primary/40 bg-primary/5">
                <td className="px-3 py-2.5 text-center text-zinc-300">
                  <Plus className="h-3.5 w-3.5 inline" />
                </td>
                <td className="px-3 py-2.5">
                  <Input
                    className="h-7 text-sm"
                    value={newDraft.label}
                    onChange={(e) => setNewDraft((p) => ({ ...p, label: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmAdd();
                      if (e.key === "Escape") { setAddingNew(false); setNewDraft({ label: "", value: "first", enabled: true }); }
                    }}
                    autoFocus
                    placeholder="Tab display label..."
                  />
                </td>
                <td className="px-3 py-2.5">
                  <select
                    className="h-7 text-xs rounded border border-input bg-background px-2 py-1 font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-full"
                    value={newDraft.value}
                    onChange={(e) => setNewDraft((p) => ({ ...p, value: e.target.value }))}
                  >
                    {TARGET_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <Switch
                    checked={newDraft.enabled}
                    onCheckedChange={(checked) => setNewDraft((p) => ({ ...p, enabled: checked }))}
                  />
                </td>
                <td />
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost" size="icon"
                      className="h-6 w-6 text-primary hover:text-primary/80"
                      onClick={confirmAdd} disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-6 w-6 text-zinc-400 hover:text-zinc-600"
                      onClick={() => { setAddingNew(false); setNewDraft({ label: "", value: "first", enabled: true }); }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            )}

            {rows.length === 0 && !addingNew && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400 text-sm">
                  No navigation labels found. Click &ldquo;Add Tab&rdquo; to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed">
        <strong>Tip:</strong> You can edit the <strong>Display Label</strong> to anything (e.g. rename to English, Khmer, or shorten the name). As long as the <strong>Target Table</strong> is selected, it will always show the correct lottery results without breaking.
      </p>
    </div>
  );
}
