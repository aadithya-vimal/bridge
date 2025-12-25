import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const list = query({
  args: { channel: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    const user = await ctx.db.get(userId);
    if (!user?.companyId) return [];
    
    const messages = await ctx.db.query("messages")
      .withIndex("by_company", q => q.eq("companyId", user.companyId!))
      .filter(q => q.eq(q.field("channel"), args.channel))
      .order("desc")
      .take(50);
      
    const messagesWithUser = await Promise.all(
      messages.map(async (msg) => {
        const user = await ctx.db.get(msg.userId);
        return {
          ...msg,
          userName: user?.name || user?.email || "Unknown",
          userImage: user?.image,
          userRole: user?.role || "employee",
        };
      })
    );

    return messagesWithUser.reverse();
  },
});

export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const user = await ctx.db.get(userId);
    
    // Allow if user is author
    if (message.userId === userId) {
        await ctx.db.delete(args.messageId);
        return;
    }

    // Allow if user is company admin
    if (user?.role === "admin") {
        await ctx.db.delete(args.messageId);
        return;
    }

    // Allow if user is workspace admin
    if (message.channel) {
        const access = await ctx.db.query("workspace_access")
            .withIndex("by_user", q => q.eq("userId", userId))
            .filter(q => q.eq(q.field("workspace"), message.channel))
            .first();
            
        if (access?.role === "admin") {
            await ctx.db.delete(args.messageId);
            return;
        }
    }

    throw new Error("Unauthorized to delete this message");
  }
});

export const send = mutation({
  args: { 
    body: v.string(), 
    channel: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const user = await ctx.db.get(userId);
    if (!user?.companyId) throw new Error("No company");

    await ctx.db.insert("messages", {
      body: args.body,
      userId,
      channel: args.channel,
      companyId: user.companyId,
    });
  },
});