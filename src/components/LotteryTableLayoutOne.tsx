"use client";

import { useRef, useLayoutEffect } from "react";
import dayjs from "dayjs";
import { LocationData, Prize } from "@/lib/mockData";

interface LotteryTableLayoutOneProps {
  periodData: any;
  dateParam: string;
}

export function LotteryTableLayoutOne({
  periodData,
  dateParam,
}: LotteryTableLayoutOneProps) {
  if (!periodData || !periodData.data || periodData.data.length === 0)
    return null;
  const locations = periodData.data as LocationData[];

  const rows = [
    {
      key: "gEight",
      label: "Gi 8",
      color: "text-red-600 font-extrabold text-[30px] md:text-[40px]",
    },
    {
      key: "gSeven",
      label: "Gi 7",
      color: "text-zinc-800 text-[20px] md:text-[24px] font-[900]",
    },
    {
      key: "gSix",
      label: "Gi 6",
      color: "text-zinc-800 text-[20px] md:text-[24px] font-[900]",
    },
    {
      key: "gFive",
      label: "Gi 5",
      color: "text-zinc-800 text-[20px] md:text-[24px] font-[900]",
    },
    {
      key: "gFour",
      label: "Gi 4",
      color: "text-zinc-800 text-[20px] md:text-[24px] font-[900]",
    },
    {
      key: "gThree",
      label: "Gi 3",
      color: "text-zinc-800 text-[20px] md:text-[24px] font-[900]",
    },
    {
      key: "gTwo",
      label: "Gi 2",
      color: "text-zinc-800 text-[20px] md:text-[24px] font-[900]",
    },
    {
      key: "gOne",
      label: "Gi 1",
      color: "text-zinc-800 text-[20px] md:text-[24px] font-[900]",
    },
    {
      key: "db",
      label: "Đ. B",
      color: "text-red-600 font-extrabold text-[30px] md:text-[35px]",
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
      // Find max height across all data columns for this header row
      let maxH = 0;
      allHeadRefs.current.forEach((colRefs) => {
        const el = colRefs?.[i];
        if (el) maxH = Math.max(maxH, el.getBoundingClientRect().height);
      });
      if (maxH === 0) continue;

      // Apply to label column
      const lbl = lblHeadRefs.current[i];
      if (lbl) lbl.style.minHeight = `${maxH}px`;

      // Apply to every data column so all headers are the same height
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
      if (maxH === 0) continue;

      const lbl = lblRowRefs.current[i];
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

  return (
    <div className="rounded-xs shadow-md overflow-hidden mb-8 transition-all hover:shadow-lg ">
      {/* Banner */}
      <div className="bg-primary text-primary-foreground  font-bold   text-center flex flex-col sm:flex-row justify-center items-center gap-1  uppercase py-1">
        <span>
          {periodData.displayNumber} - {dayjs(dateParam).format("DD/MM/YYYY")}{" "}
          {formattedName}
        </span>
      </div>

      {/*
        Column-first layout.
        Each location is its own vertical flex container with `user-select: contain`.
        This means dragging vertically inside a column stays within that column only.
      */}
      <div className="overflow-x-auto">
        <div className="flex w-full min-w-[500px]">
          {/* ── Label column (not selectable) ── */}
          <div
            className="flex flex-col shrink-0 w-1/5 border-r border-zinc-200"
            style={{ userSelect: "none" }}
          >
            <div
              ref={(el) => {
                lblHeadRefs.current[0] = el;
              }}
              className="flex items-center justify-center  font-bold  md:text-xl border-b border-zinc-200 bg-white text-center"
            >
              {dayjs(dateParam).format("dddd")}
            </div>
            <div
              ref={(el) => {
                lblHeadRefs.current[1] = el;
              }}
              className="flex items-center justify-center  font-extrabold  md:text-xl border-b border-zinc-200 bg-white text-center"
            >
              {dayjs(dateParam).format("DD/MM/YYYY")}
            </div>
            {rows.map((row, i) => (
              <div
                key={row.key}
                ref={(el) => {
                  lblRowRefs.current[i] = el;
                }}
                className="flex items-center justify-center font-bold text-muted-foreground md:text-xl border-b border-zinc-200 last:border-b-0"
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
                className="flex items-center justify-center  text-black font-bold  md:text-xl border-b border-zinc-200 bg-white text-center"
              >
                {loc.location}
              </div>
              {/* Header row 2 */}
              <div
                ref={(el) => {
                  if (!allHeadRefs.current[colIdx]) allHeadRefs.current[colIdx] = [];
                  allHeadRefs.current[colIdx][1] = el;
                }}
                className="flex items-center justify-center text-black font-extrabold  md:text-xl border-b border-zinc-200 bg-white text-center uppercase"
              >
                {loc.code}
              </div>
              {/* Prize rows */}
              {rows.map((row, rowIdx) => {
                const prizes = loc[row.key] as Prize[];
                return (
                  <div
                    key={row.key}
                    ref={(el) => {
                      if (!allRowRefs.current[colIdx]) allRowRefs.current[colIdx] = [];
                      allRowRefs.current[colIdx][rowIdx] = el;
                    }}
                    className={`flex flex-col items-center justify-center border-b border-zinc-200 last:border-b-0 text-center leading-tight ${row.color}`}
                  >
                    {prizes && prizes.length > 0 ? (
                      prizes.map((pz, idx) => (
                        <p
                          key={idx}
                          className="hover:bg-primary hover:text-primary-foreground w-full cursor-pointer"
                        >
                          {pz.value || <span className="font-normal">XX</span>}
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
