"use client"

// AvatarUpload — wraps the Uploadthing UploadButton for the /profile/edit page.
//
// Security: upload auth is enforced server-side in avatarUploader.middleware()
// (T-02-10). The client only needs to invalidate the getMe cache after success
// so the nav avatar and form avatar reflect the new image immediately.

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { UploadButton } from "@/lib/uploadthing"
import { useTRPC } from "@/trpc/client"

export function AvatarUpload() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [uploadError, setUploadError] = useState<string | null>(null)

  return (
    <div className="flex flex-col items-start gap-1">
      <UploadButton
        endpoint="avatarUploader"
        content={{ button: "Change photo" }}
        onClientUploadComplete={() => {
          setUploadError(null)
          // Server already persisted image in onUploadComplete — only invalidate cache.
          queryClient.invalidateQueries(trpc.user.getMe.queryFilter())
        }}
        onUploadError={(err) => {
          setUploadError(err.message)
        }}
        config={{ cn: (...classes: (string | null | undefined | false)[]) => classes.filter(Boolean).join(" ") }}
      />
      {uploadError && (
        <p className="text-sm text-destructive">Upload failed. Try again.</p>
      )}
    </div>
  )
}
