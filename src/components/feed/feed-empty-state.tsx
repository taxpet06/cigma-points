import { Button } from "@/components/ui/button"

export function FeedEmptyState({ onCreatePost }: { onCreatePost?: () => void }) {
  return (
    <div className="py-16 text-center" role="status">
      <h2 className="text-xl font-semibold mb-2">No posts yet.</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Be the first to award or deduct points.
      </p>
      <Button variant="default" onClick={onCreatePost}>
        Create Post
      </Button>
    </div>
  )
}
