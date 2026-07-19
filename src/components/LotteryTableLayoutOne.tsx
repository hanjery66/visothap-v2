"use client";

import { useRef, useLayoutEffect } from "react";
import dayjs from "dayjs";
import { LocationData, Prize } from "@/lib/mockData";
import { useDrawStatuses } from "@/hooks/useDrawStatus";
import useSplashNumber from "@/hooks/use-splash-number";
import { formatDisplayDateTime } from "@/lib/utils";
import { DEFAULT_LOTTERY_DISPLAY_SETTINGS } from "@/lib/lottery-display";
import { trpc } from "@/app/_trpc/client";

interface LotteryTableLayoutOneProps {
  periodData: any;
  dateParam: string;
}

export function LotteryTableLayoutOne({
  periodData,
  dateParam,
}: LotteryTableLayoutOneProps) {
  const { data: displaySettings } = trpc.getLotteryDisplaySettings.useQuery();
  const displayConfig = displaySettings ?? DEFAULT_LOTTERY_DISPLAY_SETTINGS;
  const locationCount = periodData?.data?.length ?? 0;

  const { columnStatuses, isPending, isSpinning } = useDrawStatuses(
    dateParam,
    periodData?.displayNumber,
    locationCount,
    displayConfig,
  );
  const splashNumber = useSplashNumber({ length: 5, intervalMs: 100 });

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
      color: "text-red-600 font-extrabold text-[35px] md:text-[40px]",
    },
    {
      key: "gSeven",
      label: getRowLabel("gSeven", "Gi 7"),
      color: "text-zinc-800 text-[20px] md:text-[25px] font-semibold",
    },
    {
      key: "gSix",
      label: getRowLabel("gSix", "Gi 6"),
      color: "text-zinc-800 text-[20px] md:text-[25px] font-semibold",
    },
    {
      key: "gFive",
      label: getRowLabel("gFive", "Gi 5"),
      color: "text-zinc-800 text-[20px] md:text-[25px] font-semibold",
    },
    {
      key: "gFour",
      label: getRowLabel("gFour", "Gi 4"),
      color: "text-zinc-800 text-[20px] md:text-[25px] font-semibold",
    },
    {
      key: "gThree",
      label: getRowLabel("gThree", "Gi 3"),
      color: "text-zinc-800 text-[20px] md:text-[25px] font-semibold",
    },
    {
      key: "gTwo",
      label: getRowLabel("gTwo", "Gi 2"),
      color: "text-zinc-800 text-[20px] md:text-[25px] font-semibold",
    },
    {
      key: "gOne",
      label: getRowLabel("gOne", "Gi 1"),
      color: "text-zinc-800 text-[20px] md:text-[25px] font-semibold",
    },
    {
      key: "db",
      label: getRowLabel("db", "Đ. B"),
      color: "text-red-600 font-extrabold text-[35px] md:text-[40px]",
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
    "hh:mm A"
  );

  return (
    <div className="rounded-xs shadow-md overflow-hidden mb-8 transition-all hover:shadow-lg ">
      {/* Banner */}
      <div className="bg-primary text-primary-foreground  font-bold   text-center flex flex-col sm:flex-row justify-center items-center gap-1  uppercase py-1">
        <span>
          {drawDateTimeLabel}{" "}
          {formattedName}
        </span>
      </div>

      {/* Pending notice */}
      {isPending && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-amber-700 text-xs text-center font-medium">
          Chưa đến giờ quay · Mở thưởng lúc <span className="font-bold">{drawDateTimeLabel}</span>
        </div>
      )}

      {/* Spinning notice */}
      {isSpinning && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-red-600 text-xs text-center font-semibold flex items-center justify-center gap-2 animate-pulse">
          <span className="inline-block w-3 h-3 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
          Đang quay số · Kết quả sắp có · Mở thưởng lúc <span className="font-bold">{drawDateTimeLabel}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="flex w-full min-w-[500px] py-2">
          {/* ── Label column (not selectable) ── */}
          <div
            className="flex flex-col shrink-0 w-1/5 border-r border-zinc-200"
            style={{ userSelect: "none" }}
          >
            <div
              ref={(el) => {
                lblHeadRefs.current[0] = el;
              }}
              className="flex items-center justify-center  font-bold  md:text-lg border-b border-zinc-200 bg-white text-center"
            >
              {dayjs(dateParam).format("dddd")}
            </div>
            <div
              ref={(el) => {
                lblHeadRefs.current[1] = el;
              }}
              className="flex items-center justify-center  font-extrabold  md:text-lg border-b border-zinc-200 bg-white text-center"
            >
              {formatDisplayDateTime(dateParam, undefined, "DD/MM/YYYY")}
            </div>
            {rows.map((row, i) => (
              <div
                key={row.key}
                ref={(el) => {
                  lblRowRefs.current[i] = el;
                }}
                className="flex items-center justify-center font-bold text-muted-foreground md:text-lg border-b border-zinc-200 last:border-b-0"
              >
                {row.label}
              </div>
            ))}
          </div>

          {/* ── One div per location — selection is contained to each ── */}
          {locations.map((loc, colIdx) => (
            <div
              key={colIdx}
              className="flex flex-col flex-1 border-r border-zinc-200 last:border-r-0"
            >
              {/* Header row 1 */}
              <div
                ref={(el) => {
                  if (!allHeadRefs.current[colIdx]) allHeadRefs.current[colIdx] = [];
                  allHeadRefs.current[colIdx][0] = el;
                }}
                className="flex items-center justify-center  text-black font-bold  md:text-lg border-b border-zinc-200 bg-white text-center"
              >
                {loc.location}
              </div>
              {/* Header row 2 */}
              <div
                ref={(el) => {
                  if (!allHeadRefs.current[colIdx]) allHeadRefs.current[colIdx] = [];
                  allHeadRefs.current[colIdx][1] = el;
                }}
                className="flex items-center justify-center text-black font-extrabold  md:text-lg border-b border-zinc-200 bg-white text-center uppercase"
              >
                {loc.code}
              </div>

              {rows.map((row, rowIdx) => {
                const prizes = loc[row.key] as Prize[];
                const colStatus = columnStatuses[colIdx] ?? "done";
                return (
                  <div
                    key={row.key}
                    ref={(el) => {
                      if (!allRowRefs.current[colIdx]) allRowRefs.current[colIdx] = [];
                      allRowRefs.current[colIdx][rowIdx] = el;
                    }}
                    className={`flex flex-col items-center justify-center border-b border-zinc-200 last:border-b-0 text-center leading-none space-y-0 ${row.color}`}
                  >
                    {colStatus === "spinning" ? (
                      prizes && prizes.length > 0
                        ? prizes.map((_, idx) => (
                              <p
                                key={idx}
                                className="w-full m-0 p-0 leading-none font-mono  select-none animate-pulse"
                              >
                                <span className="inline-block">{splashNumber}</span>
                              </p>
                            ))
                        : <span className="font-normal text-primary animate-pulse">...</span>
                    ) : prizes && prizes.length > 0 ? (
                      prizes.map((pz, idx) => (
                        <p
                          key={idx}
                          className="hover:bg-primary hover:text-primary-foreground w-full cursor-pointer m-0 p-0 leading-none"
                        >
                          {colStatus === "done" && pz.value
                            ? pz.value
                            : <span className="font-normal">X</span>}
                        </p>
                      ))
                    ) : (
                      <span className="font-normal">--</span>
                    )}
                  </div>
                );
              })}


            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
