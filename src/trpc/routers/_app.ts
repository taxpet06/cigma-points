// Root tRPC router — composes all sub-routers.
// AppRouter is exported as a type so client code can infer types without bundling server code.

import { createTRPCRouter } from "@/trpc/init"
import { userRouter } from "@/trpc/routers/user"
import { postRouter } from "@/trpc/routers/post"
import { replyRouter } from "@/trpc/routers/reply"

export const appRouter = createTRPCRouter({
  user: userRouter,
  post: postRouter,
  reply: replyRouter,
})

// Export type only — client-side code imports this for type inference
export type AppRouter = typeof appRouter
