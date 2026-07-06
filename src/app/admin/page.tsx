"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { trpc } from "@/app/_trpc/client";
import { Prize, LocationData, LotteryPeriod, LotteryState } from "@/lib/mockData";
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
  Trash2,
  RefreshCw,
} from "lucide-react";

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Period grid editor — renders one table per period with textarea column inputs
// ---------------------------------------------------------------------------
interface PeriodEditorProps {
  periodData: LotteryPeriod;
  onSaved: () => void;
}

function PeriodEditor({ periodData, onSaved }: PeriodEditorProps) {
  if (!periodData?.data?.length) return null;
  const locations: LocationData[] = periodData.data;
  const isNorthern = periodData.displayTable === "fourth";

  // Build the list of expected prize labels matching visual table layout exactly
  const getPrizesMeta = () => {
    const list: { key: string; label: string; digits: number }[] = [];
    if (isNorthern) {
      list.push({ key: "db", label: "Đ. B", digits: 5 });
      list.push({ key: "gOne", label: "Gi 1", digits: 5 });
      list.push({ key: "gTwo", label: "Gi 2 (1)", digits: 5 });
      list.push({ key: "gTwo", label: "Gi 2 (2)", digits: 5 });
      for (let i = 1; i <= 6; i++) list.push({ key: "gThree", label: `Gi 3 (${i})`, digits: 5 });
      for (let i = 1; i <= 4; i++) list.push({ key: "gFour", label: `Gi 4 (${i})`, digits: 4 });
      for (let i = 1; i <= 6; i++) list.push({ key: "gFive", label: `Gi 5 (${i})`, digits: 4 });
      for (let i = 1; i <= 3; i++) list.push({ key: "gSix", label: `Gi 6 (${i})`, digits: 3 });
      for (let i = 1; i <= 4; i++) list.push({ key: "gSeven", label: `Gi 7 (${i})`, digits: 2 });
    } else {
      list.push({ key: "gEight", label: "Gi 8", digits: 2 });
      list.push({ key: "gSeven", label: "Gi 7", digits: 3 });
      for (let i = 1; i <= 3; i++) list.push({ key: "gSix", label: `Gi 6 (${i})`, digits: 4 });
      list.push({ key: "gFive", label: "Gi 5", digits: 4 });
      for (let i = 1; i <= 7; i++) list.push({ key: "gFour", label: `Gi 4 (${i})`, digits: 5 });
      for (let i = 1; i <= 2; i++) list.push({ key: "gThree", label: `Gi 3 (${i})`, digits: 5 });
      list.push({ key: "gTwo", label: "Gi 2", digits: 5 });
      list.push({ key: "gOne", label: "Gi 1", digits: 5 });
      list.push({ key: "db", label: "Đ. B", digits: 6 });
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
      : ["gEight", "gSeven", "gSix", "gFive", "gFour", "gThree", "gTwo", "gOne", "db"];

    for (const key of keys) {
      const group = loc[key];
      if (Array.isArray(group)) prizes.push(...group);
    }
    return prizes;
  };

  const getInitialText = (loc: LocationData) => {
    return getOrderedPrizes(loc).map((pz) => pz.value ?? "").join("\n");
  };

  const [columnTexts, setColumnTexts] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  // Sync if parent updates (e.g. on invalidation / refetch)
  useEffect(() => {
    const initialTexts: Record<string, string> = {};
    locations.forEach((loc: LocationData, idx: number) => {
      initialTexts[loc.code || idx] = getInitialText(loc);
    });
    setColumnTexts(initialTexts);
    setDirty(false);
  }, [periodData]);

  const { mutate: savePrizes, isPending } = trpc.upsertLotteryPrizes.useMutation({
    onSuccess: () => {
      setDirty(false);
      onSaved();
      utils.getLotteryByDate.invalidate();
    },
  });

  const getNormalizedLines = (rawText: string) => {
    let rawLines = (rawText ?? "").split("\n").filter(Boolean)
    // If last line is empty and we have one extra line, remove it (typical copy-paste artifact)
    if (rawLines.length === expectedCount + 1 && rawLines[expectedCount] === "") {
      rawLines = rawLines.slice(0, expectedCount);
    }
    return rawLines
  };

  const handleCancel = () => {
    const initialTexts: Record<string, string> = {};
    locations.forEach((loc: LocationData, idx: number) => {
      initialTexts[loc.code || idx] = getInitialText(loc);
    });
    setColumnTexts(initialTexts);
    setDirty(false);
  };

  const handleSave = () => {
    if (!allValid) return;
    const allUpdates: { prizeId: string; value: string }[] = [];

    locations.forEach((loc: LocationData, idx: number) => {
      const locKey = loc.code || idx;
      const text = columnTexts[locKey] ?? "";
      const currentLines = getNormalizedLines(text);
      const orderedPrizes = getOrderedPrizes(loc);

      orderedPrizes.forEach((pz: Prize, pzIdx: number) => {
        if (!pz.id) return; // skip prizes without a DB id (shouldn't happen in save flow)
        allUpdates.push({
          prizeId: pz.id,
          value: currentLines[pzIdx] ?? "",
        });
      });
    });

    savePrizes(allUpdates);
  };

  const columnStatus = locations.map((loc: LocationData, idx: number) => {
    const locKey = loc.code || idx;
    const text = columnTexts[locKey] ?? "";
    const currentLines = getNormalizedLines(text);
    const isValid = currentLines.length === expectedCount;
    return { locKey, isValid, count: currentLines.length };
  });

  type ColumnStatus = { locKey: string | number; isValid: boolean; count: number };
  const allValid = columnStatus.every((status: ColumnStatus) => status.isValid);

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-zinc-200 shadow-sm bg-white">
        <table className="w-full min-w-[600px] border-collapse text-sm">
          <thead>
            <tr className="bg-primary/5 border-b border-zinc-200">
              <th className="px-3 py-2.5 text-left font-semibold text-zinc-500 w-[140px]">Giải</th>
              {locations.map((loc: LocationData, i: number) => (
                <th key={i} className="px-3 py-2.5 text-center font-bold text-zinc-800 border-l border-zinc-100">
                  <div>{loc.location}</div>
                  <div className="text-xs font-semibold text-primary uppercase">{loc.code}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* Left labels column */}
              <td className="px-3 py-2 border-r border-zinc-200 align-top bg-zinc-50/50">
                <div className="flex flex-col font-mono text-xs select-none py-2 gap-0">
                  {prizeMeta.map((pm, idx) => (
                    <div
                      key={idx}
                      className="h-6 flex items-center justify-between text-zinc-500 pr-2 border-b border-zinc-100 last:border-b-0"
                    >
                      <span className="font-semibold text-zinc-700">{pm.label}</span>
                      <span className="text-[10px] text-zinc-400">({pm.digits} digits)</span>
                    </div>
                  ))}
                </div>
              </td>

              {/* Location textarea columns */}
              {locations.map((loc: LocationData, li: number) => {
                const locKey = loc.code || li;
                const text = (columnTexts[locKey] || '').trim();
                const status = columnStatus.find((s) => s.locKey === locKey);
                const isValid = status?.isValid ?? false;
                const lineCount = status?.count ?? 0;

                return (
                  <td key={li} className="p-3 border-r border-border last:border-r-0 align-top">
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={text}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d\n]/g, "").replaceAll(" ", "").trim()
                          setColumnTexts((prev) => ({ ...prev, [locKey]: value }));
                          setDirty(true);
                        }}
                        className="w-full font-mono text-xs leading-6 py-2 px-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none bg-zinc-50/30 hover:bg-zinc-50 focus:bg-white transition-all"
                        style={{
                          height: `${expectedCount * 24 + 16}px`, // 24px per line + 16px padding
                        }}
                        placeholder="Type or paste column values..."
                      />

                      <div className="text-[11px] mt-1">
                        {isValid ? (
                          <span className="text-emerald-600 font-medium">
                            ✓ Valid ({expectedCount}/{expectedCount} lines)
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
      </div>

      {dirty && (
        <div className="flex justify-end gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-xl animate-in fade-in duration-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[90px]"
            onClick={handleSave}
            disabled={!allValid || isPending}
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            Save All
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main admin page
// ---------------------------------------------------------------------------
export default function AdminPage() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [activePeriod, setActivePeriod] = useState<"first" | "second" | "third" | "fourth">("first");
  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const utils = trpc.useUtils();

  // ── Fetch lottery data for selected date ──────────────────────────────────
  const { data: lotteryState, isLoading, isFetching } = trpc.getLotteryByDate.useQuery(
    { date: selectedDate },
    { refetchOnWindowFocus: false }
  );

  // ── Mutations ─────────────────────────────────────────────────────────────
  const { mutate: seedDate, isPending: isSeeding } = trpc.seedLotteryDate.useMutation({
    onSuccess: () => {
      utils.getLotteryByDate.invalidate({ date: selectedDate });
      showNotification("Date seeded — structure created successfully!", "success");
    },
    onError: (e) => showNotification(e.message, "error"),
  });

  const { mutate: resetDate, isPending: isResetting } = trpc.resetLotteryDate.useMutation({
    onSuccess: () => {
      utils.getLotteryByDate.invalidate({ date: selectedDate });
      showNotification("All prize values cleared for this date.", "success");
    },
    onError: (e) => showNotification(e.message, "error"),
  });

  const showNotification = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const hasData = !!lotteryState;
  const isWorking = isSeeding || isResetting || isFetching;

  const PERIOD_TABS = [
    { key: "first", label: "Miền Trung", time: "10:50 AM" },
    { key: "second", label: "Miền Đông", time: "1:50 PM" },
    { key: "third", label: "Miền Nam", time: "4:50 PM" },
    { key: "fourth", label: "Miền Bắc", time: "6:45 PM" },
  ] as const;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Floating toast ─────────────────────────────────────────────────── */}
      {notification && (
        <div className={`
          fixed top-4 right-4 z-50 px-4 py-3 rounded-xl font-semibold text-sm shadow-lg border flex items-center gap-2
          transition-all animate-in slide-in-from-right-4 duration-300
          ${notification.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-red-50 border-red-200 text-red-800"}
        `}>
          <CheckCircle2 size={16} strokeWidth={2.5} />
          {notification.msg}
        </div>
      )}

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Date picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="font-semibold min-w-[130px]">
              {selectedDate}
              <ChevronDownIcon className="ml-1 w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto" align="start">
            <Calendar
              mode="single"
              selected={dayjs(selectedDate).toDate()}
              onSelect={(date) => date && setSelectedDate(dayjs(date).format("YYYY-MM-DD"))}
              defaultMonth={dayjs(selectedDate).toDate()}
            />
          </PopoverContent>
        </Popover>

        {/* Seed / initialize */}
        <Button
          size="sm"
          onClick={() => seedDate({ date: selectedDate })}
          disabled={isWorking}
          className="gap-1.5 text-xs"
        >
          {isSeeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DatabaseZap className="w-3.5 h-3.5" />}
          {hasData ? "Re-initialize" : "Initialize Date"}
        </Button>

        {/* Refresh */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => utils.getLotteryByDate.invalidate({ date: selectedDate })}
          disabled={isWorking}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>

        {/* Clear */}
        {hasData && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (confirm(`Clear ALL prize values for ${selectedDate}?`)) {
                resetDate({ date: selectedDate });
              }
            }}
            disabled={isWorking}
            className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Clear All
          </Button>
        )}
      </div>

      {/* ── Status hint ─────────────────────────────────────────────────────── */}
      {!hasData && !isLoading && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-zinc-500">
          <DatabaseZap className="mx-auto mb-3 w-8 h-8 text-zinc-300" />
          <p className="font-semibold text-sm">No data for {selectedDate}</p>
          <p className="text-xs mt-1">Click <strong>Initialize Date</strong> to create the blank structure.</p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-10 text-zinc-400 text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading lottery data...
        </div>
      )}

      {/* ── Period tabs + editors ────────────────────────────────────────────── */}
      {hasData && !isLoading && (
        <Tabs
          value={activePeriod}
          onValueChange={(val) => setActivePeriod(val as "first" | "second" | "third" | "fourth")}
        >
          <TabsList className="flex justify-start w-fit bg-transparent p-0 mb-4 h-auto gap-1">
            {PERIOD_TABS.map(({ key, label, time }) => (
              <TabsTrigger
                key={key}
                value={key}
                className="px-4 py-2 text-xs md:text-sm transition-all whitespace-nowrap rounded-lg"
              >
                {time} — {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {PERIOD_TABS.map(({ key }) => (
            <TabsContent key={key} value={key} className="focus-visible:ring-0 mt-0">
              {(lotteryState as LotteryState)?.[key] ? (
                <>
                  {/* Section header */}
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                      {(lotteryState as LotteryState)[key].name}
                    </span>
                    <span className="text-xs text-zinc-300">·</span>
                    <span className="text-xs text-zinc-400">
                      {(lotteryState as LotteryState)[key].data?.length} location(s)
                    </span>
                  </div>

                  <PeriodEditor
                    periodData={(lotteryState as LotteryState)[key]}
                    onSaved={() => { }}
                  />

                </>
              ) : (
                <div className="text-center text-zinc-400 text-sm py-10">
                  No data for this period.
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
