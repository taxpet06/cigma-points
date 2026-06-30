// IMPORTANT: This module MUST only be imported from Node.js-runtime contexts
// (tRPC mutations and the cron Route Handler). It transitively imports email.ts
// which uses nodemailer — NOT edge-compatible.

import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"

/** Returns the base app URL with any trailing slash stripped. */
function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "")
}

/** Plain-text fallback for the HTML shell — improves deliverability. */
function emailText({
  heading,
  bodyText,
  url,
}: {
  heading: string
  bodyText: string
  url: string
}): string {
  return [heading, "", bodyText, "", url, "", "---", "Cigma Points — " + appUrl()].join("\n")
}

/**
 * Minimal, fully inline-styled HTML shell for notification emails.
 * Email clients strip <style> tags and external CSS — all styles must be inline.
 * Uses the hosted PNG logo (SVG does not render in most email clients).
 */
function emailShell({
  heading,
  bodyHtml,
  url,
}: {
  heading: string
  bodyHtml: string
  url: string
}): string {
  const base = appUrl()
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
          <tr>
            <td style="padding:32px 32px 0 32px;text-align:center;">
              <img src="${base}/icon-192.png" width="64" height="64" alt="Cigma Points" style="display:block;margin:0 auto 16px auto;" />
              <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#18181b;">${heading}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 16px 32px;font-size:15px;color:#18181b;line-height:1.6;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 16px 32px;">
              <p style="font-size:13px;color:#71717a;word-break:break-all;margin:0 0 8px 0;">${url}</p>
              <a href="${url}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:600;">View</a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 32px 32px;font-size:12px;color:#71717a;border-top:1px solid #f4f4f5;">
              You are receiving this email because you are a member of Cigma Points.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Notifies each tagged user when they are named in a new AWARD or DEDUCT post.
 * Users with a null email are silently skipped.
 */
export async function notifyTaggedInPost(
  targetUserIds: string[],
  postId: string,
): Promise<void> {
  // Dedupe ids to avoid double-sending if the caller didn't already
  const ids = [...new Set(targetUserIds)]
  if (ids.length === 0) return

  const users = await db.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, email: true, name: true },
  })

  const url = `${appUrl()}/post/${postId}`

  await Promise.all(
    users
      .filter((u) => u.email !== null)
      .map((u) => {
        const bodyText = `Hi ${u.name ?? "there"}, someone has nominated you in a Cigma Points award or deduction post. Visit the post to see the details and vote counts.`
        return sendEmail({
          to: u.email!,
          subject: "You've been tagged in a Cigma Points post",
          html: emailShell({
            heading: "You were tagged in a post",
            bodyHtml: `<p>Hi ${u.name ?? "there"},</p><p>Someone has nominated you in a Cigma Points award or deduction post. Visit the post to see the details and vote counts.</p>`,
            url,
          }),
          text: emailText({ heading: "You were tagged in a post", bodyText, url }),
        })
      }),
  )
}

/**
 * Notifies a user that their Cigma Point balance has changed.
 * Users with a null email are silently skipped.
 */
export async function notifyCpChange(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, username: true },
  })

  if (!user || user.email === null) return

  const url = user.username ? `${appUrl()}/u/${user.username}` : `${appUrl()}/`

  const bodyText = `Hi ${user.name ?? "there"}, check your Cigma Point Balance — your account has been updated. Visit your profile to see your current balance and recent activity.`
  await sendEmail({
    to: user.email,
    subject: "Your Cigma Points balance has been updated",
    html: emailShell({
      heading: "Your CP balance changed",
      bodyHtml: `<p>Hi ${user.name ?? "there"},</p><p>Check your Cigma Point Balance — your account has been updated. Visit your profile to see your current balance and recent activity.</p>`,
      url,
    }),
    text: emailText({ heading: "Your CP balance changed", bodyText, url }),
  })
}
