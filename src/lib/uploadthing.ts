// Typed Uploadthing component generators.
// Import UploadButton / UploadDropzone from this file for type-safe usage.
// Source: docs.uploadthing.com/getting-started/appdir

import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react"
import type { OurFileRouter } from "@/app/api/uploadthing/core"

export const UploadButton = generateUploadButton<OurFileRouter>()
export const UploadDropzone = generateUploadDropzone<OurFileRouter>()
