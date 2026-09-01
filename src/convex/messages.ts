import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Start or get a conversation about a listing */
export const startConversation = mutation({
  args: {
    sellerId: v.string(),
    listingId: v.string(),
    firstMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const buyer = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!buyer) throw new Error("User not found");

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) throw new Error("User not found");

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

    return { success: true };
  },
});

/** Get conversations for current user */
export const getConversations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

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
        const otherUserId = convo.buyerId === user._id ? convo.sellerId : convo.buyerId;
        const allUsers = await ctx.db.query("users").collect();
        const otherUser = allUsers.find((u) => u._id === otherUserId);

        // listingId is stored as a string, query by _id
        let listingData = null;
        if (convo.listingId) {
          const allListings = await ctx.db.query("listings").collect();
          listingData = allListings.find((l) => l._id === convo.listingId) ?? null;
        }

        return {
          ...convo,
          otherUserName: otherUser?.name || "Unknown",
          otherUserImage: otherUser?.image,
          listingTitle: (listingData as any)?.title || "Unknown product",
          listingPrice: (listingData as any)?.price || 0,
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) throw new Error("User not found");

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

/** Get unread message count */
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

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
