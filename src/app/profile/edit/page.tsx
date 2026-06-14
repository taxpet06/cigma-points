// /profile/edit — server component with owner gate (D-05, T-02-08).
//
// Security:
//   T-02-08 — await auth() server-side; redirect to /sign-in when unauthenticated.
//   The page is always the signed-in user's OWN edit page — no userId param is
//   accepted from the URL, so IDOR is impossible at the routing level.
//   The form (EditProfileForm) never receives a userId — it reads/writes only the
//   session user via getMe / updateProfile.

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { EditProfileForm } from "./edit-profile-form"

export default async function EditProfilePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/sign-in")
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-6">Edit profile</h1>
      <EditProfileForm />
    </div>
  )
}
