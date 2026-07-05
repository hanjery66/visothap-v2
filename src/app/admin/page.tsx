"use client";

import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { trpc } from "@/app/_trpc/client";
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
// Prize key ordering shared by both layout types
// ---------------------------------------------------------------------------
const PRIZE_KEYS = [
  { key: "db",     label: "Đ.Biệt",  color: "text-red-600 font-extrabold" },
  { key: "gOne",   label: "Giải 1",  color: "text-zinc-800 font-bold" },
  { key: "gTwo",   label: "Giải 2",  color: "text-zinc-800 font-bold" },
  { key: "gThree", label: "Giải 3",  color: "text-zinc-800 font-bold" },
  { key: "gFour",  label: "Giải 4",  color: "text-zinc-800 font-bold" },
  { key: "gFive",  label: "Giải 5",  color: "text-zinc-800 font-bold" },
  { key: "gSix",   label: "Giải 6",  color: "text-zinc-800 font-bold" },
  { key: "gSeven", label: "Giải 7",  color: "text-zinc-800 font-bold" },
  { key: "gEight", label: "Giải 8",  color: "text-red-600 font-extrabold" },
] as const;

// ---------------------------------------------------------------------------
// Editable prize input component
// ---------------------------------------------------------------------------
interface PrizeInputProps {
  prizeId: string;
  initialValue: string;
  digits: number;
  onSaved: () => void;
}

function PrizeInput({ prizeId, initialValue, digits, onSaved }: PrizeInputProps) {
  const [val, setVal] = useState(initialValue);
  const [dirty, setDirty] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { mutate: savePrize, isPending } = trpc.upsertLotteryPrize.useMutation({
    onSuccess: () => {
      setDirty(false);
      onSaved();
      utils.getLotteryByDate.invalidate();
    },
  });

  // Sync when parent data refreshes
  useEffect(() => {
    if (!dirty) setVal(initialValue);
  }, [initialValue, dirty]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, digits);
    setVal(cleaned);
    setDirty(cleaned !== initialValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") {
      setVal(initialValue);
      setDirty(false);
      inputRef.current?.blur();
    }
  };

  const save = () => {
    if (!dirty) return;
    savePrize({ prizeId, value: val });
  };

  return (
    <div className="relative flex items-center justify-center w-full">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={val}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={save}
        placeholder={"—".repeat(digits)}
        maxLength={digits}
        className={`
          w-full text-center font-mono text-sm py-0.5 px-1 rounded border transition-all outline-none
          ${dirty
            ? "border-amber-400 bg-amber-50 ring-1 ring-amber-300"
            : val
              ? "border-transparent bg-transparent hover:border-zinc-300"
              : "border-dashed border-zinc-300 bg-zinc-50/60 text-zinc-400"
          }
          focus:border-primary focus:ring-1 focus:ring-primary/30 focus:bg-white
        `}
      />
      {isPending && (
        <Loader2 className="absolute right-1 w-3 h-3 animate-spin text-primary" />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Period grid editor — renders one table per period
// ---------------------------------------------------------------------------
interface PeriodEditorProps {
  periodData: any;
  onSaved: () => void;
}

function PeriodEditor({ periodData, onSaved }: PeriodEditorProps) {
  if (!periodData?.data?.length) return null;
  const locations = periodData.data;

  // Build prize lookup: prizeKey → prizes[] per location
  // prizes carry their DB id from tRPC response
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 shadow-sm">
      <table className="w-full min-w-[500px] border-collapse text-sm">
        <thead>
          <tr className="bg-primary/5 border-b border-zinc-200">
            <th className="px-3 py-2.5 text-left font-semibold text-zinc-500 w-[90px]">Giải</th>
            {locations.map((loc: any, i: number) => (
              <th key={i} className="px-3 py-2.5 text-center font-bold text-zinc-800">
                <div>{loc.location}</div>
                <div className="text-xs font-semibold text-primary uppercase">{loc.code}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PRIZE_KEYS.map(({ key, label, color }) => {
            // Skip gEight row if no location has any gEight prizes (Miền Bắc)
            const hasAny = locations.some((loc: any) => loc[key]?.length > 0);
            if (!hasAny) return null;

            // Find max prize count for this key across all locations
            const maxCount = Math.max(...locations.map((loc: any) => (loc[key] as any[])?.length ?? 0));

            return (
              <tr key={key} className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/50 transition-colors">
                <td className={`px-3 py-2 font-bold text-xs whitespace-nowrap ${color}`}>{label}</td>
                {locations.map((loc: any, li: number) => {
                  const prizes: any[] = loc[key] ?? [];
                  return (
                    <td key={li} className="px-2 py-1.5 text-center align-middle">
                      <div className="flex flex-col gap-1 items-center">
                        {prizes.map((pz: any, pi: number) => {
                          // Digit count per prize type
                          const digits =
                            key === "db" ? (periodData.displayTable === "fourth" ? 5 : 6)
                            : key === "gOne"   ? 5
                            : key === "gTwo"   ? 5
                            : key === "gThree" ? 5
                            : key === "gFour"  ? (periodData.displayTable === "fourth" ? 4 : 5)
                            : key === "gFive"  ? (periodData.displayTable === "fourth" ? 4 : 4)
                            : key === "gSix"   ? (periodData.displayTable === "fourth" ? 3 : 4)
                            : key === "gSeven" ? (periodData.displayTable === "fourth" ? 2 : 3)
                            : key === "gEight" ? 2
                            : 4;
                          return (
                            <PrizeInput
                              key={pz.id ?? `${li}-${pi}`}
                              prizeId={pz.id}
                              initialValue={pz.value ?? ""}
                              digits={digits}
                              onSaved={onSaved}
                            />
                          );
                        })}
                        {prizes.length === 0 && (
                          <span className="text-zinc-300 text-xs">—</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
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
  const { data: lotteryState, isLoading: isFetching } = trpc.getLotteryByDate.useQuery(
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
    { key: "first",  label: "Miền Trung", time: "10:50 AM" },
    { key: "second", label: "Miền Đông",  time: "1:50 PM"  },
    { key: "third",  label: "Miền Nam",   time: "4:50 PM"  },
    { key: "fourth", label: "Miền Bắc",   time: "6:45 PM"  },
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
      {!hasData && !isFetching && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-zinc-500">
          <DatabaseZap className="mx-auto mb-3 w-8 h-8 text-zinc-300" />
          <p className="font-semibold text-sm">No data for {selectedDate}</p>
          <p className="text-xs mt-1">Click <strong>Initialize Date</strong> to create the blank structure.</p>
        </div>
      )}

      {isFetching && (
        <div className="flex items-center justify-center gap-2 py-10 text-zinc-400 text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading lottery data...
        </div>
      )}

      {/* ── Period tabs + editors ────────────────────────────────────────────── */}
      {hasData && !isFetching && (
        <Tabs
          value={activePeriod}
          onValueChange={(val) => setActivePeriod(val as any)}
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
              {(lotteryState as any)?.[key] ? (
                <>
                  {/* Section header */}
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                      {(lotteryState as any)[key].name}
                    </span>
                    <span className="text-xs text-zinc-300">·</span>
                    <span className="text-xs text-zinc-400">
                      {(lotteryState as any)[key].data?.length} location(s)
                    </span>
                  </div>

                  <PeriodEditor
                    periodData={(lotteryState as any)[key]}
                    onSaved={() => {}}
                  />

                  <p className="mt-2 text-[11px] text-zinc-400 text-right">
                    Press <kbd className="px-1 py-0.5 rounded bg-zinc-100 border border-zinc-200 font-mono text-[10px]">Enter</kbd> or click away to save each value.
                  </p>
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
