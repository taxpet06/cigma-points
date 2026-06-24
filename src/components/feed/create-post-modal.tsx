"use client"

import { useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useTRPC } from "@/trpc/client"
import { createPostSchema } from "@/lib/validation/post"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { UserAutocomplete } from "@/components/feed/user-autocomplete"

type CreatePostValues = z.infer<typeof createPostSchema>

export function CreatePostModal({ trigger }: { trigger?: React.ReactNode } = {}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const form = useForm<CreatePostValues>({
    // z.coerce.number() gives the resolver an unknown input type; cast to align generics
    resolver: zodResolver(createPostSchema) as Resolver<CreatePostValues>,
    defaultValues: { type: "AWARD", cpAmount: 1, title: "", explanation: "" },
  })

  const createPost = useMutation(
    trpc.post.createPost.mutationOptions({
      onSuccess: () => {
        setOpen(false)
        form.reset()
        void queryClient.invalidateQueries(trpc.post.getFeed.queryFilter())
      },
      onError: () => {
        form.setError("root", { message: "Failed to create post. Please try again." })
      },
    })
  )

  function handleOpenChange(v: boolean) {
    if (!v) form.reset()
    setOpen(v)
  }

  function onSubmit(data: CreatePostValues) {
    createPost.mutate(data)
  }

  const postType = form.watch("type")

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="default" className="w-full sm:w-auto">
            Create Post
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // The autocomplete dropdown portals to document.body. Radix's
          // onInteractOutside fires on pointerdown — before onClick — and treats the
          // portaled dropdown as "outside" the dialog. e.target here is the
          // DismissableLayer div (not the clicked element), so contains() is useless.
          // Instead: if the listbox node is currently in the DOM, the dropdown is open
          // and any click should be allowed to complete before the dialog can close.
          if (document.getElementById("user-search-listbox") !== null) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Field 1: Award/Deduct toggle */}
            <div role="group" aria-label="Post type" className="flex gap-2">
              <Button
                type="button"
                variant={postType === "AWARD" ? "default" : "outline"}
                className="w-full"
                aria-pressed={postType === "AWARD"}
                onClick={() => form.setValue("type", "AWARD")}
              >
                Award
              </Button>
              <Button
                type="button"
                variant={postType === "DEDUCT" ? "destructive" : "outline"}
                className="w-full"
                aria-pressed={postType === "DEDUCT"}
                onClick={() => form.setValue("type", "DEDUCT")}
              >
                Deduct
              </Button>
            </div>

            {/* Field 2: Target user */}
            <FormField
              control={form.control}
              name="targetUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target user</FormLabel>
                  <FormControl>
                    <UserAutocomplete
                      value={field.value ?? null}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field 3: Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="What are you nominating them for?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field 4: Explanation */}
            <FormField
              control={form.control}
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Explanation</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Describe what happened…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field 5: CP Amount */}
            <FormField
              control={form.control}
              name="cpAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CP amount</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} placeholder="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { form.reset(); setOpen(false) }}
              >
                Discard
              </Button>
              <Button type="submit" variant="default" disabled={createPost.isPending}>
                {createPost.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit Post"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
