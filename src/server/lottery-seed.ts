import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  lotteryLocation,
  lotteryPrize,
  lotterySchedule,
  lotterySession,
  type LotterySchedule,
} from "@/db/schema";
import {
  DEFAULT_PERIOD_SCHEDULE,
  LOTTERY_PERIODS,
  buildDefaultScheduleRows,
  getDayKeyFromDate,
  type LotteryPeriodKey,
} from "@/lib/lottery-schedule";

const PRIZE_ORDER = [
  "gEight",
  "gSeven",
  "gSix",
  "gFive",
  "gFour",
  "gThree",
  "gTwo",
  "gOne",
  "db",
] as const;

const PERIOD_DEFS: {
  period: LotteryPeriodKey;
  displayTable: LotteryPeriodKey;
  locations: {
    location: string;
    code: string;
    prizes: Record<string, number>;
  }[];
}[] = [
  {
    period: "first",
    displayTable: "first",
    locations: [
      {
        location: "TP. Đà Nẵng",
        code: "XSDNG",
        prizes: { gEight: 1, gSeven: 1, gSix: 3, gFive: 1, gFour: 7, gThree: 2, gTwo: 1, gOne: 1, db: 1 },
      },
      {
        location: "Khánh Hòa",
        code: "XSKH",
        prizes: { gEight: 1, gSeven: 1, gSix: 3, gFive: 1, gFour: 7, gThree: 2, gTwo: 1, gOne: 1, db: 1 },
      },
      {
        location: "Kon Tum",
        code: "XSKT",
        prizes: { gEight: 1, gSeven: 1, gSix: 3, gFive: 1, gFour: 7, gThree: 2, gTwo: 1, gOne: 1, db: 1 },
      },
    ],
  },
  {
    period: "second",
    displayTable: "second",
    locations: [
      {
        location: "Bình Dương",
        code: "XSBD",
        prizes: { gEight: 1, gSeven: 1, gSix: 3, gFive: 1, gFour: 7, gThree: 2, gTwo: 1, gOne: 1, db: 1 },
      },
      {
        location: "Tây Ninh",
        code: "XSTN",
        prizes: { gEight: 1, gSeven: 1, gSix: 3, gFive: 1, gFour: 7, gThree: 2, gTwo: 1, gOne: 1, db: 1 },
      },
      {
        location: "An Giang",
        code: "XSAG",
        prizes: { gEight: 1, gSeven: 1, gSix: 3, gFive: 1, gFour: 7, gThree: 2, gTwo: 1, gOne: 1, db: 1 },
      },
    ],
  },
  {
    period: "third",
    displayTable: "third",
    locations: [
      {
        location: "TP. HCM",
        code: "XSHCM",
        prizes: { gEight: 1, gSeven: 1, gSix: 3, gFive: 1, gFour: 7, gThree: 2, gTwo: 1, gOne: 1, db: 1 },
      },
      {
        location: "Đồng Tháp",
        code: "XSDT",
        prizes: { gEight: 1, gSeven: 1, gSix: 3, gFive: 1, gFour: 7, gThree: 2, gTwo: 1, gOne: 1, db: 1 },
      },
      {
        location: "Cà Mau",
        code: "XSCM",
        prizes: { gEight: 1, gSeven: 1, gSix: 3, gFive: 1, gFour: 7, gThree: 2, gTwo: 1, gOne: 1, db: 1 },
      },
    ],
  },
  {
    period: "fourth",
    displayTable: "fourth",
    locations: [
      {
        location: "Miền Bắc",
        code: "XSMB",
        prizes: { gEight: 0, gSeven: 4, gSix: 3, gFive: 6, gFour: 4, gThree: 6, gTwo: 2, gOne: 1, db: 1 },
      },
    ],
  },
];

export async function ensureScheduleSeeded(): Promise<LotterySchedule[]> {
  const scheduleList = await db.select().from(lotterySchedule);
  if (scheduleList.length > 0) {
    return scheduleList;
  }

  const seedData = buildDefaultScheduleRows();
  await db.insert(lotterySchedule).values(seedData);
  return seedData as LotterySchedule[];
}

export async function getSchedulesForDate(date: string): Promise<LotterySchedule[]> {
  const dayKey = getDayKeyFromDate(date);
  const allSchedules = await ensureScheduleSeeded();
  return allSchedules.filter((row) => row.dayOfWeek === dayKey);
}

export async function ensureLotterySessionsForDate(date: string): Promise<void> {
  const daySchedules = await getSchedulesForDate(date);

  for (const def of PERIOD_DEFS) {
    const schedule = daySchedules.find((row) => row.period === def.period);
    if (schedule && !schedule.enabled) continue;

    const name = schedule?.name ?? DEFAULT_PERIOD_SCHEDULE[def.period].name;
    const drawTime = schedule?.drawTime ?? DEFAULT_PERIOD_SCHEDULE[def.period].drawTime;
    const sessionId = `${date}-${def.period}`;

    const existing = await db
      .select({ id: lotterySession.id })
      .from(lotterySession)
      .where(eq(lotterySession.id, sessionId))
      .limit(1);

    if (existing.length > 0) continue;

    await db.insert(lotterySession).values({
      id: sessionId,
      date,
      period: def.period,
      name,
      displayTable: def.displayTable,
      displayNumber: drawTime,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    for (let li = 0; li < def.locations.length; li++) {
      const loc = def.locations[li];
      const locationId = crypto.randomUUID();

      await db.insert(lotteryLocation).values({
        id: locationId,
        sessionId,
        location: loc.location,
        code: loc.code,
        sortOrder: li,
      });

      const prizeRows: {
        id: string;
        locationId: string;
        prizeKey: string;
        value: string;
        sortOrder: number;
      }[] = [];

      for (const key of PRIZE_ORDER) {
        const count = loc.prizes[key] ?? 0;
        for (let pi = 0; pi < count; pi++) {
          prizeRows.push({
            id: crypto.randomUUID(),
            locationId,
            prizeKey: key,
            value: "",
            sortOrder: pi,
          });
        }
      }

      if (prizeRows.length > 0) {
        await db.insert(lotteryPrize).values(prizeRows);
      }
    }
  }
}

export function resolvePeriodSchedule(
  daySchedules: LotterySchedule[],
  period: LotteryPeriodKey
) {
  return daySchedules.find((row) => row.period === period);
}

export { LOTTERY_PERIODS, PERIOD_DEFS };
