"use client";

import { useMemo } from "react";
import dayjs from "dayjs";
import { LocationData, Prize } from "@/lib/mockData";
import { useDrawStatuses } from "@/hooks/useDrawStatus";
import { formatDisplayDateTime } from "@/lib/utils";
import { DEFAULT_LOTTERY_DISPLAY_SETTINGS } from "@/lib/lottery-display";
import { trpc } from "@/app/_trpc/client";
import { Loader2 } from "lucide-react";
import { computeCellDrawStatus } from "@/lib/lottery-cell-status";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { RollingDigits } from "@/components/RollingDigits";

const LAYOUT_TWO_DIGIT_LENGTHS: Record<string, number> = {
  gSeven: 2,
  gSix: 3,
  gFive: 4,
  gFour: 4,
  gThree: 5,
  gTwo: 5,
  gOne: 5,
  db: 5,
};

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
function renderNorthernPrizeCell(
  key: string,
  prizes: Prize[] | undefined,
  dateParam: string,
  drawTime: string | undefined,
  config: any,
  getNextSlotIndex: () => number,
  allColumnPrizes: { pz: Prize; expectedLength: number }[],
) {
  if (!prizes || prizes.length === 0)
    return <div className="text-zinc-300 font-normal leading-none">--</div>;

  const expectedLength = LAYOUT_TWO_DIGIT_LENGTHS[key] ?? 5;
  const cellItem =
    "hover:bg-primary hover:text-primary-foreground w-full rounded-xs cursor-pointer leading-none";

  const val = (pz: Prize, idx: number) => {
    const slotIdx = getNextSlotIndex();
    const cellStatus = computeCellDrawStatus(dateParam, drawTime, 0, slotIdx, config);
    const len = pz.value ? pz.value.length : expectedLength;

    // Stage 3 — Reveal the real number (timing cleared AND value ready)
    if (cellStatus === "done" && pz.value) {
      return <span>{pz.value}</span>;
    }

    // Stage 1 — Not yet time for this slot's splash
    if (cellStatus === "pending") {
      return (
        <span className="inline-flex items-center justify-center gap-0.5 overflow-hidden">
          {Array.from({ length: expectedLength }).map((_, d) => (
            <Loader2 key={d} className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin text-muted-foreground/70 shrink-0" />
          ))}
        </span>
      );
    }

    // Stage 2 — Splash window active ("spinning"), OR window passed but
    // value not yet available ("done" + no value): keep rolling, never blank.
    // Also check: if a previous slot in this column is still rolling
    // (done-by-time but no value), keep this cell frozen as pending too.
    const anyPreviousStillRolling = allColumnPrizes
      .slice(0, slotIdx)
      .some((entry) => {
        if (entry.pz.value) return false;
        // previous slot has no value yet → it's still rolling
        return true;
      });

    if (anyPreviousStillRolling) {
      return (
        <span className="inline-flex items-center justify-center gap-0.5 overflow-hidden">
          {Array.from({ length: expectedLength }).map((_, d) => (
            <Loader2 key={d} className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin text-muted-foreground/70 shrink-0" />
          ))}
        </span>
      );
    }

    // "spinning" OR "done-but-no-value": keep rolling until the server delivers the number
    return <RollingDigits length={len} />;
  };

  switch (key) {
    case "db":
      return (
        <div className={`${cellItem} text-red-600 text-[28px] md:text-[30px] font-semibold py-0.5`}>
          {val(prizes[0], 0)}
        </div>
      );
    case "gOne":
      return (
        <div className={`${cellItem} text-zinc-800 font-semibold text-[17px] md:text-[19px] py-1`}>
          {val(prizes[0], 0)}
        </div>
      );
    case "gTwo":
      return (
        <div className="flex justify-around items-center w-full text-zinc-800 font-semibold text-[17px] md:text-[19px] px-1">
          {prizes.map((pz, idx) => (
            <span key={idx} className={cellItem}>{val(pz, idx)}</span>
          ))}
        </div>
      );
    case "gThree":
    case "gFive":
      return (
        <div className="grid grid-cols-3 gap-y-1 gap-x-4 justify-center items-center w-full text-center text-zinc-800 font-semibold text-[17px] md:text-[19px] px-4">
          {prizes.map((pz, idx) => (
            <span key={idx} className={cellItem}>{val(pz, idx)}</span>
          ))}
        </div>
      );
    case "gFour":
      return (
        <div className="grid grid-cols-2 gap-y-1 gap-x-4 justify-center items-center w-full text-center text-zinc-800 font-semibold text-[17px] md:text-[19px] px-2 sm:px-4">
          {prizes.map((pz, idx) => (
            <span key={idx} className={`${cellItem} p-0!`}>{val(pz, idx)}</span>
          ))}
        </div>
      );
    case "gSix":
      return (
        <div className="grid grid-cols-3 gap-y-1 gap-x-4 justify-center items-center w-full text-center text-zinc-800 font-semibold text-[17px] md:text-[19px] px-4">
          {prizes.map((pz, idx) => (
            <span key={idx} className={cellItem}>{val(pz, idx)}</span>
          ))}
        </div>
      );
    case "gSeven":
      return (
        <div className="grid grid-cols-4 gap-x-2 justify-center items-center w-full text-center text-red-600 font-semibold text-[22px] md:text-[25px]">
          {prizes.map((pz, idx) => (
            <span key={idx} className={cellItem}>{val(pz, idx)}</span>
          ))}
        </div>
      );
    default:
      return null;
  }
}

export function LotteryTableLayoutTwo({ periodData, dateParam }: LotteryTableLayoutTwoProps) {
  const { data: displaySettings } = trpc.getLotteryDisplaySettings.useQuery();
  const displayConfig = displaySettings ?? DEFAULT_LOTTERY_DISPLAY_SETTINGS;
  const { columnStatuses, isPending, isSpinning } = useDrawStatuses(
    dateParam,
    periodData?.displayNumber,
    1,
    displayConfig,
  );
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
  const drawDateTimeLabel = formatDisplayDateTime(
    dateParam,
    periodData.displayNumber,
    "hh:mm A"
  );

  return (
    <div className="rounded-xs shadow-md mb-8 hover:shadow-lg">
      {/* Table header */}
      <div className="bg-primary text-primary-foreground py-1 font-bold text-center flex flex-col sm:flex-row justify-center items-center uppercase text-xs sm:text-sm">
        <span>
          {drawDateTimeLabel} {formattedName}
        </span>
      </div>

      {/* Pending notice */}
      {/* {isPending && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-amber-700 text-xs text-center font-medium">
          Chưa đến giờ quay · Mở thưởng lúc <span className="font-bold">{drawDateTimeLabel}</span>
        </div>
      )} */}

      <Table className="w-full border-collapse mb-2">
        <TableBody>
          {/* Location row */}
          <TableRow className="border-b border-zinc-200 font-bold hover:bg-transparent">
            <TableCell className="font-semibold capitalize text-sm md:text-base border-r border-zinc-200 w-1/4 text-center py-1">
              {dayjs(dateParam).format("dddd")}
            </TableCell>
            <TableCell className="text-sm md:text-base text-center font-semibold py-1">
              Ngày: {formatDisplayDateTime(dateParam)}
            </TableCell>
          </TableRow>

          {/* Prize rows */}
          {(() => {
            // Collect all prizes for the column in order to check previous slots
            const allColumnPrizes: { pz: Prize; expectedLength: number }[] = [];
            rows.forEach((row) => {
              const prizes = (mainData[row.key] as Prize[]) || [];
              const expectedLength = LAYOUT_TWO_DIGIT_LENGTHS[row.key] ?? 5;
              if (prizes.length > 0) {
                prizes.forEach((pz) => allColumnPrizes.push({ pz, expectedLength }));
              }
            });

            let globalSlotIndex = 0;
            return rows.map((row) => {
              const prizes = mainData[row.key] as Prize[];
              return (
                <TableRow
                  key={row.key}
                  className="border-b border-zinc-200 last:border-b-0 hover:bg-zinc-50/50 transition-colors"
                >
                  <TableCell className="p-0 font-medium text-sm md:text-base text-muted-foreground border-r border-zinc-200 text-center">
                    {row.label}
                  </TableCell>
                  <TableCell className="p-0 text-center text-primary">
                    {renderNorthernPrizeCell(
                      row.key,
                      prizes,
                      dateParam,
                      periodData?.displayNumber,
                      displayConfig,
                      () => globalSlotIndex++,
                      allColumnPrizes,
                    )}
                  </TableCell>
                </TableRow>
              );
            });
          })()}
        </TableBody>
      </Table>
    </div>
  );
}