"use client";

import React from "react";
import dayjs from "dayjs";
import { LocationData, Prize } from "@/lib/mockData";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";

interface LotteryTableLayoutOneProps {
  periodData: any;
  dateParam: string;
}

export function LotteryTableLayoutOne({ periodData, dateParam }: LotteryTableLayoutOneProps) {
  if (!periodData || !periodData.data || periodData.data.length === 0) return null;
  const locations = periodData.data as LocationData[];

  const rows = [
    { key: "gEight", label: "Gi 8", color: "text-red-600 font-extrabold text-[30px] md:text-[40px]" },
    { key: "gSeven", label: "Gi 7", color: "text-zinc-800 text-[25px] md:text-[30px] font-bold" },
    { key: "gSix", label: "Gi 6", color: "text-zinc-800 text-[20px] md:text-[25px] font-bold" },
    { key: "gFive", label: "Gi 5", color: "text-zinc-800 text-[20px] md:text-[25px] font-bold" },
    { key: "gFour", label: "Gi 4", color: "text-zinc-800 text-[20px] md:text-[25px] font-bold" },
    { key: "gThree", label: "Gi 3", color: "text-zinc-800 text-[20px] md:text-[25px] font-bold" },
    { key: "gTwo", label: "Gi 2", color: "text-zinc-800 text-[20px] md:text-[25px] font-bold" },
    { key: "gOne", label: "Gi 1", color: "text-zinc-800 text-[20px] md:text-[25px] font-bold" },
    { key: "db", label: "Đ. B", color: "text-red-600 font-extrabold text-[30px] md:text-[40px]" },
  ];

  const formattedName = periodData.name.toUpperCase().replace("SỔ KẾT QUẢ", "KẾT QUẢ XỔ SỐ");

  return (
    <div className=" rounded-lg shadow-md  overflow-hidden mb-8 transition-all hover:shadow-lg">
      {/* Table header */}
      <div className="bg-primary text-primary-foreground px-4 py-2 font-bold  text-lg md:text-xl text-center flex flex-col sm:flex-row justify-center items-center gap-1 shadow-sm uppercase">
        <span>{periodData.displayNumber} - {dayjs(dateParam).format("DD/MM/YYYY")} {formattedName}</span>
      </div>

      {/* Responsive wrapper */}
      <div className="overflow-x-auto border-t ">
        <Table className="w-full min-w-[500px] border-collapse ">
          <TableHeader className=" border-b ">
            {/* Row 1 of Header */}
            <TableRow className="hover:bg-transparent border-b ">
              <TableHead className="py-2.5 px-4 text-black font-bold text-[19px] md:text-[21px] border-r  w-1/4 text-center bg-white">
                {dayjs(dateParam).format("dddd")}
              </TableHead>
              {locations.map((loc, i) => (
                <TableHead key={i} className="py-2.5 px-4 text-black font-bold text-[19px] md:text-[21px] border-r  last:border-r-0 text-center bg-white">
                  {loc.location}
                </TableHead>
              ))}
            </TableRow>
            {/* Row 2 of Header */}
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-2 px-4 text-black font-extrabold text-[19px] md:text-[21px] border-r  w-1/4 text-center bg-white">
                {dayjs(dateParam).format("DD/MM/YYYY")}
              </TableHead>
              {locations.map((loc, i) => (
                <TableHead key={i} className="py-2 px-4 text-black font-extrabold text-[19px] md:text-[21px] border-r  last:border-r-0 text-center bg-white uppercase">
                  {loc.code}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key} className="border-b border-zinc-200 last:border-b-0 hover:bg-zinc-50/50 transition-colors">
                {/* Left Label */}
                <TableCell className="py-4 px-4 font-bold text-muted-foreground text-[19px] md:text-[21px] border-r border-zinc-200 text-center bg-zinc-50/30">
                  {row.label}
                </TableCell>
                {/* Values */}
                {locations.map((loc, i) => {
                  const prizes = loc[row.key] as Prize[];
                  return (
                    <TableCell key={i} className={`border-r border-zinc-200 last:border-r-0 text-center !px-1 py-1! ${row.color}`}>
                      <div className="flex flex-col justify-center items-center ">
                        {prizes && prizes.length > 0 ? (
                          prizes.map((pz, idx) => (
                            <span key={idx} className="tracking-wide hover:bg-primary hover:text-primary-foreground rounded-xl w-full transition-all cursor-pointer">
                              {pz.value || <span className="text-zinc-300 font-normal">XX</span>}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-300 font-normal">--</span>
                        )}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
