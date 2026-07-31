"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { trpc } from "@/app/_trpc/client";
import { formatDisplayDateTime } from "@/lib/utils";
import {
  Prize,
  LocationData,
  LotteryPeriod,
  LotteryState,
} from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChevronDownIcon,
  CheckCircle2,
  Loader2,
  DatabaseZap,
  Pencil,
  Check,
  X,
  Pen,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import LotterySettingDialog from "./_component/lottery-setting-dialog";

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Period grid editor — renders one table per period with textarea column inputs
// ---------------------------------------------------------------------------
interface PeriodEditorProps {
  periodData: LotteryPeriod;
  sessionId: string;
  onSaved: () => void;
}

function PeriodEditor({ periodData, sessionId, onSaved }: PeriodEditorProps) {

  console.log(periodData)

  if (!periodData?.data?.length) return null;
  const locations: LocationData[] = periodData.data;
  const isNorthern = periodData.displayTable === "fourth"

  // Build the list of expected prize labels matching visual table layout exactly
  const getPrizesMeta = () => {
    const list: { key: string; label: string }[] = [];
    if (isNorthern) {
      list.push({ key: "db", label: "Đ. B" });
      list.push({ key: "gOne", label: "Gi 1" });
      list.push({ key: "gTwo", label: "Gi 2 (1)" });
      list.push({ key: "gTwo", label: "Gi 2 (2)" });
      for (let i = 1; i <= 6; i++)
        list.push({ key: "gThree", label: `Gi 3 (${i})` });
      for (let i = 1; i <= 4; i++)
        list.push({ key: "gFour", label: `Gi 4 (${i})` });
      for (let i = 1; i <= 6; i++)
        list.push({ key: "gFive", label: `Gi 5 (${i})` });
      for (let i = 1; i <= 3; i++)
        list.push({ key: "gSix", label: `Gi 6 (${i})` });
      for (let i = 1; i <= 4; i++)
        list.push({ key: "gSeven", label: `Gi 7 (${i})` });
    } else {
      list.push({ key: "gEight", label: "Gi 8" });
      list.push({ key: "gSeven", label: "Gi 7" });
      for (let i = 1; i <= 3; i++)
        list.push({ key: "gSix", label: `Gi 6 (${i})` });
      list.push({ key: "gFive", label: "Gi 5" });
      for (let i = 1; i <= 7; i++)
        list.push({ key: "gFour", label: `Gi 4 (${i})` });
      for (let i = 1; i <= 2; i++)
        list.push({ key: "gThree", label: `Gi 3 (${i})` });
      list.push({ key: "gTwo", label: "Gi 2" });
      list.push({ key: "gOne", label: "Gi 1" });
      list.push({ key: "db", label: "Đ. B" });
    }
    return list;
  };

  const prizeMeta = getPrizesMeta();
  const expectedCount = prizeMeta.length;
  const utils = trpc.useUtils();

  // Helper to extract ordered prizes for a location in correct layout order
  const getOrderedPrizes = (loc: LocationData): Prize[] => {
    const prizes: Prize[] = [];
    const keys: (keyof LocationData)[] = isNorthern
      ? ["db", "gOne", "gTwo", "gThree", "gFour", "gFive", "gSix", "gSeven"]
      : [
        "gEight",
        "gSeven",
        "gSix",
        "gFive",
        "gFour",
        "gThree",
        "gTwo",
        "gOne",
        "db",
      ];

    for (const key of keys) {
      const group = loc[key];
      if (Array.isArray(group)) prizes.push(...group);
    }
    return prizes;
  };

  const getInitialText = (loc: LocationData) => {
    return getOrderedPrizes(loc)
      .map((pz) => pz.value ?? "")
      .join("\n");
  };

  const [columnTexts, setColumnTexts] = useState<Record<string, string>>({});
  const [dirtyColumns, setDirtyColumns] = useState<Set<string | number>>(new Set());
  const dirty = dirtyColumns.size > 0;

  // ── Inline edit state for location headers ──────────────────────────────
  type LocationEdit = { location: string; code: string };
  const [locationEdits, setLocationEdits] = useState<
    Record<string, LocationEdit>
  >({});
  const [editingLocId, setEditingLocId] = useState<string | null>(null);

  // ── Inline edit state for prize labels ─────────────────────────────────
  // Seed from DB prizeLabels (string[] stored per session) or fall back to static defaults
  const getInitialLabels = () =>
    prizeMeta.map(
      (pm, idx) =>
        (periodData.prizeLabels as string[] | null)?.[idx] ?? pm.label,
    );
  const [labelEdits, setLabelEdits] = useState<string[]>(getInitialLabels);
  const [editingLabelIdx, setEditingLabelIdx] = useState<number | null>(null);
  const [labelDraft, setLabelDraft] = useState("");

  // Sync if parent updates (e.g. on invalidation / refetch)
  useEffect(() => {
    const initialTexts: Record<string, string> = {};
    locations.forEach((loc: LocationData, idx: number) => {
      initialTexts[loc.code || idx] = getInitialText(loc);
    });
    setColumnTexts(initialTexts);
    setDirtyColumns(new Set());
    // Reset location edits to reflect new data
    const initLocEdits: Record<string, LocationEdit> = {};
    locations.forEach((loc: LocationData) => {
      if (loc._id)
        initLocEdits[loc._id] = { location: loc.location, code: loc.code };
    });
    setLocationEdits(initLocEdits);
    // Reset label edits — prefer DB values, fall back to static defaults
    setLabelEdits(
      prizeMeta.map(
        (pm, idx) =>
          (periodData.prizeLabels as string[] | null)?.[idx] ?? pm.label,
      ),
    );
  }, [periodData]);

  const { mutate: updateLocation, isPending: isUpdatingLocation } =
    trpc.updateLotteryLocation.useMutation({
      onSuccess: () => {
        utils.getLotteryByDate.invalidate();
        setEditingLocId(null);
      },
    });

  const handleLocationSave = (locId: string) => {
    const edit = locationEdits[locId];
    if (!edit || !edit.location.trim() || !edit.code.trim()) return;
    updateLocation({
      locationId: locId,
      location: edit.location.trim(),
      code: edit.code.trim(),
    });
  };

  const handleLocationCancel = (loc: LocationData) => {
    if (loc._id) {
      setLocationEdits((prev) => ({
        ...prev,
        [loc._id!]: { location: loc.location, code: loc.code },
      }));
    }
    setEditingLocId(null);
  };

  const handleLabelEdit = (idx: number) => {
    setLabelDraft(labelEdits[idx]);
    setEditingLabelIdx(idx);
  };

  const { mutate: persistLabels, isPending: isSavingLabel } =
    trpc.updatePrizeLabels.useMutation({
      onSuccess: () => utils.getLotteryByDate.invalidate(),
    });

  const handleLabelSave = (idx: number) => {
    if (!labelDraft.trim()) return;
    const next = [...labelEdits];
    next[idx] = labelDraft.trim();
    setLabelEdits(next);
    setEditingLabelIdx(null);
    // Persist full updated array to DB
    persistLabels({ sessionId, labels: next });
  };

  const handleLabelCancel = () => setEditingLabelIdx(null);

  const { mutate: savePrizes, isPending } =
    trpc.upsertLotteryPrizes.useMutation({
      onSuccess: () => {
        onSaved();
        utils.getLotteryByDate.invalidate();
        toast.success("success");
      },
      onError(error) {
        toast.error(error.message);
      },
    });

  const getNormalizedLines = (rawText: string) => {
    let rawLines = (rawText ?? "").split("\n").filter(Boolean);
    // If last line is empty and we have one extra line, remove it (typical copy-paste artifact)
    if (
      rawLines.length === expectedCount + 1 &&
      rawLines[expectedCount] === ""
    ) {
      rawLines = rawLines.slice(0, expectedCount);
    }
    return rawLines;
  };

  const handleCancel = () => {
    const initialTexts: Record<string, string> = {};
    locations.forEach((loc: LocationData, idx: number) => {
      initialTexts[loc.code || idx] = getInitialText(loc);
    });
    setColumnTexts(initialTexts);
    setDirtyColumns(new Set());
  };

  const handleSave = () => {
    const allUpdates: { prizeId: string; value: string }[] = [];
    const savedLocKeys: (string | number)[] = [];

    locations.forEach((loc: LocationData, idx: number) => {
      const locKey = loc.code || idx;
      const text = columnTexts[locKey] ?? "";
      const currentLines = getNormalizedLines(text);
      const isValid = currentLines.length <= expectedCount;

      // Only save valid dirty columns
      if (!dirtyColumns.has(locKey) || !isValid) return;

      const orderedPrizes = getOrderedPrizes(loc);
      orderedPrizes.forEach((pz: Prize, pzIdx: number) => {
        if (!pz.id) return;
        allUpdates.push({
          prizeId: pz.id,
          value: currentLines[pzIdx] ?? "",
        });
      });
      savedLocKeys.push(locKey);
    });

    if (allUpdates.length === 0) return;

    savePrizes(allUpdates, {
      onSuccess: () => {
        setDirtyColumns((prev) => {
          const next = new Set(prev);
          savedLocKeys.forEach((key) => next.delete(key));
          return next;
        });
      },
    });
  };


  const columnStatus = locations.map((loc: LocationData, idx: number) => {
    const locKey = loc.code || idx;
    const text = columnTexts[locKey] ?? "";
    const currentLines = getNormalizedLines(text);
    const isValid = currentLines.length <= expectedCount;
    return { locKey, isValid, count: currentLines.length };
  });

  // Check if any dirty column is valid (for enabling the Save button)
  const hasValidDirtyColumn = columnStatus.some(
    (status) => dirtyColumns.has(status.locKey) && status.isValid
  );

  return (
    <div className="flex gap-4">
      <div className="overflow-x-auto rounded-xs flex-col  w-full flex justify-center items-center ">
        <table className="w-full max-w-4xl border border-zinc-200  min-w-150 border-collapse text-sm">
          <thead>
            <tr className="bg-primary/5 border-b border-zinc-200">
              <th className="px-3 py-2.5 text-left font-semibold text-zinc-500 w-[140px]">
                Giải
              </th>
              {locations.map((loc: LocationData, i: number) => {
                const locId = loc._id ?? String(i);
                const isEditingThis = editingLocId === locId;
                const draft = locationEdits[locId] ?? {
                  location: loc.location,
                  code: loc.code,
                };
                return (
                  <th
                    key={i}
                    className="px-3 py-2.5 text-center font-bold text-zinc-800 border-l border-zinc-100"
                  >
                    {isEditingThis ? (
                      <div className="flex flex-col gap-1 min-w-30">
                        <input
                          className="w-full text-center text-sm font-bold border border-primary/50 rounded px-1 py-0.5 outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                          value={draft.location}
                          onChange={(e) =>
                            setLocationEdits((prev) => ({
                              ...prev,
                              [locId]: { ...draft, location: e.target.value },
                            }))
                          }
                          placeholder="Location name"
                          autoFocus
                        />
                        <input
                          className="w-full text-center text-xs font-semibold border border-primary/30 rounded px-1 py-0.5 outline-none focus:ring-2 focus:ring-primary/20 bg-white uppercase text-primary"
                          value={draft.code}
                          onChange={(e) =>
                            setLocationEdits((prev) => ({
                              ...prev,
                              [locId]: { ...draft, code: e.target.value },
                            }))
                          }
                          placeholder="CODE"
                        />
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <button
                            onClick={() => handleLocationSave(locId)}
                            disabled={isUpdatingLocation}
                            className="flex items-center gap-0.5 text-xs px-2 py-0.5 rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                          >
                            {isUpdatingLocation ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            Save
                          </button>
                          <button
                            onClick={() => handleLocationCancel(loc)}
                            className="flex items-center gap-0.5 text-xs px-2 py-0.5 rounded border border-zinc-300 text-zinc-600 hover:bg-zinc-50 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="group relative flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1">
                          <span>{draft.location}</span>
                          <button
                            onClick={() => setEditingLocId(locId)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-primary"
                            title="Edit location"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-xs font-semibold text-primary uppercase">
                          {draft.code}
                        </div>
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* Left labels column */}
              <td className="px-3 py-2 border-r border-zinc-200 align-top bg-zinc-50/50">
                <div className="flex flex-col font-mono text-sm select-none py-2 gap-0">
                  {prizeMeta.map((pm, idx) => (
                    <div
                      key={idx}
                      className="h-7 flex items-center justify-between text-zinc-500 pr-2 border-b border-zinc-100 last:border-b-0"
                    >
                      {editingLabelIdx === idx ? (
                        <div className="flex items-center gap-1 w-full">
                          <input
                            className="flex-1 min-w-0 text-xs font-semibold border border-primary/50 rounded px-1 py-0 outline-none focus:ring-1 focus:ring-primary/20 bg-white text-zinc-700 h-5"
                            value={labelDraft}
                            onChange={(e) => setLabelDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleLabelSave(idx);
                              if (e.key === "Escape") handleLabelCancel();
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleLabelSave(idx)}
                            disabled={isSavingLabel}
                            className="text-primary hover:text-primary/80 transition-colors shrink-0 disabled:opacity-50"
                          >
                            {isSavingLabel ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={handleLabelCancel}
                            className="text-zinc-400 hover:text-zinc-600 transition-colors shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="group flex items-center gap-1 w-full">
                          <span className="font-semibold text-zinc-700 flex-1">
                            {labelEdits[idx] ?? pm.label}
                          </span>
                          <button
                            onClick={() => handleLabelEdit(idx)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-primary shrink-0"
                            title="Edit label"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </td>

              {/* Location textarea columns */}
              {locations.map((loc: LocationData, li: number) => {

                const locKey = loc.code || li;
                let text = columnTexts[locKey];
                const hasNumber = /\d/.test(text);
                if (!hasNumber) text = "";
                const status = columnStatus.find((s) => s.locKey === locKey);
                const isValid = status?.isValid ?? false;
                const lineCount = status?.count ?? 0;

                return (
                  <td
                    key={li}
                    className="p-2 border-r border-border last:border-r-0 align-top"
                  >
                    <div className="flex flex-col gap-2">

                      <textarea
                        value={text}
                        onChange={(e) => {
                          // Normal typing
                          setColumnTexts((prev) => ({
                            ...prev,
                            [locKey]: e.target.value,
                          }));
                          setDirtyColumns((prev) => new Set(prev).add(locKey));
                        }}
                        onPaste={(e) => {
                          e.preventDefault();

                          const pasted = e.clipboardData.getData("text");

                          const clean = pasted
                            .split(/\r?\n/)
                            .map((v) => v.trim())
                            .filter((v) => /^\d+$/.test(v)); // keep only digit lines, preserve leading zeros

                          const groups: string[] = [];

                          for (let i = 0; i < clean.length; i += expectedCount) {
                            groups.push(clean.slice(i, i + expectedCount).join("\n"));
                          }

                          if (groups.length > 1) {
                            setColumnTexts((prev) => {
                              const next = { ...prev };

                              groups.forEach((group, index) => {
                                if (locations[index]) {
                                  const key = locations[index].code || index;
                                  next[key] = group;
                                }
                              });

                              return next;
                            });
                          } else {
                            setColumnTexts((prev) => ({
                              ...prev,
                              [locKey]: groups[0] ?? "",
                            }));
                          }

                          setDirtyColumns((prev) => new Set(prev).add(locKey));
                        }}
                        className="w-full font-mono text-sm leading-7 py-2 px-3 border border-border rounded-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none transition-all"
                        style={{
                          height: `${expectedCount * 28 + 16}px`, // 28px per line + 16px padding
                        }}
                        placeholder="Type or paste column values..."
                      />

                      <div className="text-sm mt-1">
                        {isValid ? (
                          <span className="text-emerald-600 font-medium">
                            ✓ Valid {lineCount} lines
                          </span>
                        ) : (
                          <span className="text-red-500 font-semibold">
                            ✗ Invalid ({lineCount}/{expectedCount} lines)
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>

        {dirty && (
          <div className="flex justify-end gap-2 self-end mt-2">
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSave}
              disabled={!hasValidDirtyColumn || isPending}
            >
              {isPending && (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              )}
              Save Valid Columns
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isPending}
            >
              Cancel All
            </Button>
          </div>
        )}
      </div>

    </div>
  );
}

// ---------------------------------------------------------------------------
// Main admin page
// ---------------------------------------------------------------------------
export default function AdminPage() {
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD"),
  );
  const [activePeriod, setActivePeriod] = useState<
    "first" | "second" | "third" | "fourth"
  >("first");

  const utils = trpc.useUtils();

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionNameDraft, setSessionNameDraft] = useState("");

  const { mutate: updateSessionName, isPending: isUpdatingSessionName } =
    trpc.updateLotterySessionName.useMutation({
      onSuccess: () => {
        utils.getLotteryByDate.invalidate();
        setEditingSessionId(null);
        toast.success("Session name updated!")
      },
      onError: (e) => toast.error(e.message),
    });

  const handleSessionNameSave = (sessId: string | undefined) => {
    if (!sessId || !sessionNameDraft.trim()) return;
    updateSessionName({
      sessionId: sessId,
      name: sessionNameDraft.trim(),
    });
  };

  // ── Fetch lottery data for selected date ──────────────────────────────────
  const {
    data: lotteryState,
    isLoading,
    isFetching,
  } = trpc.getLotteryByDate.useQuery(
    { date: selectedDate },
    { refetchOnWindowFocus: false },
  );

  // ── Mutations ─────────────────────────────────────────────────────────────
  const { mutate: seedDate, isPending: isSeeding } =
    trpc.seedLotteryDate.useMutation({
      onSuccess: () => {
        utils.getLotteryByDate.invalidate({ date: selectedDate });
        toast.success("Date seeded !")
      },
      onError: (e) => toast.error(e.message),
    });


  const hasData = !!lotteryState;
  const isWorking = isSeeding || isFetching;

  const PERIOD_KEYS = ["first", "second", "third", "fourth"] as const;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Date picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="font-semibold min-w-[130px]"
            >
              {formatDisplayDateTime(selectedDate, undefined, "DD/MM/YYYY")}
              <ChevronDownIcon className="ml-1 w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto" align="start">
            <Calendar
              mode="single"
              selected={dayjs(selectedDate).toDate()}
              onSelect={(date) =>
                date && setSelectedDate(dayjs(date).format("YYYY-MM-DD"))
              }
              defaultMonth={dayjs(selectedDate).toDate()}
            />
          </PopoverContent>
        </Popover>

        {/* Seed / initialize */}
        {/* <Button
          size="sm"
          onClick={() => seedDate({ date: selectedDate })}
          disabled={isWorking}
          className="gap-1.5 "
        >
          {isSeeding ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <DatabaseZap className="w-3.5 h-3.5" />
          )}
          {hasData ? "Re-initialize" : "Initialize Date"}
        </Button> */}

        <LotterySettingDialog />

      </div>

      {/* ── Status hint ─────────────────────────────────────────────────────── */}
      {!hasData && !isLoading && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-zinc-500">
          <DatabaseZap className="mx-auto mb-2 w-8 h-8 text-zinc-300" />
          <p className="font-semibold text-sm">No data for {formatDisplayDateTime(selectedDate)}</p>
          <p className="text-xs mt-1">
            Click <strong>Initialize Date</strong> to create the blank
            structure.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-10 text-foreground text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading ...
        </div>
      )}

      {/* ── Period tabs + editors ────────────────────────────────────────────── */}
      {hasData && !isLoading && (
        <Tabs
          value={activePeriod}
          onValueChange={(val) =>
            setActivePeriod(val as "first" | "second" | "third" | "fourth")
          }
        >
          <TabsList className="flex justify-start w-fit bg-transparent p-0 mb-2 h-auto gap-1">
            {PERIOD_KEYS.map((key) => {
              const session = (lotteryState as LotteryState)?.[key];
              const displayTime = session
                ? formatDisplayDateTime(selectedDate, session.displayNumber, "hh:mm A")
                : "";
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="text-xs md:text-sm transition-all whitespace-nowrap rounded-lg"
                >
                  {displayTime}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {PERIOD_KEYS.map((key) => (
            <TabsContent
              key={key}
              value={key}
              className="focus-visible:ring-0 mt-0"
            >
              {(() => {
                const session = (lotteryState as LotteryState)?.[key];
                if (!session) {
                  return (
                    <div className="text-center text-foreground text-sm py-10">
                      No data for this period.
                    </div>
                  );
                }
                return (
                  <>
                    {/* Section header */}
                    <div className="mb-2 flex items-center justify-center gap-2 h-9">
                      {editingSessionId === session.sessionId ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={sessionNameDraft}
                            onChange={(e) => setSessionNameDraft(e.target.value)}
                            className="px-2 py-1 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary w-64 text-center font-semibold uppercase text-foreground bg-white"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSessionNameSave(session.sessionId);
                              } else if (e.key === "Escape") {
                                setEditingSessionId(null);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSessionNameSave(session.sessionId)}
                            disabled={isUpdatingSessionName || !sessionNameDraft.trim()}
                            className="h-8 w-8 p-0"
                          >
                            {isUpdatingSessionName ? (
                              <Loader2 size={12} className="animate-spin text-primary" />
                            ) : (
                              <Check size={14} className="text-emerald-600" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingSessionId(null)}
                            disabled={isUpdatingSessionName}
                            className="h-8 w-8 p-0"
                          >
                            <X size={14} className="text-rose-600" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-semibold text-foreground uppercase tracking-wide">
                            {session.name}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSessionNameDraft(session.name);
                              setEditingSessionId(session.sessionId || "");
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Pen size={12} className="text-primary" />
                          </Button>
                        </>
                      )}
                    </div>
                    <PeriodEditor
                      periodData={session}
                      sessionId={session.sessionId ?? ""}
                      onSaved={() => { }}
                    />
                  </>
                );
              })()}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
