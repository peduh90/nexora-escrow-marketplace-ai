import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { getSessionUser } from "./users";

/** Resolve the signed-in user for messaging. Session-first, strict fallback. */
async function getMessagingUser(ctx: QueryCtx) {
  return await getSessionUser(ctx);
}

/**
 * Messages page for a recipient, by their role. Freelancers and employers read
 * their messages inside their own panels — a seller-only link sent them to a
 * route they cannot access (RequireAuth bounced them), so nothing ever showed
 * a freelancer the customer's inquiry. Buyers and admins use the unified chat.
 */
function messagesLinkFor(role: string | undefined): string {
  if (role === "freelancer") return "/freelance/messages";
  if (role === "employer") return "/employer/messages";
  if (role === "seller") return "/seller/messages";
  return "/chat";
}

/** Start or get a conversation about a listing */
export const startConversation = mutation({
  args: {
    sellerId: v.string(),
    listingId: v.string(),
    firstMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const buyer = await getMessagingUser(ctx);
    if (!buyer) throw new Error("Not authenticated");

    // Verify the listing actually exists so the chat always has a real product.
    const listing = await ctx.db.get(args.listingId as any);
    if (!listing) throw new Error("Listing not found");
    const listingTitle =
      "title" in listing && typeof listing.title === "string"
        ? listing.title
        : "your product";

    // Check if conversation already exists
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_buyer", (q) => q.eq("buyerId", buyer._id))
      .collect();

    const existingConvo = existing.find(
      (c) => c.sellerId === args.sellerId && c.listingId === args.listingId
    );

    if (existingConvo) {
      await ctx.db.insert("messages", {
        senderId: buyer._id,
        receiverId: args.sellerId,
        listingId: args.listingId,
        content: args.firstMessage,
        read: false,
        createdAt: Date.now(),
      });

      await ctx.db.patch(existingConvo._id, {
        lastMessage: args.firstMessage,
        lastMessageAt: Date.now(),
        unreadSeller: existingConvo.unreadSeller + 1,
      });

      return { conversationId: existingConvo._id };
    }

    const convoId = await ctx.db.insert("conversations", {
      buyerId: buyer._id,
      sellerId: args.sellerId,
      listingId: args.listingId,
      lastMessage: args.firstMessage,
      lastMessageAt: Date.now(),
      unreadBuyer: 0,
      unreadSeller: 1,
      createdAt: Date.now(),
    });

    await ctx.db.insert("messages", {
      senderId: buyer._id,
      receiverId: args.sellerId,
      listingId: args.listingId,
      content: args.firstMessage,
      read: false,
      createdAt: Date.now(),
    });

    // Notify the provider about the new inquiry — with a link to the panel the
    // recipient actually uses (freelancers and employers have their own
    // message pages; only store sellers use the seller panel).
    let providerLink = "/seller/messages";
    if (args.sellerId !== buyer._id) {
      const sellerDoc = await ctx.db.get(args.sellerId as any);
      providerLink = messagesLinkFor((sellerDoc as any)?.role);
    }
    await ctx.db.insert("notifications", {
      userId: args.sellerId,
      type: "message",
      title: "New client inquiry",
      message: `Someone is interested in "${listingTitle}". Open Messages to reply.`,
      read: false,
      link: providerLink,
      createdAt: Date.now(),
    });

    return { conversationId: convoId };
  },
});

/** Send a message in a conversation */
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getMessagingUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const convo = await ctx.db.get(args.conversationId);
    if (!convo) throw new Error("Conversation not found");

    const isBuyer = convo.buyerId === user._id;
    const isSeller = convo.sellerId === user._id;
    if (!isBuyer && !isSeller) throw new Error("Not authorized");

    const receiverId = isBuyer ? convo.sellerId : convo.buyerId;

    await ctx.db.insert("messages", {
      senderId: user._id,
      receiverId,
      listingId: convo.listingId,
      content: args.content,
      read: false,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.conversationId, {
      lastMessage: args.content,
      lastMessageAt: Date.now(),
      unreadBuyer: isSeller ? convo.unreadBuyer + 1 : convo.unreadBuyer,
      unreadSeller: isBuyer ? convo.unreadSeller + 1 : convo.unreadSeller,
    });

    // Notify the recipient — link to the message page of THEIR panel (the
    // RECEIVER's role decides the link, never the sender's).
    const receiverDoc = await ctx.db.get(receiverId as any);
    await ctx.db.insert("notifications", {
      userId: receiverId,
      type: "message",
      title: "New message",
      message: args.content.slice(0, 120),
      read: false,
      link: messagesLinkFor((receiverDoc as any)?.role),
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/** Get conversations for current user */
export const getConversations = query({
  args: {},
  handler: async (ctx) => {
    const user = await getMessagingUser(ctx);
    if (!user) return [];

    const asBuyer = await ctx.db
      .query("conversations")
      .withIndex("by_buyer", (q) => q.eq("buyerId", user._id))
      .collect();

    const asSeller = await ctx.db
      .query("conversations")
      .withIndex("by_seller", (q) => q.eq("sellerId", user._id))
      .collect();

    const allConvos = [...asBuyer, ...asSeller];

    const enriched = await Promise.all(
      allConvos.map(async (convo) => {
        const otherUserId =
          convo.buyerId === user._id ? convo.sellerId : convo.buyerId;
        const otherUserDoc = await ctx.db.get(otherUserId as any);
        const isUserDoc = otherUserDoc && "email" in otherUserDoc;
        const otherUserName = isUserDoc
          ? (otherUserDoc as any).businessName ||
            (otherUserDoc as any).name ||
            (otherUserDoc as any).email?.split("@")[0] ||
            "User"
          : "User";
        const otherUserImage = isUserDoc
          ? (otherUserDoc as any).image
          : undefined;

        let listingTitle = "Unknown product";
        let listingPrice = 0;
        if (convo.listingId) {
          const listingDoc = await ctx.db.get(convo.listingId as any);
          if (listingDoc && "title" in listingDoc) {
            listingTitle = (listingDoc as any).title;
            listingPrice = (listingDoc as any).price || 0;
          }
        }

        return {
          ...convo,
          otherUserName,
          otherUserImage,
          listingTitle,
          listingPrice,
          isBuyer: convo.buyerId === user._id,
        };
      })
    );

    return enriched.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },
});

/** Get messages in a conversation */
export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getMessagingUser(ctx);
    if (!user) return [];

    const convo = await ctx.db.get(args.conversationId);
    if (!convo) return [];
    if (convo.buyerId !== user._id && convo.sellerId !== user._id) return [];

    // Get all messages and filter to this conversation
    const allMessages = await ctx.db.query("messages").collect();

    return allMessages
      .filter(
        (m) =>
          m.listingId === convo.listingId &&
          ((m.senderId === convo.buyerId && m.receiverId === convo.sellerId) ||
           (m.senderId === convo.sellerId && m.receiverId === convo.buyerId))
      )
      .sort((a, b) => a.createdAt - b.createdAt);
  },
});

/** Mark messages as read */
export const markRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getMessagingUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const convo = await ctx.db.get(args.conversationId);
    if (!convo) return;

    const isBuyer = convo.buyerId === user._id;

    await ctx.db.patch(args.conversationId, {
      unreadBuyer: isBuyer ? 0 : convo.unreadBuyer,
      unreadSeller: !isBuyer ? 0 : convo.unreadSeller,
    });

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_receiver", (q) => q.eq("receiverId", user._id))
      .collect();

    for (const msg of messages) {
      if (!msg.read) {
        await ctx.db.patch(msg._id, { read: true });
      }
    }
  },
});

/** Get support messages for current user */
export const getSupportMessages = query({
  args: {},
  handler: async (ctx) => {
    const user = await getMessagingUser(ctx);
    if (!user) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_receiver", (q) => q.eq("receiverId", user._id))
      .collect();

    const sent = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("senderId"), user._id))
      .collect();

    // Filter to support messages (senderId or receiverId contains 'support' or admin)
    const supportMsgs = [...messages, ...sent].filter(
      (m) =>
        m.listingId === "support" ||
        m.content?.startsWith("[SUPPORT]")
    );

    return supportMsgs.sort((a, b) => a.createdAt - b.createdAt);
  },
});

/** Send a support message */
export const sendSupportMessage = mutation({
  args: { content: v.string() },
  handler: async (ctx, args) => {
    const user = await getMessagingUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Find or create admin user
    const adminUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    const adminId = adminUser?._id || "admin";

    await ctx.db.insert("messages", {
      senderId: user._id,
      receiverId: adminId as any,
      listingId: "support",
      content: args.content,
      read: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/** Get unread message count */
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getMessagingUser(ctx);
    if (!user) return 0;

    const asBuyer = await ctx.db
      .query("conversations")
      .withIndex("by_buyer", (q) => q.eq("buyerId", user._id))
      .collect();

    const asSeller = await ctx.db
      .query("conversations")
      .withIndex("by_seller", (q) => q.eq("sellerId", user._id))
      .collect();

    let total = 0;
    for (const c of asBuyer) total += c.unreadBuyer;
    for (const c of asSeller) total += c.unreadSeller;

    return total;
  },
});
