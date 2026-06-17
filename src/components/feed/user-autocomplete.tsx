"use client"

import { useState } from "react"
import { useDebounce } from "use-debounce"
import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { UserCircle } from "lucide-react"

export function UserAutocomplete({
  value,
  onChange,
}: {
  value: string | null
  onChange: (userId: string) => void
}) {
  const trpc = useTRPC()
  const [query, setQuery] = useState("")
  const [debouncedQuery] = useDebounce(query, 250)

  const { data: results, isLoading } = useQuery({
    ...trpc.post.searchUsers.queryOptions({ query: debouncedQuery }),
    enabled: debouncedQuery.length >= 1,
  })

  return (
    <div className="relative">
      <Input
        placeholder="Search users…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {debouncedQuery.length >= 1 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          {isLoading ? (
            <p className="p-2 text-sm text-muted-foreground">Searching…</p>
          ) : !results || results.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">No users found.</p>
          ) : (
            results.map((user) => (
              <button
                key={user.id}
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                onClick={() => {
                  onChange(user.id)
                  setQuery(user.name ?? user.username ?? "")
                }}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
                  <AvatarFallback>
                    <UserCircle className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span>{user.name}</span>
                <span className="text-muted-foreground">@{user.username}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
