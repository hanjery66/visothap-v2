import type { AppRouter } from "@/server/routers/_app";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;
export type AdFromQuery = RouterOutputs["getAdvertisements"][number];
export type GeneralSettings = RouterOutputs["getGeneralSettings"];
