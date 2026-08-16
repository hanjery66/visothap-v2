"use client";

import React, { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { LotteryState } from "@/lib/mockData";
import { trpc } from "@/app/_trpc/client";
import { LotteryTableLayoutOne } from "@/components/LotteryTableLayoutOne";
import { LotteryTableLayoutTwo } from "@/components/LotteryTableLayoutTwo";
import AdsCard from "./_component/ads-card";
import { Ads } from "@/db/schema";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AdFromQuery } from "@/types";

dayjs.locale("vi");

export default function LandingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get selected date (defaults to today's date)
  const todayStr = dayjs().format("YYYY-MM-DD");
  const dateParam = searchParams.get("date") || todayStr;
  const tableParam = searchParams.get("table") || "Thông Tin Kết Quả";

  const [calendarDate, setCalendarDate] = useState(dayjs(dateParam));

  // Query lottery data from DB (refetch every 30 seconds)
  const { data: lottery } = trpc.getLotteryByDate.useQuery(
    { date: dateParam },
    { refetchInterval: 30_000 },
  ) as { data: LotteryState | null | undefined };

  // Query advertisements from database
  const { data: ads = [] } = trpc.getAdvertisements.useQuery();

  // Group ads by position
  const adsByPosition = useMemo(() => {
    const activeAds = ads.filter((ad: AdFromQuery) => ad.status);
    return activeAds.reduce(
      (acc: { Left: Ads[]; Right: Ads[]; Center: Ads[] }, ad: AdFromQuery) => {
        const pos = ad.position as keyof typeof acc;
        acc[pos].push(ad as unknown as Ads);
        return acc;
      },
      { Left: [], Right: [], Center: [] } as {
        Left: Ads[];
        Right: Ads[];
        Center: Ads[];
      },
    );
  }, [ads]);

  // Update URL on calendar selection
  const handleDateSelect = (date: dayjs.Dayjs) => {
    setCalendarDate(date);
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", date.format("YYYY-MM-DD"));
    router.push(`/?${params.toString()}`);
  };

  // Check which tables are matching the search/table param filters
  const shouldRenderPeriod = (periodName: string) => {
    if (tableParam === "Thông Tin Kết Quả") return true;
    return periodName
      .toLowerCase()
      .includes(tableParam.split(" ").pop()?.toLowerCase() || "");
  };

  // Build high-performance custom responsive calendar
  const renderCalendar = () => {
    const startOfMonth = calendarDate.startOf("month");
    const endOfMonth = calendarDate.endOf("month");
    const startDay = startOfMonth.day();
    const daysInMonth = calendarDate.daysInMonth();

    // Days grid array
    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(calendarDate.date(i));
    }

    const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    return (
      <div className="rounded  shadow-md border border-zinc-100 p-2.5 sm:p-4 transition-all hover:shadow-lg bg-background w-full max-w-full overflow-hidden">
        {/* Month selector */}
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={() => setCalendarDate(calendarDate.subtract(1, "month"))}
            className="p-1 hover:bg-zinc-100 rounded transition-colors text-zinc-600"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          <span className="font-bold text-zinc-800 text-xs sm:text-sm capitalize">
            Tháng {calendarDate.format("MM, YYYY")}
          </span>
          <button
            onClick={() => setCalendarDate(calendarDate.add(1, "month"))}
            className="p-1 hover:bg-zinc-100 rounded transition-colors text-zinc-600"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center font-semibold text-zinc-500 text-[11px] sm:text-xs mb-1.5">
          {weekdays.map((w) => (
            <div key={w} className="py-0.5">
              {w}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="aspect-square w-full" />;

            const isSelected = day.format("YYYY-MM-DD") === dateParam;
            const isToday = day.format("YYYY-MM-DD") === todayStr;

            return (
              <button
                key={day.toString()}
                onClick={() => handleDateSelect(day)}
                className={`aspect-square w-full h-auto text-xs sm:text-sm font-semibold rounded transition-all flex items-center justify-center p-0 ${isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : isToday
                    ? "bg-red-50 text-primary border border-primary/50"
                    : "hover:bg-zinc-100 "
                  }`}
              >
                {day.date()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-12 gap-10 items-start w-full">
      {/* LEFT AD COLUMN (Span 2) */}

      <div className="flex col-span-3 flex-col gap-4">
        {adsByPosition.Left && adsByPosition.Left.length > 0 ? (
          adsByPosition.Left.map((ad: Ads) => (
            <AdsCard key={ad.id} ad={ad} className="h-72 w-full shrink-0" />
          ))
        ) : (
          <div className="h-60 w-full p-4 bg-zinc-50 border border-dashed border-zinc-200 flex items-center justify-center text-center text-xs text-zinc-400 font-medium shrink-0">
            Left Banner Ad
          </div>
        )}
      </div>

      {/* CENTER CONTENT COLUMN (Span 6) */}
      <div className="col-span-6 flex flex-col gap-6">
        {lottery ? (
          (() => {
            const tables: { key: string; component: React.ReactNode }[] = [];
            if (lottery.first && shouldRenderPeriod(lottery.first.name)) {
              tables.push({
                key: "first",
                component: (
                  <LotteryTableLayoutOne
                    periodData={lottery.first}
                    dateParam={dateParam}
                  />
                ),
              });
            }
            if (lottery.second && shouldRenderPeriod(lottery.second.name)) {
              tables.push({
                key: "second",
                component: (
                  <LotteryTableLayoutOne
                    periodData={lottery.second}
                    dateParam={dateParam}
                  />
                ),
              });
            }
            if (lottery.third && shouldRenderPeriod(lottery.third.name)) {
              tables.push({
                key: "third",
                component: (
                  <LotteryTableLayoutOne
                    periodData={lottery.third}
                    dateParam={dateParam}
                  />
                ),
              });
            }
            if (lottery.fourth && shouldRenderPeriod(lottery.fourth.name)) {
              tables.push({
                key: "fourth",
                component: (
                  <LotteryTableLayoutTwo
                    periodData={lottery.fourth}
                    dateParam={dateParam}
                  />
                ),
              });
            }

            const centerAds = adsByPosition.Center || [];

            if (tables.length === 0) {
              return (
                <div className="flex flex-col gap-6">
                  {centerAds.map((ad: Ads) => (
                    <AdsCard key={ad.id} ad={ad} className="h-16 w-full shrink-0" />
                  ))}
                  <div className="rounded shadow-xs border border-zinc-100 p-8 text-center text-zinc-500 font-medium">
                    No matching results table found.
                  </div>
                </div>
              );
            }

            return (
              <div className="flex flex-col gap-6">
                {tables.map((tbl, index) => (
                  <React.Fragment key={tbl.key}>
                    {centerAds[index] && (
                      <AdsCard
                        key={centerAds[index].id}
                        ad={centerAds[index]}
                        className="h-16 w-full shrink-0"
                      />
                    )}
                    {tbl.component}
                  </React.Fragment>
                ))}

                {/* Remaining center ads if there are more ads than tables */}
                {centerAds.slice(tables.length).map((ad: Ads) => (
                  <AdsCard key={ad.id} ad={ad} className="h-16 w-full shrink-0" />
                ))}
              </div>
            );
          })()
        ) : (
          <div className="rounded shadow-xs border border-zinc-100 p-8 text-center text-zinc-500 font-medium flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            Loading data...
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Calendar + Ads (Span 3) */}
      <div className="col-span-3 flex flex-col gap-4">
        {/* Interactive Calendar */}
        {renderCalendar()}

        {/* Right Advertisements */}
        <div className="flex flex-col gap-4">
          {adsByPosition.Right && adsByPosition.Right.length > 0 ? (
            adsByPosition.Right.map((ad: Ads) => (
              <AdsCard key={ad.id} ad={ad} className="h-72 w-full shrink-0" />
            ))
          ) : (
            <div className="h-60 w-full p-4 bg-zinc-50 border border-dashed border-zinc-200 flex items-center justify-center text-center text-xs text-zinc-400 font-medium shrink-0">
              Right Banner Ad
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
