"use client";

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

export function LotteryTableLayoutTwo({ periodData, dateParam }: LotteryTableLayoutTwoProps) {
  if (!periodData || !periodData.data || periodData.data.length === 0) return null;
  const mainData = periodData.data[0] as LocationData;

  const getPrizesMeta = () => {
    const list: { key: string; label: string }[] = [];
    list.push({ key: "db", label: "Đ. B" });
    list.push({ key: "gOne", label: "Gi 1" });
    list.push({ key: "gTwo", label: "Gi 2 (1)" });
    list.push({ key: "gTwo", label: "Gi 2 (2)" });
    for (let i = 1; i <= 6; i++)
      list.push({ key: "gThree", label: `Gi 3 (${i})` });
    for (let i = 1; i <= 4; i++)
      list.push({ key: "gFour", label: `Gi 4 (${i})` });
    for (let i = 1; i <= 6; i++)
      list.push({ key: "gFive", label: `Gi 5 (${i})` });
    for (let i = 1; i <= 3; i++)
      list.push({ key: "gSix", label: `Gi 6 (${i})` });
    for (let i = 1; i <= 4; i++)
      list.push({ key: "gSeven", label: `Gi 7 (${i})` });
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
      if (["gTwo", "gThree", "gFour", "gFive", "gSix", "gSeven"].includes(key)) {
        label = label.replace(/\s*\(\d+\)$/, "");
      }
      return label;
    }
    return defaultLabel;
  };

  const rows = [
    { key: "db", label: getRowLabel("db", "Đ. B") },
    { key: "gOne", label: getRowLabel("gOne", "Gi 1") },
    { key: "gTwo", label: getRowLabel("gTwo", "Gi 2") },
    { key: "gThree", label: getRowLabel("gThree", "Gi 3") },
    { key: "gFour", label: getRowLabel("gFour", "Gi 4") },
    { key: "gFive", label: getRowLabel("gFive", "Gi 5") },
    { key: "gSix", label: getRowLabel("gSix", "Gi 6") },
    { key: "gSeven", label: getRowLabel("gSeven", "Gi 7") }];

  const renderNorthernPrizeCell = (key: string, prizes: Prize[]) => {
    if (!prizes || prizes.length === 0) return <div className="text-zinc-300 font-normal">--</div>;

    switch (key) {
      case "db":
        return (
          <div className=" hover:bg-primary transition-all hover:text-primary-foreground rounded-xs cursor-pointer  text-red-655 text-[35px] md:text-[40px] tracking-wider text-center w-full">
            {prizes[0]?.value || <span className="">X</span>}
          </div>
        );
      case "gOne":
        return (
          <div className=" hover:bg-primary transition-all hover:text-primary-foreground rounded-xs cursor-pointer text-zinc-800 font-bold text-[20px] md:text-[25px] tracking-wider text-center w-full">
            {prizes[0]?.value || <span className="text-zinc-300 font-normal">X</span>}
          </div>
        );
      case "gTwo":
        return (
          <div className="flex justify-around items-center w-full  text-zinc-800 font-bold text-[20px] md:text-[25px] tracking-wider px-1">
            {prizes.map((pz, idx) => (
              <span key={idx} className="hover:bg-primary transition-all hover:text-primary-foreground w-full rounded-xs cursor-pointer">
                {pz.value || <span className="text-zinc-300 font-normal">X</span>}
              </span>
            ))}
          </div>
        );
      case "gThree":
      case "gFive":
        return (
          <div className="grid grid-cols-3 gap-y-2 gap-x-4 justify-center items-center w-full text-center  text-zinc-800 font-bold text-[20px] md:text-[25px] tracking-wider px-4">
            {prizes.map((pz, idx) => (
              <span key={idx} className="hover:bg-primary transition-all hover:text-primary-foreground w-full rounded-xs cursor-pointer">{pz.value || <span className="text-muted-foreground font-normal">X</span>}</span>
            ))}
          </div>
        );
      case "gFour":
        return (
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 justify-center items-center w-full text-center  text-zinc-800 font-bold text-[20px] md:text-[25px] tracking-wider px-12">
            {prizes.map((pz, idx) => (
              <span key={idx} className="hover:bg-primary p-0! transition-all hover:text-primary-foreground w-full rounded-xs cursor-pointer">{pz.value || <span className="text-muted-foreground font-normal">X</span>}</span>
            ))}
          </div>
        );
      case "gSix":
        return (
          <div className="grid grid-cols-3 gap-x-4 justify-center items-center w-full text-center  text-zinc-800 font-bold text-[20px] md:text-[25px] tracking-wider px-4">
            {prizes.map((pz, idx) => (
              <span key={idx} className="hover:bg-primary transition-all hover:text-primary-foreground w-full rounded-xs cursor-pointer">{pz.value || <span className="text-muted-foreground font-normal">X</span>}</span>
            ))}
          </div>
        );
      case "gSeven":
        return (
          <div className="grid grid-cols-4 gap-x-2 justify-center items-center w-full text-center  text-red-655 font-extrabold tracking-wider text-[30px] md:text-[35px]">
            {prizes.map((pz, idx) => (
              <span key={idx} className="hover:bg-primary transition-all hover:text-primary-foreground w-full rounded-xs cursor-pointer">{pz.value || <span className="text-muted-foreground font-normal">X</span>}</span>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const formattedName = periodData.name.toUpperCase().replace("SỔ KẾT QUẢ", "KẾT QUẢ XỔ SỐ");

  return (
    <div className="rounded-xs shadow-md  overflow-hidden mb-8 transition-all hover:shadow-lg">
      {/* Table header */}
      <div className="bg-primary text-primary-foreground py-1 font-bold text-center flex flex-col sm:flex-row justify-center items-center uppercase">
        <span>{periodData.displayNumber} - {dayjs(dateParam).format("DD/MM/YYYY")} {formattedName}</span>
      </div>

      <Table className="w-full border-collaps">
        <TableBody>
          {/* Location row */}
          <TableRow className="border-b border-zinc-200 font-bold hover:bg-transparent">
            <TableCell className=" font-bold text-xl border-r border-zinc-200 w-1/4 text-center">
              {dayjs(dateParam).format("dddd")}
            </TableCell>
            <TableCell className="text-xl text-center font-extrabold">
              Ngày: {dayjs(dateParam).format("DD/MM/YYYY")}
            </TableCell>
          </TableRow>
          {/* Prizes rows */}
          {rows.map((row) => {
            const prizes = mainData[row.key] as Prize[];
            return (
              <TableRow key={row.key} className="border-b border-zinc-200 last:border-b-0 hover:bg-zinc-50/50 transition-colors">
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
