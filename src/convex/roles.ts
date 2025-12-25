import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user?.companyId) return [];

    return await ctx.db.query("roles")
      .withIndex("by_company", q => q.eq("companyId", user.companyId!))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId);
    if (!user?.companyId || user.role !== "admin") throw new Error("Unauthorized");

    await ctx.db.insert("roles", {
      name: args.name,
      description: args.description,
      companyId: user.companyId,
    });
  },
});

export const update = mutation({
  args: {
    roleId: v.id("roles"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId);
    if (!user?.companyId || user.role !== "admin") throw new Error("Unauthorized");

    const role = await ctx.db.get(args.roleId);
    if (!role || role.companyId !== user.companyId) throw new Error("Unauthorized");

    await ctx.db.patch(args.roleId, {
      name: args.name,
      description: args.description,
    });
  },
});

export const deleteRole = mutation({
  args: { roleId: v.id("roles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId);
    if (!user?.companyId || user.role !== "admin") throw new Error("Unauthorized");

    const role = await ctx.db.get(args.roleId);
    if (!role || role.companyId !== user.companyId) throw new Error("Unauthorized");

    // Unassign this role from all users
    const usersWithRole = await ctx.db.query("users")
      .withIndex("by_company", q => q.eq("companyId", user.companyId!))
      .filter(q => q.eq(q.field("customRoleId"), args.roleId))
      .collect();

    for (const u of usersWithRole) {
      await ctx.db.patch(u._id, { customRoleId: undefined });
    }

    await ctx.db.delete(args.roleId);
  },
});
