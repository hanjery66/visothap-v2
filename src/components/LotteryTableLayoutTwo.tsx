"use client";

import React from "react";
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

  const rows = [
    { key: "db", label: "Đ. B" },
    { key: "gOne", label: "Gi 1" },
    { key: "gTwo", label: "Gi 2" },
    { key: "gThree", label: "Gi 3" },
    { key: "gFour", label: "Gi 4" },
    { key: "gFive", label: "Gi 5" },
    { key: "gSix", label: "Gi 6" },
    { key: "gSeven", label: "Gi 7" },
  ];

  const renderNorthernPrizeCell = (key: string, prizes: Prize[]) => {
    if (!prizes || prizes.length === 0) return <div className="text-zinc-300 font-normal">--</div>;

    switch (key) {
      case "db":
        return (
          <div className=" hover:bg-primary transition-all hover:text-primary-foreground rounded-xl cursor-pointer  text-red-650 font-extrabold text-[30px] md:text-[35px] tracking-wider text-center w-full">
            {prizes[0]?.value || <span className="text-zinc-300 font-normal ">X</span>}
          </div>
        );
      case "gOne":
        return (
          <div className=" hover:bg-primary transition-all hover:text-primary-foreground rounded-xl cursor-pointer text-zinc-800 font-bold text-[20px] md:text-[25px] tracking-wider text-center w-full">
            {prizes[0]?.value || <span className="text-zinc-300 font-normal">X</span>}
          </div>
        );
      case "gTwo":
        return (
          <div className="flex justify-around items-center w-full  text-zinc-800 font-bold text-[20px] md:text-[25px] tracking-wider px-1">
            {prizes.map((pz, idx) => (
              <span key={idx} className="hover:bg-primary transition-all hover:text-primary-foreground w-full rounded-xl cursor-pointer">{pz.value || <span className="text-zinc-300 font-normal">X</span>}</span>
            ))}
          </div>
        );
      case "gThree":
      case "gFive":
        return (
          <div className="grid grid-cols-3 gap-y-2 gap-x-4 justify-center items-center w-full text-center  text-zinc-800 font-bold text-[20px] md:text-[25px] tracking-wider px-4">
            {prizes.map((pz, idx) => (
              <span key={idx} className="hover:bg-primary transition-all hover:text-primary-foreground w-full rounded-xl cursor-pointer">{pz.value || <span className="text-zinc-300 font-normal">X</span>}</span>
            ))}
          </div>
        );
      case "gFour":
        return (
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 justify-center items-center w-full text-center  text-zinc-800 font-bold text-[20px] md:text-[25px] tracking-wider px-12">
            {prizes.map((pz, idx) => (
              <span key={idx} className="hover:bg-primary transition-all hover:text-primary-foreground w-full rounded-xl cursor-pointer">{pz.value || <span className="text-zinc-300 font-normal">X</span>}</span>
            ))}
          </div>
        );
      case "gSix":
        return (
          <div className="grid grid-cols-3 gap-x-4 justify-center items-center w-full text-center  text-zinc-800 font-bold text-[20px] md:text-[25px] tracking-wider px-4">
            {prizes.map((pz, idx) => (
              <span key={idx} className="hover:bg-primary transition-all hover:text-primary-foreground w-full rounded-xl cursor-pointer">{pz.value || <span className="text-zinc-300 font-normal">X</span>}</span>
            ))}
          </div>
        );
      case "gSeven":
        return (
          <div className="grid grid-cols-4 gap-x-2 justify-center items-center w-full text-center  text-red-650 font-extrabold tracking-wider text-[30px] md:text-[35px]">
            {prizes.map((pz, idx) => (
              <span key={idx} className="hover:bg-primary transition-all hover:text-primary-foreground w-full rounded-xl cursor-pointer">{pz.value || <span className="text-zinc-300 font-normal">X</span>}</span>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const formattedName = periodData.name.toUpperCase().replace("SỔ KẾT QUẢ", "KẾT QUẢ XỔ SỐ");

  return (
    <div className="rounded-lg shadow-md border border-zinc-200 overflow-hidden mb-8 transition-all hover:shadow-lg">
      {/* Table header */}
      <div className="bg-primary text-primary-foreground px-4 py-2 font-bold text-lg md:text-xl text-center flex flex-col sm:flex-row justify-center items-center gap-1 shadow-sm uppercase">
        <span>{periodData.displayNumber} - {dayjs(dateParam).format("DD/MM/YYYY")} {formattedName}</span>
      </div>

      <Table className="w-full border-collapse bg-white">
        <TableBody>
          {/* Location row */}
          <TableRow className="border-b border-zinc-200 font-bold hover:bg-transparent">
            <TableCell className="py-2.5 px-4 text-zinc-800 font-bold text-[20px] md:text-[25px] border-r border-zinc-200 w-1/4 text-center bg-white">
              {dayjs(dateParam).format("dddd")}
            </TableCell>
            <TableCell className="py-2.5 px-4 text-zinc-800 text-[20px] md:text-[25px] text-center font-extrabold bg-white">
              Ngày: {dayjs(dateParam).format("DD/MM/YYYY")}
            </TableCell>
          </TableRow>
          {/* Prizes rows */}
          {rows.map((row) => {
            const prizes = mainData[row.key] as Prize[];
            return (
              <TableRow key={row.key} className="border-b border-zinc-200 last:border-b-0 hover:bg-zinc-50/50 transition-colors">
                <TableCell className="p-1 font-bold text-muted-foreground text-[20px] md:text-[25px] border-r border-zinc-200 text-center bg-zinc-50/30">
                  {row.label}
                </TableCell>
                <TableCell className="p-1 text-center text-primary">
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
