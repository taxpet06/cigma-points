"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
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
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const { data: results, isLoading } = useQuery({
    ...trpc.post.searchUsers.queryOptions({ query: debouncedQuery }),
    enabled: debouncedQuery.length >= 1,
  })

  const isDropdownOpen = open && debouncedQuery.length >= 1

  // Compute fixed position from input's viewport rect to escape overflow clipping
  useEffect(() => {
    if (isDropdownOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    }
  }, [isDropdownOpen])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      const inWrapper = wrapperRef.current?.contains(target) ?? false
      const inDropdown = dropdownRef.current?.contains(target) ?? false
      if (!inWrapper && !inDropdown) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const dropdown =
    isDropdownOpen && mounted && dropdownRect
      ? createPortal(
          <div
            ref={dropdownRef}
            id="user-search-listbox"
            role="listbox"
            aria-label="User suggestions"
            style={{
              position: "fixed",
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
              zIndex: "var(--z-dropdown)",
              // Radix Dialog sets `pointer-events: none` on <body>; this dropdown
              // portals to <body> (outside DialogContent), so re-enable clicks here.
              pointerEvents: "auto",
            }}
            className="rounded-md border bg-popover shadow-md"
          >
            {isLoading ? (
              <p role="status" className="p-2 text-sm text-muted-foreground">Searching…</p>
            ) : !results || results.length === 0 ? (
              <p role="status" className="p-2 text-sm text-muted-foreground">No users found.</p>
            ) : (
              results.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  role="option"
                  aria-selected={value === user.id}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                  onClick={() => {
                    onChange(user.id)
                    setQuery(user.name ?? user.username ?? "")
                    setOpen(false)
                  }}
                >
                  <span>{user.name}</span>
                  {user.username && <span className="text-muted-foreground">@{user.username}</span>}
                </button>
              ))
            )}
          </div>,
          document.body
        )
      : null

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        ref={inputRef}
        role="combobox"
        aria-label="Search for a user by name"
        aria-expanded={isDropdownOpen}
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-controls={isDropdownOpen ? "user-search-listbox" : undefined}
        placeholder="Search users…"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false) }}
      />
      {dropdown}
    </div>
  )
}
