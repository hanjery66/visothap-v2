"use client";

import { useRef, useLayoutEffect } from "react";
import dayjs from "dayjs";
import { LocationData, Prize } from "@/lib/mockData";
import { formatDisplayDateTime } from "@/lib/utils";
import { DEFAULT_LOTTERY_DISPLAY_SETTINGS, LotteryDisplayConfig } from "@/lib/lottery-display";
import { trpc } from "@/app/_trpc/client";
import { RollingDigits } from "@/components/RollingDigits";
import { computeCellDrawStatus } from "@/lib/lottery-cell-status";
import { DigitSpinner } from "@/components/DigitSpinner";
import { useLiveTicker } from "@/hooks/use-live-ticker";
import { LAYOUT_ONE_DIGIT_LENGTHS } from "@/lib/lottery-constants";

interface LotteryTableLayoutOneProps {
  periodData: any;
  dateParam: string;
  displayConfig?: Partial<LotteryDisplayConfig>;
}

export function LotteryTableLayoutOne({
  periodData,
  dateParam,
  displayConfig: propDisplayConfig,
}: LotteryTableLayoutOneProps) {
  const currentMoment = useLiveTicker(1000);
  const { data: displaySettings } = trpc.getLotteryDisplaySettings.useQuery(undefined, {
    enabled: !propDisplayConfig,
  });

  const effectiveSettings = propDisplayConfig ?? displaySettings;
  const displayConfig: LotteryDisplayConfig = {
    splashMinutesBefore: effectiveSettings?.splashMinutesBefore ?? DEFAULT_LOTTERY_DISPLAY_SETTINGS.splashMinutesBefore,
    autoSeedMinutesBeforeSplash: effectiveSettings?.autoSeedMinutesBeforeSplash ?? DEFAULT_LOTTERY_DISPLAY_SETTINGS.autoSeedMinutesBeforeSplash,
    spinnerMinutesBeforeSplash: effectiveSettings?.spinnerMinutesBeforeSplash ?? DEFAULT_LOTTERY_DISPLAY_SETTINGS.spinnerMinutesBeforeSplash,
    cellSplashDurationSeconds: effectiveSettings?.cellSplashDurationSeconds ?? DEFAULT_LOTTERY_DISPLAY_SETTINGS.cellSplashDurationSeconds,
    cellPauseIntervalSeconds: effectiveSettings?.cellPauseIntervalSeconds ?? DEFAULT_LOTTERY_DISPLAY_SETTINGS.cellPauseIntervalSeconds,
  };

  if (!periodData || !periodData.data || periodData.data.length === 0)
    return null;
  const locations = periodData.data as LocationData[];

  const getPrizesMeta = () => {
    const list: { key: string; label: string }[] = [];
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
    return list;
  };

  const getRowLabel = (key: string, defaultLabel: string) => {
    if (!periodData.prizeLabels || !Array.isArray(periodData.prizeLabels)) {
      return defaultLabel;
    }
    const list = getPrizesMeta();
    const idx = list.findIndex((item) => item.key === key);
    if (idx !== -1 && periodData.prizeLabels[idx]) {
      let label = periodData.prizeLabels[idx];
      if (["gSix", "gFour", "gThree"].includes(key)) {
        label = label.replace(/\s*\(\d+\)$/, "");
      }
      return label;
    }
    return defaultLabel;
  };

  const rows = [
    {
      key: "gEight",
      label: getRowLabel("gEight", "Gi 8"),
      color: "text-red-600 font-semibold text-[35px] md:text-[40px]",
    },
    {
      key: "gSeven",
      label: getRowLabel("gSeven", "Gi 7"),
      color: "text-zinc-800 text-[17px] md:text-[19px] font-semibold",
    },
    {
      key: "gSix",
      label: getRowLabel("gSix", "Gi 6"),
      color: "text-zinc-800 text-[17px] md:text-[19px] font-semibold",
    },
    {
      key: "gFive",
      label: getRowLabel("gFive", "Gi 5"),
      color: "text-zinc-800 text-[17px] md:text-[19px] font-semibold",
    },
    {
      key: "gFour",
      label: getRowLabel("gFour", "Gi 4"),
      color: "text-zinc-800 text-[17px] md:text-[19px] font-semibold",
    },
    {
      key: "gThree",
      label: getRowLabel("gThree", "Gi 3"),
      color: "text-zinc-800 text-[17px] md:text-[19px] font-semibold",
    },
    {
      key: "gTwo",
      label: getRowLabel("gTwo", "Gi 2"),
      color: "text-zinc-800 text-[17px] md:text-[19px] font-semibold",
    },
    {
      key: "gOne",
      label: getRowLabel("gOne", "Gi 1"),
      color: "text-zinc-800 text-[17px] md:text-[19px] font-semibold",
    },
    {
      key: "db",
      label: getRowLabel("db", "Đ. B"),
      color: "text-red-600 font-semibold text-[25px] md:text-[28px] py-1",
    },
  ];

  // 2-D refs: [colIdx][rowIdx] for every data column header and prize row.
  // We measure the MAX height across all columns for each row and apply it
  // uniformly so that borders stay aligned even when locations have different
  // prize counts for the same category.
  const allHeadRefs = useRef<(HTMLDivElement | null)[][]>([]);
  const allRowRefs = useRef<(HTMLDivElement | null)[][]>([]);

  // Label-column refs (1-D — one ref per row)
  const lblHeadRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lblRowRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Run after every paint so resize / data changes are handled.
  // Direct DOM style writes won't trigger React re-renders → no infinite loop.
  useLayoutEffect(() => {
    // ── header rows ──────────────────────────────────────────────
    for (let i = 0; i < 2; i++) {
      let maxH = 0;
      allHeadRefs.current.forEach((colRefs) => {
        const el = colRefs?.[i];
        if (el) maxH = Math.max(maxH, el.getBoundingClientRect().height);
      });

      const lbl = lblHeadRefs.current[i];
      if (lbl) maxH = Math.max(maxH, lbl.getBoundingClientRect().height);

      if (maxH === 0) continue;

      if (lbl) lbl.style.minHeight = `${maxH}px`;
      allHeadRefs.current.forEach((colRefs) => {
        const el = colRefs?.[i];
        if (el) el.style.minHeight = `${maxH}px`;
      });
    }

    // ── prize rows ───────────────────────────────────────────────
    for (let i = 0; i < rows.length; i++) {
      let maxH = 0;

      allRowRefs.current.forEach((colRefs) => {
        const el = colRefs?.[i];
        if (el) maxH = Math.max(maxH, el.getBoundingClientRect().height);
      });

      // also account for the label column's own natural height
      const lbl = lblRowRefs.current[i];
      if (lbl) maxH = Math.max(maxH, lbl.getBoundingClientRect().height);

      if (maxH === 0) continue;

      if (lbl) lbl.style.minHeight = `${maxH}px`;

      allRowRefs.current.forEach((colRefs) => {
        const el = colRefs?.[i];
        if (el) el.style.minHeight = `${maxH}px`;
      });
    }


  });

  const formattedName = periodData.name
    .toUpperCase()
    .replace("SỔ KẾT QUẢ", "KẾT QUẢ XỔ SỐ");

  const drawDateTimeLabel = formatDisplayDateTime(
    dateParam,
    periodData.displayNumber,
    "hh:mm A - DD/MM/YYYY"
  );

  return (
    <div className="rounded shadow-md overflow-hidden transition-all hover:shadow-lg">
      {/* Banner */}
      <div className="bg-primary text-primary-foreground font-bold text-center flex flex-col sm:flex-row justify-center items-center gap-1 uppercase py-1.5 text-xs sm:text-base">
        <span>
          {drawDateTimeLabel}{" "}
          {formattedName}
        </span>
      </div>

      {/* Pending notice */}
      {/* {isPending && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-0.5 text-amber-700 text-xs text-center font-medium">
          Chưa đến giờ quay · Mở thưởng lúc <span className="font-bold">{drawDateTimeLabel}</span>
        </div>
      )} */}

      <div className="w-full overflow-hidden">
        <div className="flex w-full">
          {/* ── Label column (not selectable) ── */}
          <div
            className="flex flex-col shrink-0 w-1/5 border-r border-zinc-200"
            style={{ userSelect: "none" }}
          >
            <div
              ref={(el) => {
                lblHeadRefs.current[0] = el;
              }}
              className="flex items-center justify-center capitalize font-semibold text-sm md:text-base border-b border-zinc-200 bg-white text-center py-0.5"
            >
              {dayjs(dateParam).format("dddd")}
            </div>
            <div
              ref={(el) => {
                lblHeadRefs.current[1] = el;
              }}
              className="flex items-center justify-center font-semibold text-sm md:text-base border-b border-zinc-200 bg-white text-center py-0.5"
            >
              {formatDisplayDateTime(dateParam, undefined, "DD/MM/YYYY")}
            </div>
            {rows.map((row, i) => (
              <div
                key={row.key}
                ref={(el) => {
                  lblRowRefs.current[i] = el;
                }}
                className="flex items-center justify-center font-medium text-muted-foreground text-sm md:text-base border-b border-zinc-200 last:border-b-0"
              >
                {row.label}
              </div>
            ))}
          </div>

          {/* ── One div per location — selection is contained to each ── */}
          {locations.map((loc, colIdx) => (
            <div
              key={colIdx}
              className="flex flex-col flex-1 min-w-0 basis-0 border-r border-zinc-200 last:border-r-0"
            >
              {/* Header row 1 */}
              <div
                ref={(el) => {
                  if (!allHeadRefs.current[colIdx]) allHeadRefs.current[colIdx] = [];
                  allHeadRefs.current[colIdx][0] = el;
                }}
                className="flex items-center justify-center capitalize text-black font-semibold text-sm md:text-base border-b border-zinc-200 bg-white text-center py-0.5"
              >
                {loc.location}
              </div>
              {/* Header row 2 */}
              <div
                ref={(el) => {
                  if (!allHeadRefs.current[colIdx]) allHeadRefs.current[colIdx] = [];
                  allHeadRefs.current[colIdx][1] = el;
                }}
                className="flex items-center justify-center text-black font-semibold text-sm md:text-base border-b border-zinc-200 bg-white text-center uppercase py-0.5"
              >
                {loc.code}
              </div>

              {(() => {
                // Collect all prizes for this column in order so we can check
                // whether a previous slot is still waiting for its value.
                const allColumnPrizes: { pz: Prize; expectedLength: number }[] = [];
                rows.forEach((row) => {
                  const prizes = (loc[row.key] as Prize[]) || [];
                  const expectedLength = LAYOUT_ONE_DIGIT_LENGTHS[row.key] ?? 5;
                  if (prizes.length > 0) {
                    prizes.forEach((pz) => allColumnPrizes.push({ pz, expectedLength }));
                  }
                });

                let localSlotIndex = 0;
                return rows.map((row, rowIdx) => {
                  const prizes = (loc[row.key] as Prize[]) || [];
                  const expectedLength = LAYOUT_ONE_DIGIT_LENGTHS[row.key] ?? 5;

                  return (
                    <div
                      key={row.key}
                      ref={(el) => {
                        if (!allRowRefs.current[colIdx]) allRowRefs.current[colIdx] = [];
                        allRowRefs.current[colIdx][rowIdx] = el;
                      }}
                      className={`flex flex-col items-center justify-center border-b border-zinc-200 last:border-b-0 text-center leading-none space-y-0 ${row.color}`}
                    >
                      {prizes.length > 0 ? (
                        prizes.map((pz, idx) => {
                          const slotIdx = localSlotIndex++;
                          const len = pz.value ? pz.value.length : expectedLength;

                          // All columns reveal simultaneously at the same time (row-by-row)
                          const cellStatus = computeCellDrawStatus(
                            dateParam,
                            periodData?.displayNumber,
                            0,
                            slotIdx,
                            displayConfig,
                            currentMoment,
                          );

                          // Stage 0 — Before spinner window: cell is empty / blank
                          if (cellStatus === "empty") {
                            return (
                              <p
                                key={idx}
                                className="hover:bg-[#fbebd7] w-full cursor-pointer m-0 leading-none py-1 h-[1.2em] flex items-center justify-center"
                              >
                                &nbsp;
                              </p>
                            );
                          }

                          // Stage 3 — Reveal the real number (timing cleared AND value ready)
                          if (cellStatus === "done" && pz.value) {
                            return (
                              <p
                                key={idx}
                                className="hover:bg-[#fbebd7] w-full cursor-pointer m-0 leading-none py-1 h-[1.2em] flex items-center justify-center"
                              >
                                {pz.value}
                              </p>
                            );
                          }

                          // Check if any previous prize in this column is still waiting for its value
                          const anyPreviousMissingValue = allColumnPrizes
                            .slice(0, slotIdx)
                            .some((entry) => !entry.pz.value);

                          // Stage 1 — Not yet time for this slot's splash OR previous slot has no number yet (keep spinning)
                          if (cellStatus === "pending" || anyPreviousMissingValue) {
                            return (
                              <p
                                key={idx}
                                className="hover:bg-[#fbebd7] w-full cursor-pointer m-0 leading-none flex items-center justify-center py-1 h-[1.2em] overflow-hidden"
                              >
                                {Array.from({ length: expectedLength }).map((__, d) => (
                                  <DigitSpinner key={d} className="my-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                ))}
                              </p>
                            );
                          }

                          // Stage 2 — All previous slots have numbers; this slot actively splashes
                          return (
                            <p
                              key={idx}
                              className="hover:bg-[#fbebd7] w-full cursor-pointer m-0 leading-none py-1 h-[1.2em] flex items-center justify-center"
                            >
                              <RollingDigits length={len} />
                            </p>
                          );
                        })
                      ) : (
                        <span className="hover:bg-[#fbebd7] w-full cursor-pointer font-normal py-1 h-[1.2em] flex items-center justify-center">--</span>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
