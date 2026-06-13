// TanStack QueryClient factory.
// Returns a new QueryClient configured for superjson serialization — required when
// using dehydrate/hydrate across the server/client boundary with tRPC v11.
//
// Each Server Component call creates its own QueryClient (avoids cross-request caching).
// The "use client" TRPCReactProvider reuses a singleton QueryClient per browser session.

import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query"
import superjson from "superjson"

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, set a higher staleTime to avoid immediate refetch on mount
        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  })
}
