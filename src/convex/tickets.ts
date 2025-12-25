import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {
    workspaceId: v.optional(v.id("workspaces")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    const user = await ctx.db.get(userId);
    if (!user?.companyId) return [];

    let q = ctx.db.query("tickets")
      .withIndex("by_company", q => q.eq("companyId", user.companyId!));

    if (args.workspaceId) {
      q = ctx.db.query("tickets")
        .withIndex("by_assigned_workspace", q => q.eq("assigned_workspace_id", args.workspaceId!));
    }

    const tickets = await q.order("desc").collect();

    // Enrich with assignee workspace name and creator
    return await Promise.all(tickets.map(async (t) => {
      let workspaceName = "Unassigned";
      if (t.assigned_workspace_id) {
        const ws = await ctx.db.get(t.assigned_workspace_id);
        workspaceName = ws?.name || "Unknown Workspace";
      }
      
      let creatorName = "Unknown";
      if (t.created_by) {
        const creator = await ctx.db.get(t.created_by);
        creatorName = creator?.name || creator?.email || "Unknown";
      }

      return {
        ...t,
        workspaceName,
        creatorName
      };
    }));
  },
});

export const getTimeline = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const timeline = await ctx.db.query("ticket_timeline")
      .withIndex("by_ticket", q => q.eq("ticketId", args.ticketId))
      .order("asc")
      .collect();

    return await Promise.all(timeline.map(async (item) => {
      const user = await ctx.db.get(item.userId);
      return {
        ...item,
        userName: user?.name || user?.email || "Unknown",
        userImage: user?.image,
      };
    }));
  },
});

export const create = mutation({
  args: {
    subject: v.string(),
    description: v.optional(v.string()),
    client_id: v.optional(v.string()),
    priority: v.optional(v.string()),
    assigned_workspace_id: v.optional(v.id("workspaces")),
    sentiment_score: v.optional(v.number()),
    status: v.optional(v.string()),
    assigned_team: v.optional(v.string()), // Deprecated but kept for compatibility if needed
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    
    const user = await ctx.db.get(userId);
    if (!user?.companyId) throw new Error("No company");

    const ticketId = await ctx.db.insert("tickets", {
      subject: args.subject,
      description: args.description,
      client_id: args.client_id,
      priority: args.priority || "medium",
      status: args.status || "open",
      assigned_workspace_id: args.assigned_workspace_id,
      companyId: user.companyId,
      created_by: userId,
      sentiment_score: args.sentiment_score,
    });

    // Add initial timeline entry
    await ctx.db.insert("ticket_timeline", {
      ticketId,
      userId,
      type: "status_change",
      content: "Ticket created",
      metadata: { status: "open" },
    });

    if (args.assigned_workspace_id) {
      const ws = await ctx.db.get(args.assigned_workspace_id);
      await ctx.db.insert("ticket_timeline", {
        ticketId,
        userId,
        type: "assignment",
        content: `Assigned to ${ws?.name || "workspace"}`,
        metadata: { workspaceId: args.assigned_workspace_id },
      });
    }

    return ticketId;
  },
});

export const update = mutation({
  args: {
    ticketId: v.id("tickets"),
    subject: v.optional(v.string()),
    description: v.optional(v.string()),
    client_id: v.optional(v.string()),
    priority: v.optional(v.string()),
    assigned_workspace_id: v.optional(v.id("workspaces")),
    sentiment_score: v.optional(v.number()),
    status: v.optional(v.string()),
    assigned_team: v.optional(v.string()), // Deprecated
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const { ticketId, assigned_team, ...updates } = args;
    await ctx.db.patch(ticketId, updates);
  },
});

export const resolve = mutation({
  args: {
    ticketId: v.id("tickets"),
    closing_statement: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.ticketId, {
      status: "pending_closure",
      closing_statement: args.closing_statement,
    });

    await ctx.db.insert("ticket_timeline", {
      ticketId: args.ticketId,
      userId,
      type: "status_change",
      content: "Marked for closing (Resolved)",
      metadata: { status: "pending_closure", reason: args.closing_statement },
    });
  },
});

export const reopen = mutation({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.ticketId, {
      status: "open",
      closing_statement: undefined,
      closed_by: undefined,
      closed_at: undefined,
    });

    await ctx.db.insert("ticket_timeline", {
      ticketId: args.ticketId,
      userId,
      type: "status_change",
      content: "Ticket reopened",
      metadata: { status: "open" },
    });
  },
});

export const addTimelineEntry = mutation({
  args: {
    ticketId: v.id("tickets"),
    type: v.union(v.literal("comment"), v.literal("commit")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    await ctx.db.insert("ticket_timeline", {
      ticketId: args.ticketId,
      userId,
      type: args.type,
      content: args.content,
    });
  },
});

export const forward = mutation({
  args: {
    ticketId: v.id("tickets"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const ws = await ctx.db.get(args.workspaceId);
    if (!ws) throw new Error("Workspace not found");

    await ctx.db.patch(args.ticketId, {
      assigned_workspace_id: args.workspaceId,
    });

    await ctx.db.insert("ticket_timeline", {
      ticketId: args.ticketId,
      userId,
      type: "forward",
      content: `Forwarded to ${ws.name}`,
      metadata: { workspaceId: args.workspaceId },
    });
  },
});

export const initiateClose = mutation({
  args: {
    ticketId: v.id("tickets"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.ticketId, {
      status: "pending_closure",
      closing_statement: args.reason,
    });

    await ctx.db.insert("ticket_timeline", {
      ticketId: args.ticketId,
      userId,
      type: "status_change",
      content: "Marked for closing",
      metadata: { status: "pending_closure", reason: args.reason },
    });
  },
});

export const finalizeClose = mutation({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    // Check if user is workspace head or admin or creator or member
    const user = await ctx.db.get(userId);
    
    let canClose = false;

    if (user?.role === "admin") {
      canClose = true;
    } else if (ticket.created_by === userId) {
      canClose = true;
    } else if (ticket.assigned_workspace_id) {
      // Check workspace access
      const access = await ctx.db.query("workspace_access")
        .withIndex("by_user", q => q.eq("userId", userId))
        .filter(q => q.eq(q.field("workspace"), ticket.assigned_workspace_id))
        .first();
      
      // Allow any member of the workspace to close tickets for now to ensure flow is smooth
      if (access) {
        canClose = true;
      }
    }

    if (!canClose) {
      throw new Error("You do not have permission to close this ticket");
    }

    await ctx.db.patch(args.ticketId, {
      status: "closed",
      closed_by: userId,
      closed_at: Date.now(),
    });

    await ctx.db.insert("ticket_timeline", {
      ticketId: args.ticketId,
      userId,
      type: "status_change",
      content: "Ticket closed",
      metadata: { status: "closed" },
    });
  },
});

export const deleteTicket = mutation({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (user?.role !== "admin") throw new Error("Only admin can delete tickets");

    await ctx.db.delete(args.ticketId);
    
    // Cleanup timeline
    const timeline = await ctx.db.query("ticket_timeline")
      .withIndex("by_ticket", q => q.eq("ticketId", args.ticketId))
      .collect();
    
    for (const item of timeline) {
      await ctx.db.delete(item._id);
    }
  },
});