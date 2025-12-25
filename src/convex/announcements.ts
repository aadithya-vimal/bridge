import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    const user = await ctx.db.get(userId);
    if (!user?.companyId) return [];

    const announcements = await ctx.db.query("announcements")
      .withIndex("by_company", q => q.eq("companyId", user.companyId!))
      .order("desc")
      .take(20);
    
    return await Promise.all(announcements.map(async (a) => {
      const author = await ctx.db.get(a.authorId);
      return {
        ...a,
        authorName: author?.name || "Unknown",
      };
    }));
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    priority: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    
    const user = await ctx.db.get(userId);
    if (user?.role !== "admin" || !user.companyId) throw new Error("Unauthorized");

    await ctx.db.insert("announcements", {
      ...args,
      authorId: userId,
      companyId: user.companyId,
    });
  },
});