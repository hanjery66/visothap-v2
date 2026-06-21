"use client";

import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  getLotteryData,
  saveLotteryData,
  LotteryState,
  LocationData,
  Prize,
} from "@/lib/mockData";

// Import shadcn UI component primitives
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon, CheckCircle2 } from "lucide-react";

export default function AdminPage() {
  // Date selection state for Lottery
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD"),
  );
  const [lotteryState, setLotteryState] = useState<LotteryState | null>(null);
  const [activePeriod, setActivePeriod] = useState<
    "first" | "second" | "third" | "fourth"
  >("first");

  // Inline editor states
  const [editingCell, setEditingCell] = useState<{
    period: "first" | "second" | "third" | "fourth";
    locationIndex: number;
    prizeKey: string;
    prizeIndex: number;
    value: string;
  } | null>(null);

  const [editingName, setEditingName] = useState<{
    period: "first" | "second" | "third" | "fourth";
    value: string;
  } | null>(null);

  // Success notifications
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch of localStorage state
    setLotteryState(getLotteryData(selectedDate));
  }, [selectedDate]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- LOTTERY UTILITIES ---
  const handleSaveCell = () => {
    if (!editingCell || !lotteryState) return;
    const { period, locationIndex, prizeKey, prizeIndex, value } = editingCell;

    const updatedState = { ...lotteryState };
    const periodObj = updatedState[period];
    const locationObj = periodObj.data[locationIndex] as LocationData;
    const prizes = locationObj[prizeKey] as Prize[];

    prizes[prizeIndex] = {
      ...prizes[prizeIndex],
      value: value,
    };

    setLotteryState(updatedState);
    saveLotteryData(selectedDate, updatedState);
    window.dispatchEvent(new Event("storage"));
    setEditingCell(null);
    showNotification("Lottery number updated successfully!");
  };

  const handleResetLottery = () => {
    if (!lotteryState) return;
    const blankState = { ...lotteryState };
    const periods: ("first" | "second" | "third" | "fourth")[] = [
      "first",
      "second",
      "third",
      "fourth",
    ];

    periods.forEach((p) => {
      const periodObj = blankState[p];
      periodObj.data.forEach((loc: any) => {
        const prizeKeys = [
          "gEight",
          "gSeven",
          "gSix",
          "gFive",
          "gFour",
          "gThree",
          "gTwo",
          "gOne",
          "db",
        ];
        prizeKeys.forEach((key) => {
          if (loc[key]) {
            loc[key] = loc[key].map((item: any) => ({ ...item, value: "" }));
          }
        });
      });
    });

    setLotteryState(blankState);
    saveLotteryData(selectedDate, blankState);
    window.dispatchEvent(new Event("storage"));
    showNotification("Cleared all lottery numbers for this date!");
  };

  const handleFillRandomLottery = () => {
    if (!lotteryState) return;
    const filledState = { ...lotteryState };
    const periods: ("first" | "second" | "third" | "fourth")[] = [
      "first",
      "second",
      "third",
      "fourth",
    ];

    const getRandomValue = (digits: number) => {
      let val = "";
      for (let i = 0; i < digits; i++) {
        val += Math.floor(Math.random() * 10);
      }
      return val;
    };

    periods.forEach((p) => {
      const periodObj = filledState[p];
      periodObj.data.forEach((loc: any) => {
        const prizeKeys = [
          { key: "gEight", len: p === "fourth" ? 0 : 2 },
          { key: "gSeven", len: p === "fourth" ? 2 : 3 },
          { key: "gSix", len: p === "fourth" ? 3 : 4 },
          { key: "gFive", len: 4 },
          { key: "gFour", len: p === "fourth" ? 4 : 5 },
          { key: "gThree", len: 5 },
          { key: "gTwo", len: 5 },
          { key: "gOne", len: 5 },
          { key: "db", len: p === "fourth" ? 5 : 6 },
        ];

        prizeKeys.forEach(({ key, len }) => {
          if (loc[key] && len > 0) {
            loc[key] = loc[key].map((item: any) => ({
              ...item,
              value: getRandomValue(len),
            }));
          }
        });
      });
    });

    setLotteryState(filledState);
    saveLotteryData(selectedDate, filledState);
    window.dispatchEvent(new Event("storage"));
    showNotification("Random lottery numbers generated successfully!");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Floating Notification */}
      {notification && (
        <div className="absolute top-4 right-4 bg-primary px-4 py-2 rounded-lg font-semibold text-xs shadow-md border border-emerald-400 flex items-center gap-2 animate-bounce z-50">
          <CheckCircle2 size={16} strokeWidth={2.5} />
          {notification}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            Lottery Management
          </h2>
          <p className="text-xs mt-1">
            Select a date and click directly on any cell to edit details
            instantly.
          </p>
        </div>

        {/* Date selection and automation tools */}
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" data-empty={!selectedDate} size={"sm"}>
                {selectedDate ? (
                  selectedDate.toString()
                ) : (
                  <span>Pick a date</span>
                )}
                <ChevronDownIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto" align="start">
              <Calendar
                mode="single"
                selected={dayjs(selectedDate).toDate()}
                onSelect={(date) =>
                  setSelectedDate(dayjs(date).format("YYYY-MM-DD"))
                }
                defaultMonth={dayjs(selectedDate).toDate()}
              />
            </PopoverContent>
          </Popover>

          <Button
            onClick={handleFillRandomLottery}
            size="sm"
            className="text-xs"
          >
            Auto-fill Numbers
          </Button>
          <Button
            onClick={handleResetLottery}
            variant="destructive"
            size="sm"
            className="text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
          >
            Clear Numbers
          </Button>
        </div>
      </div>

      {/* Time / Period tabs selection */}
      {lotteryState ? (
        <div className="flex flex-col gap-4">
          <Tabs
            value={activePeriod}
            onValueChange={(val) => setActivePeriod(val as any)}
          >
            <TabsList className="flex justify-start w-fit bg-transparent p-0 mb-4 h-auto animate-none">
              {(["first", "second", "third", "fourth"] as const).map(
                (periodKey) => {
                  const period = lotteryState[periodKey];
                  return (
                    <TabsTrigger
                      key={periodKey}
                      value={periodKey}
                      className="px-4 py-2 md:text-sm transition-all whitespace-nowrap"
                    >
                      {period.displayNumber} (
                      {periodKey === "first"
                        ? "Central"
                        : periodKey === "second"
                          ? "Eastern"
                          : periodKey === "third"
                            ? "Southern"
                            : "Northern"}
                      )
                    </TabsTrigger>
                  );
                },
              )}
            </TabsList>

            <TabsContent
              value={activePeriod}
              className="focus-visible:ring-0 mt-0"
            >
              Content
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="p-8 text-center text-zinc-600 font-semibold">
          Synchronizing database...
        </div>
      )}
    </div>
  );
}
