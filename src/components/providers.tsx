"use client"
// Providers: composes SessionProvider (NextAuth) + TRPCReactProvider.
// Wrap the app with this in the root layout so all Client Components can:
//   - call useSession() / read auth state
//   - call useTRPC() for type-safe tRPC queries

import { SessionProvider } from "next-auth/react"
import { TRPCReactProvider } from "@/trpc/client"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TRPCReactProvider>{children}</TRPCReactProvider>
    </SessionProvider>
  )
}
