"use client";

import { useMemo } from "react";
import dayjs from "dayjs";
import { LocationData, Prize } from "@/lib/mockData";
import { formatDisplayDateTime } from "@/lib/utils";
import { DEFAULT_LOTTERY_DISPLAY_SETTINGS } from "@/lib/lottery-display";
import { trpc } from "@/app/_trpc/client";
import { DigitSpinner } from "@/components/DigitSpinner";
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
  displayConfig?: any;
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
    return <div className="hover:bg-[#fbebd7] text-zinc-300 font-normal leading-none py-0.5 h-[1.2em] flex items-center justify-center w-full cursor-pointer">--</div>;

  const expectedLength = LAYOUT_TWO_DIGIT_LENGTHS[key] ?? 5;
  const cellItem =
    "hover:bg-[#fbebd7] w-full  cursor-pointer leading-none flex items-center justify-center text-center";

  const val = (pz: Prize, idx: number) => {
    const slotIdx = getNextSlotIndex();
    const cellStatus = computeCellDrawStatus(dateParam, drawTime, 0, slotIdx, config);
    const len = pz.value ? pz.value.length : expectedLength;

    // Stage 0 — Before spinner window: cell is empty / blank
    if (cellStatus === "empty") {
      return (
        <span className="w-full h-[1.2em] flex items-center justify-center leading-none">
          &nbsp;
        </span>
      );
    }

    // Stage 3 — Reveal the real number (timing cleared AND value ready)
    if (cellStatus === "done" && pz.value) {
      return <span className="w-full h-[1.2em] flex items-center justify-center leading-none">{pz.value}</span>;
    }

    // Stage 1 — Not yet time for this slot's splash (show spinner)
    if (cellStatus === "pending") {
      return (
        <span className="w-full h-[1.2em] flex items-center justify-center gap-0.5 overflow-hidden leading-none">
          {Array.from({ length: expectedLength }).map((_, d) => (
            <DigitSpinner key={d} className="my-0.5 h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
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
        <span className="w-full h-[1.2em] flex items-center justify-center gap-0.5 overflow-hidden leading-none">
          {Array.from({ length: expectedLength }).map((_, d) => (
            <DigitSpinner key={d} className="my-0.5 h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
          ))}
        </span>
      );
    }

    // "spinning" OR "done-but-no-value": keep rolling until the server delivers the number
    return <span className="w-full h-[1.2em] flex items-center justify-center leading-none"><RollingDigits length={len} /></span>;
  };

  switch (key) {
    case "db":
      return (
        <div className={`${cellItem} text-primary text-[35px] md:text-[40px] font-semibold py-0.5 sm:py-1`}>
          {val(prizes[0], 0)}
        </div>
      );
    case "gOne":
      return (
        <div className={`${cellItem} text-zinc-800 font-semibold text-[25px] md:text-[30px] py-0.5`}>
          {val(prizes[0], 0)}
        </div>
      );
    case "gTwo":
      return (
        <div className="flex justify-around items-stretch w-full h-full text-zinc-800 font-semibold text-[18px] md:text-[20px]">
          {prizes.map((pz, idx) => (
            <div key={idx} className={`${cellItem} flex-1 py-0.5`}>{val(pz, idx)}</div>
          ))}
        </div>
      );
    case "gThree":
    case "gFive":
      return (
        <div className="grid grid-cols-3 w-full h-full text-center text-zinc-800 font-semibold text-[18px] md:text-[20px]">
          {prizes.map((pz, idx) => (
            <div key={idx} className={`${cellItem} py-0.5`}>{val(pz, idx)}</div>
          ))}
        </div>
      );
    case "gFour":
      return (
        <div className="grid grid-cols-2 w-full h-full text-center text-zinc-800 font-semibold text-[18px] md:text-[20px]">
          {prizes.map((pz, idx) => (
            <div key={idx} className={`${cellItem} py-0.5`}>{val(pz, idx)}</div>
          ))}
        </div>
      );
    case "gSix":
      return (
        <div className="grid grid-cols-3 w-full h-full text-center text-zinc-800 font-semibold text-[18px] md:text-[20px]">
          {prizes.map((pz, idx) => (
            <div key={idx} className={`${cellItem} py-0.5`}>{val(pz, idx)}</div>
          ))}
        </div>
      );
    case "gSeven":
      return (
        <div className="grid grid-cols-4 w-full h-full text-center text-primary font-semibold text-[30px] md:text-[35px]">
          {prizes.map((pz, idx) => (
            <div key={idx} className={`${cellItem} py-0.5`}>{val(pz, idx)}</div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

export function LotteryTableLayoutTwo({
  periodData,
  dateParam,
  displayConfig: propDisplayConfig,
}: LotteryTableLayoutTwoProps) {
  const { data: displaySettings } = trpc.getLotteryDisplaySettings.useQuery(undefined, {
    enabled: !propDisplayConfig,
  });
  const displayConfig = propDisplayConfig ?? displaySettings ?? DEFAULT_LOTTERY_DISPLAY_SETTINGS;
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
    "hh:mm A - DD/MM/YYYY"
  );

  return (
    <div className="rounded shadow-md overflow-hidden transition-all hover:shadow-lg">
      {/* Table header */}
      <div className="bg-primary text-primary-foreground font-bold text-center flex flex-col sm:flex-row justify-center items-center gap-1 uppercase py-1.5 text-xs sm:text-sm">
        <span>
          {drawDateTimeLabel} {" "} {formattedName}
        </span>
      </div>

      <div className="w-full overflow-hidden">
        <div className="w-full">
          <Table className="w-full border-collapse table-fixed">
            <TableBody>
              {/* Location row */}
              <TableRow className="border-b border-zinc-200 font-bold hover:bg-transparent">
                <TableCell className="font-semibold capitalize text-sm md:text-base border-r border-zinc-200 w-1/5 text-center py-0.5">
                  {dayjs(dateParam).format("dddd")}
                </TableCell>
                <TableCell className="text-sm md:text-base text-center font-semibold py-0.5 w-4/5">
                  Ngày: {formatDisplayDateTime(dateParam, undefined, "DD/MM/YYYY")}
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
                      <TableCell className="p-0 font-medium text-sm md:text-base text-muted-foreground border-r border-zinc-200 text-center w-1/5">
                        {row.label}
                      </TableCell>
                      <TableCell className="p-0 text-center text-primary w-4/5">
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
      </div>
    </div>
  );
}