import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const checkUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
      
    const allUsers = await ctx.db.query("users").collect();
    
    // @ts-ignore
    const accounts = await ctx.db.query("authAccounts").collect();
    
    return {
      targetUser: user,
      totalUsers: allUsers.length,
      allUsersSummary: allUsers.map(u => ({ _id: u._id, email: u.email, name: u.name })),
      accounts: accounts.map((a: any) => ({ provider: a.provider, userId: a.userId }))
    };
  },
});

export const deleteOrphanedAuthAccounts = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // @ts-ignore
    const accounts = await ctx.db.query("authAccounts")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    for (const account of accounts) {
      await ctx.db.delete(account._id);
    }

    return { deleted: accounts.length };
  },
});