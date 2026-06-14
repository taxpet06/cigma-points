// Uploadthing FileRouter — avatar upload route with NextAuth v5 auth gate.
//
// Security (T-02-01 — Spoofing):
//   middleware() calls auth() and throws UploadThingError("Unauthorized") if no session.
//   Only authenticated users receive a presigned upload URL.
//
// Pattern: docs.uploadthing.com/getting-started/appdir

import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

const f = createUploadthing()

export const ourFileRouter = {
  avatarUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      // auth() without args reads session cookies in Route Handler context (NextAuth v5 universal accessor).
      // Throws UploadThingError if no session — rejects unauthenticated upload requests (T-02-01).
      const session = await auth()
      if (!session?.user?.id) throw new UploadThingError("Unauthorized")
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Persist the CDN URL to the user record server-side.
      // The client can then invalidate the getMe query to refresh the avatar.
      await db.user.update({
        where: { id: metadata.userId },
        data: { image: file.url },
      })
      return { uploadedBy: metadata.userId, url: file.url }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
