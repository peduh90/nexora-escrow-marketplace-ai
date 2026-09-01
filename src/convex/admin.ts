import { query } from "./_generated/server";

/** Admin: get all disputes */
export const getAllDisputes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("disputes").collect();
  },
});

/** Admin: get all KYC applications */
export const getAllKYC = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("kycApplications").collect();
  },
});

/** Admin: get all deliveries */
export const getAllDeliveries = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("deliveries").collect();
  },
});

/** Admin: get all conversations (for message monitoring) */
export const getAllConversations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("conversations").collect();
  },
});

/** Admin: get all messages */
export const getAllMessages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("messages").collect();
  },
});
