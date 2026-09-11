import { v } from "convex/values";
import { action } from "./_generated/server";

/**
 * Transactional email notifications.
 *
 * Uses Resend (https://resend.com) — a developer-first REST email API. The API
 * key is read from the platform environment as RESEND_API_KEY; without it this
 * action logs and exits cleanly so the product publish flow never fails
 * because of mail delivery.
 */
export const sendNewListingEmail = action({
  args: {
    title: v.string(),
    price: v.number(),
    marketplace: v.string(),
    sellerName: v.string(),
    listingId: v.id("listings"),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn(
        "[notify] RESEND_API_KEY not set — skipping email for new listing:",
        args.title
      );
      return { sent: false, reason: "no_api_key" };
    }

    const adminEmail = process.env.ADMIN_EMAIL || "murimiedwin227@gmail.com";
    const path =
      args.marketplace === "freelance"
        ? `/freelance/service/${args.listingId}`
        : `/product/${args.listingId}`;

    const isFreelance = args.marketplace === "freelance";
    const subject = isFreelance
      ? `New freelance service: ${args.title}`
      : `New product listing: ${args.title}`;

    const html = `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #0a0a0f; color: #e5e7eb; border-radius: 12px;">
        <p style="font-size: 12px; letter-spacing: 2px; color: #8b5cf6; margin: 0 0 16px;">NEXORA MARKET</p>
        <h1 style="font-size: 18px; margin: 0 0 8px;">${isFreelance ? "New freelance service published" : "New product published"}</h1>
        <p style="font-size: 14px; line-height: 1.6; color: #9ca3af;">
          <strong style="color: #e5e7eb;">${args.sellerName}</strong> just published
          <strong style="color: #e5e7eb;">"${args.title}"</strong> at
          KES ${args.price.toLocaleString()} in the ${isFreelance ? "Freelance" : "Normal"} Marketplace.
        </p>
        <p style="margin: 24px 0;">
          <a href="https://nexoramarketplace.freebuff.app${path}"
             style="display: inline-block; background: #8b5cf6; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
            Review it in the admin panel
          </a>
        </p>
        <p style="font-size: 11px; color: #6b7280; margin-top: 32px;">
          You receive this because you are the Nexora Market platform admin.
        </p>
      </div>
    `;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Nexora Market <onboarding@resend.dev>",
          to: [adminEmail],
          subject,
          html,
        }),
      });
      if (!res.ok) {
        console.error("[notify] Resend send failed:", res.status, await res.text());
        return { sent: false, reason: "send_failed" };
      }
      return { sent: true };
    } catch (err) {
      console.error("[notify] email error:", err);
      return { sent: false, reason: "error" };
    }
  },
});
