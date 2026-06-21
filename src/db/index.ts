import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "@/env";

const connectionString = env.DATABASE_URL;

// Enable secure SSL options when using cloud databases (Neon, Supabase, etc.)
const sslOption = connectionString.includes("sslmode=require") ||
  connectionString.includes("supabase") ||
  connectionString.includes("neon.tech")
  ? { rejectUnauthorized: false }
  : undefined;

const client = postgres(connectionString, {
  ssl: sslOption,
  max: 10,
});

export const db = drizzle(client, { schema });
