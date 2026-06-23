"use client"

import { useState } from "react"
import { useDebounce } from "use-debounce"
import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"
import { Input } from "@/components/ui/input"

export function UserAutocomplete({
  value,
  onChange,
}: {
  value: string | null
  onChange: (userId: string) => void
}) {
  const trpc = useTRPC()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
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
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
      />
      {open && debouncedQuery.length >= 1 && (
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
                  setOpen(false)
                }}
              >
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
