"use client";

import { useMemo } from "react";
import dayjs from "dayjs";
import { LocationData, Prize } from "@/lib/mockData";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";

interface LotteryTableLayoutTwoProps {
  periodData: any;
  dateParam: string;
}

// ── Static metadata — built once, not on every render ──────────────
const PRIZES_META: { key: string; label: string }[] = [
  { key: "db", label: "Đ. B" },
  { key: "gOne", label: "Gi 1" },
  { key: "gTwo", label: "Gi 2 (1)" },
  { key: "gTwo", label: "Gi 2 (2)" },
  ...Array.from({ length: 6 }, (_, i) => ({ key: "gThree", label: `Gi 3 (${i + 1})` })),
  ...Array.from({ length: 4 }, (_, i) => ({ key: "gFour", label: `Gi 4 (${i + 1})` })),
  ...Array.from({ length: 6 }, (_, i) => ({ key: "gFive", label: `Gi 5 (${i + 1})` })),
  ...Array.from({ length: 3 }, (_, i) => ({ key: "gSix", label: `Gi 6 (${i + 1})` })),
  ...Array.from({ length: 4 }, (_, i) => ({ key: "gSeven", label: `Gi 7 (${i + 1})` })),
];

const NUMBERED_KEYS = new Set(["gTwo", "gThree", "gFour", "gFive", "gSix", "gSeven"]);

const DEFAULT_ROW_LABELS: { key: string; defaultLabel: string }[] = [
  { key: "db", defaultLabel: "Đ. B" },
  { key: "gOne", defaultLabel: "Gi 1" },
  { key: "gTwo", defaultLabel: "Gi 2" },
  { key: "gThree", defaultLabel: "Gi 3" },
  { key: "gFour", defaultLabel: "Gi 4" },
  { key: "gFive", defaultLabel: "Gi 5" },
  { key: "gSix", defaultLabel: "Gi 6" },
  { key: "gSeven", defaultLabel: "Gi 7" },
];

function getRowLabel(
  key: string,
  defaultLabel: string,
  prizeLabels: string[] | undefined
) {
  if (!Array.isArray(prizeLabels)) return defaultLabel;
  const idx = PRIZES_META.findIndex((item) => item.key === key);
  if (idx !== -1 && prizeLabels[idx]) {
    let label = prizeLabels[idx];
    if (NUMBERED_KEYS.has(key)) label = label.replace(/\s*\(\d+\)$/, "");
    return label;
  }
  return defaultLabel;
}

// ── Pure render function — no component state needed, so it lives ──
// outside the component and isn't recreated every render.
function renderNorthernPrizeCell(key: string, prizes: Prize[] | undefined) {
  if (!prizes || prizes.length === 0)
    return <div className="text-zinc-300 font-normal leading-none">--</div>;

  const cellItem =
    "hover:bg-primary hover:text-primary-foreground w-full rounded-xs cursor-pointer leading-none";

  switch (key) {
    case "db":
      return (
        <div className={`${cellItem} text-red-655 text-[35px] md:text-[40px] tracking-wider text-center font-bold`}>
          {prizes[0]?.value || <span>X</span>}
        </div>
      );
    case "gOne":
      return (
        <div className={`${cellItem} text-zinc-800 font-semibold text-[20px] md:text-[25px] tracking-wider text-center`}>
          {prizes[0]?.value || <span className="text-zinc-300 font-normal">X</span>}
        </div>
      );
    case "gTwo":
      return (
        <div className="flex justify-around items-center w-full text-zinc-800 font-semibold text-[20px] md:text-[25px] tracking-wider leading-none px-1">
          {prizes.map((pz, idx) => (
            <span key={idx} className={cellItem}>
              {pz.value || <span className="text-zinc-300 font-normal">X</span>}
            </span>
          ))}
        </div>
      );
    case "gThree":
    case "gFive":
      return (
        <div className="grid grid-cols-3 gap-y-1 gap-x-4 justify-center items-center w-full text-center text-zinc-800 font-semibold text-[20px] md:text-[25px] tracking-wider leading-none px-4">
          {prizes.map((pz, idx) => (
            <span key={idx} className={cellItem}>
              {pz.value || <span className="text-muted-foreground font-normal">X</span>}
            </span>
          ))}
        </div>
      );
    case "gFour":
      return (
        <div className="grid grid-cols-2 gap-y-1 gap-x-4 justify-center items-center w-full text-center text-zinc-800 font-semibold text-[20px] md:text-[25px] tracking-wider leading-none px-12">
          {prizes.map((pz, idx) => (
            <span key={idx} className={`${cellItem} p-0!`}>
              {pz.value || <span className="text-muted-foreground font-normal">X</span>}
            </span>
          ))}
        </div>
      );
    case "gSix":
      return (
        <div className="grid grid-cols-3 gap-y-1 gap-x-4 justify-center items-center w-full text-center text-zinc-800 font-semibold text-[20px] md:text-[25px] tracking-wider leading-none px-4">
          {prizes.map((pz, idx) => (
            <span key={idx} className={cellItem}>
              {pz.value || <span className="text-muted-foreground font-normal">X</span>}
            </span>
          ))}
        </div>
      );
    case "gSeven":
      return (
        <div className="grid grid-cols-4 gap-x-2 justify-center items-center w-full text-center text-red-655 font-bold tracking-wider leading-none text-[30px] md:text-[35px]">
          {prizes.map((pz, idx) => (
            <span key={idx} className={cellItem}>
              {pz.value || <span className="text-muted-foreground font-normal">X</span>}
            </span>
          ))}
        </div>
      );
    default:
      return null;
  }
}

export function LotteryTableLayoutTwo({ periodData, dateParam }: LotteryTableLayoutTwoProps) {
  const rows = useMemo(() => {
    if (!periodData?.data?.length) return [];
    return DEFAULT_ROW_LABELS.map(({ key, defaultLabel }) => ({
      key,
      label: getRowLabel(key, defaultLabel, periodData.prizeLabels),
    }));
  }, [periodData?.prizeLabels]);

  if (!periodData || !periodData.data || periodData.data.length === 0) return null;
  const mainData = periodData.data[0] as LocationData;

  const formattedName = periodData.name
    .toUpperCase()
    .replace("SỔ KẾT QUẢ", "KẾT QUẢ XỔ SỐ");

  return (
    <div className="rounded-xs shadow-md mb-8  hover:shadow-lg">
      {/* Table header */}
      <div className="bg-primary text-primary-foreground py-1 font-bold text-center flex flex-col sm:flex-row justify-center items-center uppercase">
        <span>
          {periodData.displayNumber} - {dayjs(dateParam).format("DD/MM/YYYY")} {formattedName}
        </span>
      </div>

      <Table className="w-full border-collapse mb-2">
        <TableBody >
          {/* Location row */}
          <TableRow className="border-b border-zinc-200 font-bold hover:bg-transparent">
            <TableCell className="font-bold text-xl border-r border-zinc-200 w-1/4 text-center">
              {dayjs(dateParam).format("dddd")}
            </TableCell>
            <TableCell className="text-xl text-center font-extrabold">
              Ngày: {dayjs(dateParam).format("DD/MM/YYYY")}
            </TableCell>
          </TableRow>

          {/* Prize rows */}
          {rows.map((row) => {
            const prizes = mainData[row.key] as Prize[];
            return (
              <TableRow
                key={row.key}
                className="border-b border-zinc-200 last:border-b-0 hover:bg-zinc-50/50 transition-colors"
              >
                <TableCell className="p-0 font-bold text-xl text-muted-foreground border-r border-zinc-200 text-center">
                  {row.label}
                </TableCell>
                <TableCell className="p-0 text-center text-primary">
                  {renderNorthernPrizeCell(row.key, prizes)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}