import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lotterySession } from "@/db/schema";
import dayjs from "dayjs";

async function main() {
  const dateArg = process.argv[2];
  const targetDate = dateArg || dayjs().format("YYYY-MM-DD");

  console.log(`Deleting all lottery sessions and data for date: ${targetDate}...`);

  const deleted = await db
    .delete(lotterySession)
    .where(eq(lotterySession.date, targetDate))
    .returning({ id: lotterySession.id, name: lotterySession.name });

  if (deleted.length === 0) {
    console.log(`No lottery sessions found for ${targetDate}.`);
  } else {
    console.log(`Successfully deleted ${deleted.length} session(s) for ${targetDate}:`);
    deleted.forEach((s) => console.log(` - [${s.id}] ${s.name}`));
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error deleting lottery data:", err);
  process.exit(1);
});
