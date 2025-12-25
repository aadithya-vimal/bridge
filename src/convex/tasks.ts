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

    return await ctx.db.query("tasks")
      .withIndex("by_company", q => q.eq("companyId", user.companyId!))
      .order("desc")
      .collect();
  },
});

export const getDeployed = query({
  args: {},
  handler: async (ctx) => {
    // Return empty array but typed to satisfy frontend
    return [] as { _id: string; title: string }[];
  },
});

export const updateStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const { taskId, status } = args;
    await ctx.db.patch(taskId, { status });
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    status: v.string(),
    velocity_forecast: v.number(),
    is_locked: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const user = await ctx.db.get(userId);
    if (!user?.companyId) throw new Error("No company");

    await ctx.db.insert("tasks", { ...args, companyId: user.companyId });
  },
});

export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    velocity_forecast: v.optional(v.number()),
    is_locked: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const { taskId, ...updates } = args;
    await ctx.db.patch(taskId, updates);
  },
});