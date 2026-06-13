// Root tRPC router — composes all sub-routers.
// AppRouter is exported as a type so client code can infer types without bundling server code.

import { createTRPCRouter } from "@/trpc/init"
import { userRouter } from "@/trpc/routers/user"

export const appRouter = createTRPCRouter({
  user: userRouter,
})

// Export type only — client-side code imports this for type inference
export type AppRouter = typeof appRouter
