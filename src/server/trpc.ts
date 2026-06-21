import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@/lib/auth";

export interface Context {
  headers: Headers;
}

// Initialize tRPC compiler context with strongly typed headers Context
const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

// Create typesafe authenticated procedure middleware
export const authedProcedure = t.procedure.use(async (opts) => {
  const session = await auth.api.getSession({
    headers: opts.ctx.headers,
  });

  if (!session || !session.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be authenticated to perform this operation.",
    });
  }

  return opts.next({
    ctx: {
      ...opts.ctx,
      user: session.user,
      session: session.session,
    },
  });
});
