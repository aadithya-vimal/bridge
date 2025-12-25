import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    const user = await ctx.db.get(userId);
    if (!user?.companyId) return [];

    return await ctx.db.query("leads")
      .withIndex("by_company", q => q.eq("companyId", user.companyId!))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    client_name: v.string(),
    value: v.number(),
    stage: v.string(),
    win_probability: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const user = await ctx.db.get(userId);
    if (!user?.companyId) throw new Error("No company");

    await ctx.db.insert("leads", { ...args, companyId: user.companyId });
  },
});

export const update = mutation({
  args: {
    leadId: v.id("leads"),
    client_name: v.optional(v.string()),
    value: v.optional(v.number()),
    stage: v.optional(v.string()),
    win_probability: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const { leadId, ...updates } = args;
    await ctx.db.patch(leadId, updates);
  },
});