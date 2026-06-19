// Root tRPC router — composes all sub-routers.
// AppRouter is exported as a type so client code can infer types without bundling server code.

import { createTRPCRouter } from "@/trpc/init"
import { userRouter } from "@/trpc/routers/user"
import { postRouter } from "@/trpc/routers/post"
import { replyRouter } from "@/trpc/routers/reply"
import { taskRouter } from "@/trpc/routers/task"    // Phase 6
import { adminRouter } from "@/trpc/routers/admin"  // Phase 6

export const appRouter = createTRPCRouter({
  user: userRouter,
  post: postRouter,
  reply: replyRouter,
  task: taskRouter,    // Phase 6
  admin: adminRouter,  // Phase 6
})

// Export type only — client-side code imports this for type inference
export type AppRouter = typeof appRouter
