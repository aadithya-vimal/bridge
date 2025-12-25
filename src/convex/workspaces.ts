import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const workspaceFeaturesValidator = v.object({
  chat: v.boolean(),
  files: v.boolean(),
  kanban: v.boolean(),
  crm: v.boolean(),
  analytics: v.boolean(),
  announcements: v.boolean(),
  support: v.boolean(),
});

const defaultWorkspaceFeatures = {
  chat: true,
  files: true,
  kanban: true,
  crm: true,
  analytics: true,
  announcements: true,
  support: true,
};

// CRUD for Workspaces
export const create = mutation({
  args: { 
    name: v.string(),
    type: v.string(), // 'general', 'web', 'growth', 'creative', 'clients'
    features: v.optional(workspaceFeaturesValidator),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId);
    if (!user?.companyId || user.role !== "admin") throw new Error("Unauthorized");

    await ctx.db.insert("workspaces", {
      name: args.name,
      type: args.type,
      companyId: user.companyId,
      features: {
        ...defaultWorkspaceFeatures,
        ...(args.features ?? {}),
      },
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user?.companyId) return [];

    return await ctx.db.query("workspaces")
      .withIndex("by_company", q => q.eq("companyId", user.companyId!))
      .collect();
  },
});

export const deleteWorkspace = mutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId);
    if (!user?.companyId || user.role !== "admin") throw new Error("Unauthorized");

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace || workspace.companyId !== user.companyId) throw new Error("Unauthorized");

    await ctx.db.delete(args.workspaceId);
    
    // Cleanup access and requests
    const access = await ctx.db.query("workspace_access")
      .withIndex("by_workspace", q => q.eq("workspace", args.workspaceId))
      .collect();
    for (const a of access) await ctx.db.delete(a._id);

    const requests = await ctx.db.query("workspace_requests")
      .filter(q => q.eq(q.field("workspace"), args.workspaceId))
      .collect();
    for (const r of requests) await ctx.db.delete(r._id);
  },
});

export const get = query({
  args: { workspaceId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.workspaceId) return null;
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    // Validate ID format
    try {
        const wsId = args.workspaceId as Id<"workspaces">;
        return await ctx.db.get(wsId);
    } catch (e) {
        return null;
    }
  },
});

// Access Management
export const requestAccess = mutation({
  args: { workspace: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId);
    if (!user?.companyId) throw new Error("No company");
    
    // Check if already has access
    const access = await ctx.db.query("workspace_access")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("workspace"), args.workspace))
      .first();
    if (access) throw new Error("Already have access");

    // Check pending
    const pending = await ctx.db.query("workspace_requests")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("workspace"), args.workspace) && q.eq(q.field("status"), "pending"))
      .first();
    if (pending) throw new Error("Request already pending");

    await ctx.db.insert("workspace_requests", {
      userId,
      workspace: args.workspace,
      status: "pending",
      companyId: user.companyId,
    });
  }
});

export const getMyAccess = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    const user = await ctx.db.get(userId);
    if (!user?.companyId) return [];

    if (user?.role === "admin") {
      // Admin has access to all workspaces in the company
      const allWorkspaces = await ctx.db.query("workspaces")
        .withIndex("by_company", q => q.eq("companyId", user.companyId!))
        .collect();
      return allWorkspaces.map(w => w._id);
    }

    const access = await ctx.db.query("workspace_access")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();
    return access.map(a => a.workspace);
  },
});

export const getMyRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db.query("workspace_requests")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("status"), "pending"))
      .collect();
  }
});

export const getAllWorkspacesStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user?.companyId) return [];

    const isAdmin = user?.role === "admin";

    // Fetch real workspaces from DB
    const dbWorkspaces = await ctx.db.query("workspaces")
      .withIndex("by_company", q => q.eq("companyId", user.companyId!))
      .collect();

    const workspaces = dbWorkspaces.map(ws => ({
      id: ws._id,
      label: ws.name,
      type: ws.type
    }));

    const access = await ctx.db.query("workspace_access")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();
    
    const requests = await ctx.db.query("workspace_requests")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("status"), "pending"))
      .collect();

    return workspaces.map(ws => {
      if (isAdmin) return { ...ws, hasAccess: true, status: "member" };
      
      const hasAccess = access.some(a => a.workspace === ws.id);
      const isPending = requests.some(r => r.workspace === ws.id);
      
      return {
        ...ws,
        hasAccess,
        status: hasAccess ? "member" : isPending ? "pending" : "none"
      };
    });
  }
});

// Admin functions
export const getRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    
    const user = await ctx.db.get(userId);
    if (user?.role !== "admin" || !user.companyId) return [];

    const requests = await ctx.db.query("workspace_requests")
      .withIndex("by_company", q => q.eq("companyId", user.companyId!))
      .filter(q => q.eq(q.field("status"), "pending"))
      .collect();

    const requestsWithUser = await Promise.all(
      requests.map(async (req) => {
        const requester = await ctx.db.get(req.userId);
        // Fetch workspace name
        let workspaceName = "Unknown Workspace";
        try {
            const wsId = req.workspace as Id<"workspaces">;
            const ws = await ctx.db.get(wsId);
            if (ws) workspaceName = ws.name;
        } catch (e) {}

        return {
          ...req,
          workspaceName,
          requesterName: requester?.name || requester?.email || "Unknown",
          requesterEmail: requester?.email,
        };
      })
    );

    return requestsWithUser;
  }
});

export const resolveRequest = mutation({
  args: { 
    requestId: v.id("workspace_requests"),
    approved: v.boolean() 
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin" || !admin.companyId) throw new Error("Unauthorized");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.companyId !== admin.companyId) throw new Error("Unauthorized");

    await ctx.db.patch(args.requestId, { 
      status: args.approved ? "approved" : "rejected" 
    });

    if (args.approved) {
      await ctx.db.insert("workspace_access", {
        userId: request.userId,
        workspace: request.workspace,
        role: "member", // Default role
        companyId: admin.companyId,
      });
    }
  }
});

export const revokeAccess = mutation({
  args: {
    userId: v.id("users"),
    workspace: v.string(),
  },
  handler: async (ctx, args) => {
    const adminId = await getAuthUserId(ctx);
    if (!adminId) throw new Error("Unauthorized");
    const admin = await ctx.db.get(adminId);
    if (admin?.role !== "admin" || !admin.companyId) throw new Error("Unauthorized");

    const access = await ctx.db.query("workspace_access")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .filter(q => q.eq(q.field("workspace"), args.workspace))
      .first();

    if (access && access.companyId === admin.companyId) {
      await ctx.db.delete(access._id);
    }
  }
});

export const adminGrantAccess = mutation({
  args: {
    userId: v.id("users"),
    workspace: v.string(),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const adminId = await getAuthUserId(ctx);
    if (!adminId) throw new Error("Unauthorized");
    const admin = await ctx.db.get(adminId);
    if (admin?.role !== "admin" || !admin.companyId) throw new Error("Unauthorized");

    // Check if already exists
    const existing = await ctx.db.query("workspace_access")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .filter(q => q.eq(q.field("workspace"), args.workspace))
      .first();

    if (!existing) {
      await ctx.db.insert("workspace_access", {
        userId: args.userId,
        workspace: args.workspace,
        role: args.role || "member",
        companyId: admin.companyId,
      });
    }
    
    // Also approve any pending request for this workspace
    const pending = await ctx.db.query("workspace_requests")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .filter(q => q.eq(q.field("workspace"), args.workspace) && q.eq(q.field("status"), "pending"))
      .first();
      
    if (pending && pending.companyId === admin.companyId) {
        await ctx.db.patch(pending._id, { status: "approved" });
    }
  }
});

export const getUserAccess = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const adminId = await getAuthUserId(ctx);
    if (!adminId) throw new Error("Unauthorized");
    const admin = await ctx.db.get(adminId);
    if (admin?.role !== "admin" || !admin.companyId) throw new Error("Unauthorized");

    const access = await ctx.db.query("workspace_access")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .collect();
      
    return access.filter(a => a.companyId === admin.companyId);
  }
});

export const getMyWorkspaceRole = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user?.companyId) return null;

    if (user.role === "admin") return "admin";

    const access = await ctx.db.query("workspace_access")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("workspace"), args.workspaceId))
      .first();

    return access?.role || null;
  }
});

export const updateMemberRole = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    memberId: v.id("users"),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    const isCompanyAdmin = user?.role === "admin";
    
    let isWorkspaceAdmin = false;
    if (!isCompanyAdmin) {
        const access = await ctx.db.query("workspace_access")
        .withIndex("by_user", q => q.eq("userId", userId))
        .filter(q => q.eq(q.field("workspace"), args.workspaceId))
        .first();
        isWorkspaceAdmin = access?.role === "admin";
    }

    if (!isCompanyAdmin && !isWorkspaceAdmin) {
        throw new Error("Unauthorized: Insufficient permissions");
    }

    const targetAccess = await ctx.db.query("workspace_access")
      .withIndex("by_user", q => q.eq("userId", args.memberId))
      .filter(q => q.eq(q.field("workspace"), args.workspaceId))
      .first();

    if (!targetAccess) {
        throw new Error("Member not found in workspace");
    }

    await ctx.db.patch(targetAccess._id, { role: args.role });
  }
});

export const updateFeatures = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    features: workspaceFeaturesValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId);
    if (!user?.companyId || user.role !== "admin") throw new Error("Unauthorized");

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace || workspace.companyId !== user.companyId) throw new Error("Unauthorized");

    await ctx.db.patch(args.workspaceId, {
      features: {
        ...defaultWorkspaceFeatures,
        ...args.features,
      },
    });
  },
});

export const getMembers = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) return [];
    
    const user = await ctx.db.get(userId);
    if (user?.companyId !== workspace.companyId) return [];

    // Get explicit members
    const access = await ctx.db.query("workspace_access")
      .withIndex("by_workspace", q => q.eq("workspace", args.workspaceId))
      .collect();

    // Get all admins (implicit members)
    const admins = await ctx.db.query("users")
      .withIndex("by_company", q => q.eq("companyId", workspace.companyId))
      .filter(q => q.eq(q.field("role"), "admin"))
      .collect();

    const memberMap = new Map();

    // Add admins first
    for (const admin of admins) {
      memberMap.set(admin._id, {
        _id: admin._id, // Use user ID as key for admins
        userId: admin._id,
        role: "admin",
        name: admin.name,
        email: admin.email,
        image: admin.image,
      });
    }

    // Add explicit members (if not already added as admin)
    for (const a of access) {
      if (memberMap.has(a.userId)) continue;

      const memberUser = await ctx.db.get(a.userId);
      if (memberUser) {
        memberMap.set(a.userId, {
          _id: a._id, // Use access ID as key for members
          userId: a.userId,
          role: a.role,
          name: memberUser.name,
          email: memberUser.email,
          image: memberUser.image,
        });
      }
    }

    return Array.from(memberMap.values());
  },
});