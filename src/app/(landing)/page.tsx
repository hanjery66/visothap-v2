"use client";

import { useState, useMemo } from "react";
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

    const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

    return (
      <div className=" rounded-xs shadow-md border border-zinc-100 p-4 transition-all hover:shadow-lg">
        {/* Month selector */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setCalendarDate(calendarDate.subtract(1, "month"))}
            className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors text-zinc-600"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          <span className="font-bold text-zinc-800 text-sm capitalize">
            Tháng {calendarDate.format("MM, YYYY")}
          </span>
          <button
            onClick={() => setCalendarDate(calendarDate.add(1, "month"))}
            className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors text-zinc-600"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 gap-1 text-center font-semibold text-foreground text-xs mb-2">
          {weekdays.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="py-2" />;

            const isSelected = day.format("YYYY-MM-DD") === dateParam;
            const isToday = day.format("YYYY-MM-DD") === todayStr;

            return (
              <button
                key={day.toString()}
                onClick={() => handleDateSelect(day)}
                className={`min-h-8 min-w-8 font-semibold rounded-md transition-all flex items-center justify-center ${isSelected
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
    <div className="grid grid-cols-12 gap-4 items-start w-full">
      {/* LEFT AD COLUMN (Span 2) */}

      <div className="flex col-span-3 flex-col gap-4">
        {adsByPosition.Left && adsByPosition.Left.length > 0 ? (
          adsByPosition.Left.map((ad: Ads) => (
            <AdsCard key={ad.id} ad={ad} className="h-80" />
          ))
        ) : (
          <div className="p-4 bg-zinc-50 border border-dashed border-zinc-200 rounded-xs  text-center text-xs text-foreground">
            Left Banner Ad
          </div>
        )}
      </div>

      {/* CENTER CONTENT COLUMN (Span 7) */}
      <div className="col-span-6 flex flex-col gap-2">
        {/* Center Banner Advertisement */}
        {adsByPosition.Center && adsByPosition.Center.length > 0 && (
          <div className="flex flex-col gap-4 mb-2">
            {adsByPosition.Center.map((ad: Ads) => (
              <AdsCard key={ad.id} ad={ad} className="h-30" />
            ))}
          </div>
        )}

        {lottery ? (
          <>
            {lottery.first && shouldRenderPeriod(lottery.first.name) && (
              <LotteryTableLayoutOne
                periodData={lottery.first}
                dateParam={dateParam}
              />
            )}
            {lottery.second && shouldRenderPeriod(lottery.second.name) && (
              <LotteryTableLayoutOne
                periodData={lottery.second}
                dateParam={dateParam}
              />
            )}
            {lottery.third && shouldRenderPeriod(lottery.third.name) && (
              <LotteryTableLayoutOne
                periodData={lottery.third}
                dateParam={dateParam}
              />
            )}
            {lottery.fourth && shouldRenderPeriod(lottery.fourth.name) && (
              <LotteryTableLayoutTwo
                periodData={lottery.fourth}
                dateParam={dateParam}
              />
            )}

            {/* In case no periods matched search filter */}
            {!(lottery.first && shouldRenderPeriod(lottery.first.name)) &&
              !(lottery.second && shouldRenderPeriod(lottery.second.name)) &&
              !(lottery.third && shouldRenderPeriod(lottery.third.name)) &&
              !(lottery.fourth && shouldRenderPeriod(lottery.fourth.name)) && (
                <div className=" rounded-xs shadow-sm border border-zinc-100 p-8 text-center text-zinc-500 font-medium">
                  No matching results table found.
                </div>
              )}
          </>
        ) : (
          <div className=" rounded-xs shadow-sm border border-zinc-100 p-8 text-center text-zinc-500 font-medium flex items-center justify-center gap-2">
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
              <AdsCard key={ad.id} ad={ad} className="h-80" />
            ))
          ) : (
            <div className="p-4 bg-zinc-50 border border-dashed border-zinc-200 rounded-xs text-center text-xs text-foreground">
              Right Banner Ad
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
