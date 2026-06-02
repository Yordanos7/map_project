import { protectedProcedure, publicProcedure, router } from "../index";
import { adminRouter } from "./admin";
import { mapRouter } from "./map";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  map: mapRouter,
  admin: adminRouter,
});
export type AppRouter = typeof appRouter;
