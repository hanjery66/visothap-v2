"use client";

import { useMemo, useState, useEffect } from "react";
import { Clock3, Copy, RotateCcw, Save, Loader2, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/app/_trpc/client";
import { toast } from "sonner";
import dayjs from "dayjs";
import { formatDisplayDateTime, STORAGE_DATE_FORMAT } from "@/lib/utils";
import { DEFAULT_LOTTERY_DISPLAY_SETTINGS, type LotteryDisplayConfig } from "@/lib/lottery-display";

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type PeriodKey = "first" | "second" | "third" | "fourth";

interface PeriodSchedule {
    name: string;
    drawTime: string;
    enabled: boolean;
}

type WeekSchedule = Record<DayKey, Record<PeriodKey, PeriodSchedule>>;

const DAYS: { key: DayKey; label: string; short: string }[] = [
    { key: "mon", label: "Monday", short: "Mon" },
    { key: "tue", label: "Tuesday", short: "Tue" },
    { key: "wed", label: "Wednesday", short: "Wed" },
    { key: "thu", label: "Thursday", short: "Thu" },
    { key: "fri", label: "Friday", short: "Fri" },
    { key: "sat", label: "Saturday", short: "Sat" },
    { key: "sun", label: "Sunday", short: "Sun" },
];

const PERIODS: { key: PeriodKey; label: string }[] = [
    { key: "first", label: "Miền Trung" },
    { key: "second", label: "Miền Đông" },
    { key: "third", label: "Miền Nam" },
    { key: "fourth", label: "Miền Bắc" },
];

const DEFAULT_PERIOD_TIMES: Record<PeriodKey, { name: string; drawTime: string }> = {
    first: { name: "Sổ Kết Quả Miền Trung", drawTime: "17:15" },
    second: { name: "Sổ Kết Quả Miền Đông", drawTime: "13:50" },
    third: { name: "Sổ Kết Quả Miền Nam", drawTime: "16:15" },
    fourth: { name: "Sổ Kết Quả Miền Bắc", drawTime: "18:15" },
};

function buildScheduleFromData(data: any[]): WeekSchedule {
    const template = {} as WeekSchedule;
    for (const d of DAYS) {
        template[d.key] = {} as Record<PeriodKey, PeriodSchedule>;
        for (const p of PERIODS) {
            template[d.key][p.key] = {
                name: DEFAULT_PERIOD_TIMES[p.key].name,
                drawTime: DEFAULT_PERIOD_TIMES[p.key].drawTime,
                enabled: true,
            };
        }
    }

    for (const item of data) {
        const day = item.dayOfWeek as DayKey;
        const period = item.period as PeriodKey;
        if (template[day]?.[period] !== undefined) {
            template[day][period] = {
                name: item.name,
                drawTime: item.drawTime,
                enabled: item.enabled,
            };
        }
    }
    return template;
}

// ────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────

export default function LotteryScheduleSettings() {
    const utils = trpc.useUtils();

    const { data: dbSchedule, isLoading } = trpc.getLotterySchedule.useQuery();
    const { data: dbDisplaySettings, isLoading: isDisplayLoading } =
        trpc.getLotteryDisplaySettings.useQuery();

    const [schedule, setSchedule] = useState<WeekSchedule | null>(null);
    const [displaySettings, setDisplaySettings] = useState<LotteryDisplayConfig>({
        ...DEFAULT_LOTTERY_DISPLAY_SETTINGS,
    });
    const [activeDay, setActiveDay] = useState<DayKey>("mon");
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        if (dbSchedule) {
            setSchedule(buildScheduleFromData(dbSchedule));
        }
    }, [dbSchedule]);

    useEffect(() => {
        if (dbDisplaySettings) {
            setDisplaySettings({
                splashMinutesBefore: dbDisplaySettings.splashMinutesBefore,
                autoSeedMinutesBeforeSplash: dbDisplaySettings.autoSeedMinutesBeforeSplash,
                spinnerMinutesBeforeSplash:
                    dbDisplaySettings.spinnerMinutesBeforeSplash ??
                    DEFAULT_LOTTERY_DISPLAY_SETTINGS.spinnerMinutesBeforeSplash,
                cellSplashDurationSeconds:
                    dbDisplaySettings.cellSplashDurationSeconds ??
                    DEFAULT_LOTTERY_DISPLAY_SETTINGS.cellSplashDurationSeconds,
                cellPauseIntervalSeconds:
                    dbDisplaySettings.cellPauseIntervalSeconds ??
                    DEFAULT_LOTTERY_DISPLAY_SETTINGS.cellPauseIntervalSeconds,
            });
        }
    }, [dbDisplaySettings]);

    const { mutateAsync: saveSchedule, isPending: saving } = trpc.saveLotterySchedule.useMutation({
        onSuccess: () => {
            utils.getLotterySchedule.invalidate();
            utils.getLotteryByDate.invalidate();
            toast.success("Schedule settings saved successfully!");
            setDirty(false);
        },
        onError: (err) => {
            toast.error(err.message || "Failed to save schedule settings.");
        },
    });

    const { mutateAsync: saveDisplaySettings } = trpc.saveLotteryDisplaySettings.useMutation({
        onSuccess: () => {
            utils.getLotteryDisplaySettings.invalidate();
            utils.getLotteryByDate.invalidate();
        },
        onError: (err) => {
            toast.error(err.message || "Failed to save display settings.");
        },
    });

    const updatePeriod = (day: DayKey, period: PeriodKey, patch: Partial<PeriodSchedule>) => {
        setDirty(true);
        setSchedule((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                [day]: {
                    ...prev[day],
                    [period]: { ...prev[day][period], ...patch },
                },
            };
        });
    };

    const copyDayToAll = (source: DayKey) => {
        setDirty(true);
        setSchedule((prev) => {
            if (!prev) return null;
            const next: WeekSchedule = { ...prev };
            for (const d of DAYS) {
                if (d.key === source) continue;
                next[d.key] = {
                    first: { ...prev[source].first },
                    second: { ...prev[source].second },
                    third: { ...prev[source].third },
                    fourth: { ...prev[source].fourth },
                };
            }
            return next;
        });
        toast.info(`Copied ${DAYS.find((d) => d.key === source)?.label} schedule to all days.`);
    };

    const resetDay = (day: DayKey) => {
        setDirty(true);
        setSchedule((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                [day]: {
                    first: { ...DEFAULT_PERIOD_TIMES.first, enabled: true },
                    second: { ...DEFAULT_PERIOD_TIMES.second, enabled: true },
                    third: { ...DEFAULT_PERIOD_TIMES.third, enabled: true },
                    fourth: { ...DEFAULT_PERIOD_TIMES.fourth, enabled: true },
                },
            };
        });
    };

    const handleSave = async () => {
        if (!schedule) return;
        const payload = DAYS.flatMap((d) =>
            PERIODS.map((p) => ({
                id: `${d.key}-${p.key}`,
                dayOfWeek: d.key,
                period: p.key,
                name: schedule[d.key][p.key].name,
                drawTime: schedule[d.key][p.key].drawTime,
                enabled: schedule[d.key][p.key].enabled,
            }))
        );
        await Promise.all([
            saveSchedule(payload),
            saveDisplaySettings(displaySettings),
        ]);
    };

    const activeDayLabel = useMemo(
        () => DAYS.find((d) => d.key === activeDay)?.label ?? "",
        [activeDay]
    );

    if (isLoading || isDisplayLoading || !schedule) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-sm text-muted-foreground gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span>Loading draw schedule settings ...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-end">
                <Button
                    variant="default"
                    onClick={handleSave}
                    disabled={!dirty || saving}
                    className="shrink-0 gap-1.5"
                >
                    {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    {saving ? "Saving..." : "Save changes"}
                </Button>
            </div>

            <div className="rounded space-y-4 bg-zinc-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="autoseed-minutes" className="text-xs text-muted-foreground">
                            Empty table before spinner (minutes)
                        </Label>
                        <Input
                            id="autoseed-minutes"
                            type="number"
                            min={0}
                            max={120}
                            value={displaySettings.autoSeedMinutesBeforeSplash}
                            onChange={(e) => {
                                setDirty(true);
                                setDisplaySettings((prev) => ({
                                    ...prev,
                                    autoSeedMinutesBeforeSplash: Number(e.target.value),
                                }));
                            }}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="spinner-minutes" className="text-xs text-muted-foreground">
                            Spinner before splash (minutes)
                        </Label>
                        <Input
                            id="spinner-minutes"
                            type="number"
                            min={0}
                            max={120}
                            value={displaySettings.spinnerMinutesBeforeSplash ?? 5}
                            onChange={(e) => {
                                setDirty(true);
                                setDisplaySettings((prev) => ({
                                    ...prev,
                                    spinnerMinutesBeforeSplash: Number(e.target.value),
                                }));
                            }}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="splash-minutes" className="text-xs text-muted-foreground">
                            Splash before draw (minutes)
                        </Label>
                        <Input
                            id="splash-minutes"
                            type="number"
                            min={0}
                            max={60}
                            value={displaySettings.splashMinutesBefore}
                            onChange={(e) => {
                                setDirty(true);
                                setDisplaySettings((prev) => ({
                                    ...prev,
                                    splashMinutesBefore: Number(e.target.value),
                                }));
                            }}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="cell-splash-duration" className="text-xs text-muted-foreground">
                            Cell splash duration (seconds)
                        </Label>
                        <Input
                            id="cell-splash-duration"
                            type="number"
                            min={1}
                            max={300}
                            value={displaySettings.cellSplashDurationSeconds ?? 10}
                            onChange={(e) => {
                                setDirty(true);
                                setDisplaySettings((prev) => ({
                                    ...prev,
                                    cellSplashDurationSeconds: Number(e.target.value),
                                }));
                            }}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="cell-pause-interval" className="text-xs text-muted-foreground">
                            Pause between cell (seconds)
                        </Label>
                        <Input
                            id="cell-pause-interval"
                            type="number"
                            min={0}
                            max={300}
                            value={displaySettings.cellPauseIntervalSeconds ?? 5}
                            onChange={(e) => {
                                setDirty(true);
                                setDisplaySettings((prev) => ({
                                    ...prev,
                                    cellPauseIntervalSeconds: Number(e.target.value),
                                }));
                            }}
                        />
                    </div>
                </div>

                <p className="text-xs text-muted-foreground">
                    Spend {" "}
                    <span className="font-semibold text-foreground">
                        {displaySettings.splashMinutesBefore +
                            (displaySettings.spinnerMinutesBeforeSplash ?? 5) +
                            displaySettings.autoSeedMinutesBeforeSplash}{" "}
                        min
                    </span>{" "}
                    before draw time.
                </p>
            </div>

            <Tabs value={activeDay} onValueChange={(v) => setActiveDay(v as DayKey)} className="mt-6">
                <TabsList className="w-full flex-wrap h-auto bg-zinc-100 rounded  p-1">
                    {DAYS.map((d) => (
                        <TabsTrigger
                            key={d.key}
                            value={d.key}
                            className="flex-1 rounded  data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                            <span className="hidden sm:inline">{d.label}</span>
                            <span className="sm:hidden">{d.short}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {DAYS.map((d) => (
                    <TabsContent key={d.key} value={d.key} className="space-y-4 mt-4">
                        <div className="flex justify-between items-center  p-3 rounded  border border-primary/10">
                            <span className="font-semibold text-sm">Schedule for {d.label}</span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => copyDayToAll(d.key)}>
                                    <Copy className="h-3.5 w-3.5" />
                                    Apply to whole week
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => resetDay(d.key)}>
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Reset
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {PERIODS.map((p) => {
                                const value = schedule[d.key][p.key];
                                return (
                                    <div
                                        key={p.key}
                                        className={`rounded  border p-4 space-y-3 transition-colors ${value.enabled
                                            ? "border-zinc-200 bg-white"
                                            : "border-zinc-200 bg-zinc-50 opacity-60"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-primary">{p.label}</span>
                                            <Switch
                                                checked={value.enabled}
                                                onCheckedChange={(checked) =>
                                                    updatePeriod(d.key, p.key, { enabled: checked })
                                                }
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor={`${d.key}-${p.key}-name`} className="text-xs text-muted-foreground">
                                                Session Name
                                            </Label>
                                            <Input
                                                id={`${d.key}-${p.key}-name`}
                                                type="text"
                                                value={value.name}
                                                disabled={!value.enabled}
                                                onChange={(e) =>
                                                    updatePeriod(d.key, p.key, { name: e.target.value })
                                                }
                                                placeholder="e.g. Sổ Kết QuẢ Miền Trung"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor={`${d.key}-${p.key}-time`} className="text-xs text-muted-foreground">
                                                Actual result time (24h)
                                            </Label>
                                            <Input
                                                id={`${d.key}-${p.key}-time`}
                                                type="time"
                                                value={value.drawTime}
                                                disabled={!value.enabled}
                                                onChange={(e) =>
                                                    updatePeriod(d.key, p.key, { drawTime: e.target.value })
                                                }
                                            />
                                        </div>

                                        {(() => {
                                            const parsedTime = value.drawTime.split(":");
                                            if (parsedTime.length !== 2 || !value.enabled) return null;
                                            const hour = parseInt(parsedTime[0]);
                                            const minute = parseInt(parsedTime[1]);
                                            const splashMinutes = displaySettings.splashMinutesBefore ?? 2;
                                            const autoSeedMinutes = displaySettings.autoSeedMinutesBeforeSplash ?? 5;
                                            const spinnerMinutes = displaySettings.spinnerMinutesBeforeSplash ?? 5;

                                            const drawMoment = new Date();
                                            drawMoment.setHours(hour, minute, 0, 0);

                                            const emptyTableMoment = new Date(
                                                drawMoment.getTime() -
                                                (splashMinutes + spinnerMinutes + autoSeedMinutes) * 60000,
                                            );
                                            const spinnerMoment = new Date(
                                                drawMoment.getTime() - (splashMinutes + spinnerMinutes) * 60000,
                                            );
                                            const splashMoment = new Date(
                                                drawMoment.getTime() - splashMinutes * 60000,
                                            );

                                            const format = (d: Date) =>
                                                d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                                            return (
                                                <div className="rounded border border-zinc-200/80 bg-zinc-50/80 p-2.5 text-[11px] space-y-1 text-zinc-600">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-zinc-500">Empty blank cells:</span>
                                                        <span className="font-semibold text-zinc-700">
                                                            {format(emptyTableMoment)} – {format(spinnerMoment)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-zinc-500">Spinners show:</span>
                                                        <span className="font-semibold text-amber-600">
                                                            {format(spinnerMoment)} – {format(splashMoment)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-zinc-500">Splash animation starts:</span>
                                                        <span className="font-semibold text-blue-600">
                                                            {format(splashMoment)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-0.5 border-t border-zinc-200/60 font-medium">
                                                        <span className="text-zinc-700">Actual result time:</span>
                                                        <span className="font-bold text-primary">
                                                            {format(drawMoment)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                    </div>
                                );
                            })}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}