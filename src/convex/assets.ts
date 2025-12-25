import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const create = mutation({
  args: {
    storageId: v.id("_storage"),
    title: v.string(),
    type: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId);
    if (!user?.companyId) throw new Error("No company");

    await ctx.db.insert("assets", {
      ...args,
      uploaderId: userId,
      companyId: user.companyId,
    });
  },
});

export const deleteAsset = mutation({
  args: {
    assetId: v.id("assets"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId);
    if (!user?.companyId) throw new Error("Unauthorized");

    const asset = await ctx.db.get(args.assetId);
    if (!asset || asset.companyId !== user.companyId) throw new Error("Unauthorized");

    await ctx.storage.delete(args.storageId);
    await ctx.db.delete(args.assetId);
  },
});

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user?.companyId) return [];

    const assets = await ctx.db.query("assets")
      .withIndex("by_company", q => q.eq("companyId", user.companyId!))
      .order("desc")
      .collect();

    return await Promise.all(assets.map(async (asset) => ({
      ...asset,
      url: await ctx.storage.getUrl(asset.storageId),
    })));
  },
});