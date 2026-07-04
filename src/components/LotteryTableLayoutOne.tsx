"use client";

import React, { useRef, useLayoutEffect } from "react";
import dayjs from "dayjs";
import { LocationData, Prize } from "@/lib/mockData";

interface LotteryTableLayoutOneProps {
  periodData: any;
  dateParam: string;
}

export function LotteryTableLayoutOne({ periodData, dateParam }: LotteryTableLayoutOneProps) {
  if (!periodData || !periodData.data || periodData.data.length === 0) return null;
  const locations = periodData.data as LocationData[];

  const rows = [
    { key: "gEight", label: "Gi 8", color: "text-red-600 font-extrabold text-[30px] md:text-[35px]" },
    { key: "gSeven", label: "Gi 7", color: "text-zinc-800 text-[25px] md:text-[30px] font-bold" },
    { key: "gSix", label: "Gi 6", color: "text-zinc-800 text-[20px] md:text-[25px] font-bold" },
    { key: "gFive", label: "Gi 5", color: "text-zinc-800 text-[20px] md:text-[25px] font-bold" },
    { key: "gFour", label: "Gi 4", color: "text-zinc-800 text-[20px] md:text-[25px] font-bold" },
    { key: "gThree", label: "Gi 3", color: "text-zinc-800 text-[20px] md:text-[25px] font-bold" },
    { key: "gTwo", label: "Gi 2", color: "text-zinc-800 text-[20px] md:text-[25px] font-bold" },
    { key: "gOne", label: "Gi 1", color: "text-zinc-800 text-[20px] md:text-[25px] font-bold" },
    { key: "db", label: "Đ. B", color: "text-red-600 font-extrabold text-[30px] md:text-[35px]" },
  ];

  // Refs used to sync heights between the label column and the first data column.
  // Since we switched to a column-first DOM, rows no longer share a <tr> to auto-equalize height.
  const srcHeadRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lblHeadRefs = useRef<(HTMLDivElement | null)[]>([]);
  const srcRowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lblRowRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Run after every paint so resize / data changes are handled.
  // Direct DOM style writes won't trigger React re-renders → no infinite loop.
  useLayoutEffect(() => {
    srcHeadRefs.current.forEach((el, i) => {
      const lbl = lblHeadRefs.current[i];
      if (el && lbl) lbl.style.minHeight = `${el.getBoundingClientRect().height}px`;
    });
    srcRowRefs.current.forEach((el, i) => {
      const lbl = lblRowRefs.current[i];
      if (el && lbl) lbl.style.minHeight = `${el.getBoundingClientRect().height}px`;
    });
  });

  const formattedName = periodData.name.toUpperCase().replace("SỔ KẾT QUẢ", "KẾT QUẢ XỔ SỐ");

  return (
    <div className="rounded-lg shadow-md overflow-hidden mb-8 transition-all hover:shadow-lg">
      {/* Banner */}
      <div className="bg-primary text-primary-foreground px-4 py-2 font-bold text-lg md:text-xl text-center flex flex-col sm:flex-row justify-center items-center gap-1 shadow-sm uppercase">
        <span>{periodData.displayNumber} - {dayjs(dateParam).format("DD/MM/YYYY")} {formattedName}</span>
      </div>

      {/*
        Column-first layout.
        Each location is its own vertical flex container with `user-select: contain`.
        This means dragging vertically inside a column stays within that column only.
      */}
      <div className="overflow-x-auto border-t">
        <div className="flex w-full min-w-[500px]">

          {/* ── Label column (not selectable) ── */}
          <div
            className="flex flex-col shrink-0 w-1/4 border-r border-zinc-200"
            style={{ userSelect: "none" }}
          >
            <div
              ref={el => { lblHeadRefs.current[0] = el; }}
              className="flex items-center justify-center py-2.5 px-4 text-black font-bold text-[19px] md:text-[21px] border-b border-zinc-200 bg-white text-center"
            >
              {dayjs(dateParam).format("dddd")}
            </div>
            <div
              ref={el => { lblHeadRefs.current[1] = el; }}
              className="flex items-center justify-center py-2 px-4 text-black font-extrabold text-[19px] md:text-[21px] border-b border-zinc-200 bg-white text-center"
            >
              {dayjs(dateParam).format("DD/MM/YYYY")}
            </div>
            {rows.map((row, i) => (
              <div
                key={row.key}
                ref={el => { lblRowRefs.current[i] = el; }}
                className="flex items-center justify-center px-4 font-bold text-muted-foreground text-[19px] md:text-[21px] border-b border-zinc-200 last:border-b-0 bg-zinc-50/30"
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
                ref={colIdx === 0 ? el => { srcHeadRefs.current[0] = el; } : undefined}
                className="flex items-center justify-center py-2.5 px-4 text-black font-bold text-[19px] md:text-[21px] border-b border-zinc-200 bg-white text-center"
              >
                {loc.location}
              </div>
              {/* Header row 2 */}
              <div
                ref={colIdx === 0 ? el => { srcHeadRefs.current[1] = el; } : undefined}
                className="flex items-center justify-center py-2 px-4 text-black font-extrabold text-[19px] md:text-[21px] border-b border-zinc-200 bg-white text-center uppercase"
              >
                {loc.code}
              </div>
              {/* Prize rows */}
              {rows.map((row, rowIdx) => {
                const prizes = loc[row.key] as Prize[];
                return (
                  <div
                    key={row.key}
                    ref={colIdx === 0 ? el => { srcRowRefs.current[rowIdx] = el; } : undefined}
                    className={`flex flex-col items-center justify-center border-b border-zinc-200 last:border-b-0 text-center ${row.color}`}
                  >
                    {prizes && prizes.length > 0 ? (
                      prizes.map((pz, idx) => (
                        <span
                          key={idx}
                          className=" tracking-wide hover:bg-primary hover:text-primary-foreground rounded-xl w-full cursor-pointer"
                        >
                          {pz.value || <span className=" font-normal">XX</span>}
                        </span>
                      ))
                    ) : (
                      <span className=" font-normal">--</span>
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

