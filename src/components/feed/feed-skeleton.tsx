import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="animate-pulse space-y-2">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="flex items-center gap-3 mt-2">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="space-y-1">
                  <div className="h-4 w-48 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted rounded" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse h-3 w-40 bg-muted rounded" />
          </CardContent>
          <CardFooter>
            <div className="animate-pulse border-t mt-3 pt-3 w-full">
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          </CardFooter>
        </Card>
      ))}
    </>
  )
}
