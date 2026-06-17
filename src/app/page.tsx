import { Button } from "@/components/ui/button"
import { FeedList } from "@/components/feed/feed-list"

export default async function HomePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Button variant="default" className="w-full sm:w-auto">
        Create Post
      </Button>
      <FeedList />
    </div>
  )
}
