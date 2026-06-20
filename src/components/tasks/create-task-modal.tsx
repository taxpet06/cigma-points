"use client"

// CreateTaskModal — admin-only form for creating Task Posts.
// Mirrors CreatePostModal structure exactly (RESEARCH note: "EXACT structural analog").
//
// Key differences from CreatePostModal:
//   - No Award/Deduct type toggle (tasks are always tasks)
//   - No UserAutocomplete (no target user for tasks)
//   - Uses createTaskSchema (cpReward z.coerce.number().int().min(1))
//   - Invalidates trpc.task.getTasks on success
//   - DialogTitle: "Create Task", submit "Create Task", cancel "Discard Changes"
//
// Security: task.createTask is FORBIDDEN-guarded server-side (Plan 06-01).
//           Media upload reuses existing postMediaUploader (authenticated gate).

import { useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useTRPC } from "@/trpc/client"
import { createTaskSchema } from "@/lib/validation/task"
import { cn } from "@/lib/utils"
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
import { Label } from "@/components/ui/label"
import { UploadButton } from "@/lib/uploadthing"

type CreateTaskValues = z.infer<typeof createTaskSchema>

export function CreateTaskModal() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(undefined)

  const form = useForm<CreateTaskValues>({
    // z.coerce.number() gives the resolver an unknown input type; cast to align generics
    resolver: zodResolver(createTaskSchema) as Resolver<CreateTaskValues>,
    defaultValues: { title: "", description: "", cpReward: 1 },
  })

  const createTask = useMutation(
    trpc.task.createTask.mutationOptions({
      onSuccess: () => {
        setOpen(false)
        form.reset()
        setMediaUrl(undefined)
        void queryClient.invalidateQueries(trpc.task.getTasks.queryFilter())
        toast.success("Task created")
      },
      onError: () => {
        form.setError("root", { message: "Failed to create task. Please try again." })
        toast.error("Failed to create task. Please try again.")
      },
    })
  )

  function handleOpenChange(v: boolean) {
    if (!v) {
      form.reset()
      setMediaUrl(undefined)
    }
    setOpen(v)
  }

  function onSubmit(data: CreateTaskValues) {
    createTask.mutate({ ...data, mediaUrl })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default">
          Create Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Field 1: Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field 2: Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Describe what users need to do to complete this task."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field 3: CP Reward */}
            <FormField
              control={form.control}
              name="cpReward"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CP Reward</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} placeholder="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field 4: Media (optional, outside RHF) */}
            <div className="space-y-2">
              <Label>Media (optional)</Label>
              {mediaUrl ? (
                <div className="flex items-center gap-2 text-sm">
                  <span>Media attached</span>
                  <button
                    type="button"
                    className="text-destructive hover:underline"
                    onClick={() => setMediaUrl(undefined)}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <UploadButton
                  endpoint="postMediaUploader"
                  config={{ cn }}
                  onClientUploadComplete={(res) => {
                    const url = res[0]?.url
                    if (url) setMediaUrl(url)
                  }}
                  onUploadError={(err) => {
                    console.error("Upload failed:", err.message)
                  }}
                />
              )}
            </div>

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset()
                  setMediaUrl(undefined)
                  setOpen(false)
                }}
              >
                Discard Changes
              </Button>
              <Button type="submit" variant="default" disabled={createTask.isPending}>
                {createTask.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Create Task"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
