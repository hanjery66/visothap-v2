"use client";

import React, { useState, useMemo, useEffect } from "react";
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

  // Query draw schedule & display settings to determine dynamic default date
  // const { data: schedule } = trpc.getLotterySchedule.useQuery();
  const { data: displaySettings } = trpc.getLotteryDisplaySettings.useQuery();

  const todayStr = dayjs().format("YYYY-MM-DD");

  const explicitDate = searchParams.get("date");
  // If a future date is requested, since we are not there yet, fallback to today
  const isFutureDate = explicitDate
    ? dayjs(explicitDate).isAfter(dayjs(todayStr), "day")
    : false;
  const selectedDateStr = explicitDate && !isFutureDate ? explicitDate : todayStr;
  const tableParam = searchParams.get("table") || "Thông Tin Kết Quả";

  const queryDate = selectedDateStr;

  // Query lottery data from DB (refetch every 5 seconds for live sync)
  const { data: lottery, isLoading: isLotteryLoading } = trpc.getLotteryByDate.useQuery(
    { date: queryDate },
    {
      refetchInterval: 5_000,
    },
  ) as { data: LotteryState | null | undefined; isLoading: boolean };

  const activeDate = lottery?.date || selectedDateStr;

  const [calendarDate, setCalendarDate] = useState(dayjs(selectedDateStr));

  useEffect(() => {
    if (selectedDateStr) {
      setCalendarDate(dayjs(selectedDateStr));
    }
  }, [selectedDateStr]);

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
    if (date.isAfter(dayjs(todayStr), "day")) return;
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
    // Monday-first offset: Mon=0, Tue=1, ..., Sun=6
    const startDay = (startOfMonth.day() + 6) % 7;
    const daysInMonth = calendarDate.daysInMonth();

    // Days grid array
    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(calendarDate.date(i));
    }

    const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

    return (
      <div className="bg-white rounded border border-zinc-200 p-3 shadow-xs select-none">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setCalendarDate((prev) => prev.subtract(1, "month"))}
            className="p-1 hover:bg-zinc-100 rounded text-zinc-600 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-normal text-xs sm:text-sm capitalize text-zinc-800">
            {calendarDate.format("MMMM, YYYY")}
          </span>
          <button
            onClick={() => setCalendarDate((prev) => prev.add(1, "month"))}
            className="p-1 hover:bg-zinc-100 rounded text-zinc-600 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center font-normal text-zinc-500 text-[11px] sm:text-xs mb-1.5">
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

            const isSelected = day.format("YYYY-MM-DD") === selectedDateStr;
            const isToday = day.format("YYYY-MM-DD") === todayStr;
            const isFuture = day.isAfter(dayjs(todayStr), "day");

            return (
              <button
                key={day.toString()}
                onClick={() => !isFuture && handleDateSelect(day)}
                disabled={isFuture}
                className={`aspect-square w-full h-auto text-xs sm:text-sm font-normal rounded transition-all flex items-center justify-center p-0 ${isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : isToday
                    ? "bg-red-50 text-primary border border-primary/50"
                    : isFuture
                      ? "text-zinc-400 cursor-not-allowed hover:bg-transparent"
                      : "hover:bg-zinc-100 text-zinc-700"
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
    <div className="grid grid-cols-[220px_1fr_220px] gap-10 items-start w-full">
      {/* LEFT AD COLUMN */}
      <div className="flex flex-col gap-4">
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

      {/* CENTER CONTENT COLUMN (stretches to fill space) */}
      <div className="flex flex-col gap-6 min-w-0">
        {isLotteryLoading && !lottery ? (
          <div className="rounded shadow-xs border border-zinc-100 p-8 text-center text-zinc-500 font-medium flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            Loading data...
          </div>
        ) : lottery ? (
          (() => {
            const tables: { key: string; component: React.ReactNode }[] = [];
            if (lottery.fourth && shouldRenderPeriod(lottery.fourth.name)) {
              tables.push({
                key: "fourth",
                component: (
                  <LotteryTableLayoutTwo
                    dateParam={activeDate}
                    periodData={lottery.fourth}
                    displayConfig={displaySettings}
                  />
                ),
              });
            }
            if (lottery.third && shouldRenderPeriod(lottery.third.name)) {
              tables.push({
                key: "third",
                component: (
                  <LotteryTableLayoutOne
                    dateParam={activeDate}
                    periodData={lottery.third}
                    displayConfig={displaySettings}
                  />
                ),
              });
            }
            if (lottery.second && shouldRenderPeriod(lottery.second.name)) {
              tables.push({
                key: "second",
                component: (
                  <LotteryTableLayoutOne
                    dateParam={activeDate}
                    periodData={lottery.second}
                    displayConfig={displaySettings}
                  />
                ),
              });
            }
            if (lottery.first && shouldRenderPeriod(lottery.first.name)) {
              tables.push({
                key: "first",
                component: (
                  <LotteryTableLayoutOne
                    dateParam={activeDate}
                    periodData={lottery.first}
                    displayConfig={displaySettings}
                  />
                ),
              });
            }

            const centerAds = adsByPosition.Center || [];
            const isAllSessions = tableParam === "Thông Tin Kết Quả";

            if (tables.length === 0) {
              return (
                <div className="flex flex-col gap-6">
                  {centerAds[0] && (
                    <AdsCard key={centerAds[0].id} ad={centerAds[0]} className="h-16 w-full shrink-0" />
                  )}
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
              </div>
            );
          })()
        ) : (
          <div className="rounded shadow-xs border border-zinc-100 p-8 text-center text-zinc-500 font-medium">
            No lottery data available.
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Calendar + Ads */}
      <div className="flex flex-col gap-4">
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
