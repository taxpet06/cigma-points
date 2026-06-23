import { CreatePostButton } from "@/components/feed/create-post-button"
import { HomeTabs } from "@/components/feed/home-tabs"

export default async function HomePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <CreatePostButton />
      <HomeTabs />
    </div>
  )
}
