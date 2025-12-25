import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (user?.companyId) throw new Error("Already in a company");

    const companyId = await ctx.db.insert("companies", {
      name: args.name,
      ownerId: userId,
    });

    await ctx.db.patch(userId, {
      companyId,
      role: "admin", // Creator becomes admin
    });

    return companyId;
  },
});

export const update = mutation({
  args: { 
    companyId: v.id("companies"),
    description: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId);
    
    // Only owner or admin can update
    if (!user?.companyId || user.companyId !== args.companyId || user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const updates: { description?: string; name?: string } = {};
    if (args.description !== undefined) updates.description = args.description;
    if (args.name !== undefined) updates.name = args.name;

    await ctx.db.patch(args.companyId, updates);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const companies = await ctx.db.query("companies").collect();
    
    const enrichedCompanies = await Promise.all(
      companies.map(async (c) => {
        const members = await ctx.db.query("users")
          .withIndex("by_company", q => q.eq("companyId", c._id))
          .collect();
        
        const owner = await ctx.db.get(c.ownerId);
        
        return {
          ...c,
          memberCount: members.length,
          ownerName: owner?.name || owner?.email || "Unknown",
        };
      })
    );

    return enrichedCompanies;
  },
});

export const join = mutation({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (user?.companyId) throw new Error("Already in a company");

    // Check if already pending
    const existing = await ctx.db.query("company_requests")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("companyId"), args.companyId) && q.eq(q.field("status"), "pending"))
      .first();

    if (existing) throw new Error("Request already pending");

    await ctx.db.insert("company_requests", {
      userId,
      companyId: args.companyId,
      status: "pending",
    });
  },
});

export const getMyRequest = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db.query("company_requests")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("status"), "pending"))
      .first();
  },
});

export const getMyCompany = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user?.companyId) return null;
    return await ctx.db.get(user.companyId);
  }
});

export const getRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user?.companyId || user.role !== "admin") return [];

    const requests = await ctx.db.query("company_requests")
      .withIndex("by_company", q => q.eq("companyId", user.companyId!))
      .filter(q => q.eq(q.field("status"), "pending"))
      .collect();

    const requestsWithUser = await Promise.all(
      requests.map(async (req) => {
        const requester = await ctx.db.get(req.userId);
        return {
          ...req,
          requesterName: requester?.name || requester?.email || "Unknown",
          requesterEmail: requester?.email,
        };
      })
    );

    return requestsWithUser;
  },
});

export const invite = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId);
    if (!user?.companyId || user.role !== "admin") throw new Error("Unauthorized");

    const invitee = await ctx.db.query("users")
      .withIndex("email", q => q.eq("email", args.email))
      .first();
    
    if (!invitee) throw new Error("User not found");
    if (invitee.companyId) throw new Error("User already in a company");

    // Check existing request
    const existing = await ctx.db.query("company_requests")
      .withIndex("by_user", q => q.eq("userId", invitee._id))
      .filter(q => q.eq(q.field("companyId"), user.companyId) && (q.eq(q.field("status"), "pending") || q.eq(q.field("status"), "invited")))
      .first();
      
    if (existing) throw new Error("Request already exists");

    await ctx.db.insert("company_requests", {
      userId: invitee._id,
      companyId: user.companyId,
      status: "invited",
    });
  }
});

export const transferOwnership = mutation({
  args: { newOwnerId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId);
    if (!user?.companyId) throw new Error("No company");
    
    const company = await ctx.db.get(user.companyId);
    if (!company || company.ownerId !== userId) throw new Error("Only owner can transfer ownership");

    const newOwner = await ctx.db.get(args.newOwnerId);
    if (!newOwner || newOwner.companyId !== user.companyId) throw new Error("New owner must be in the company");

    await ctx.db.patch(user.companyId, { ownerId: args.newOwnerId });
    await ctx.db.patch(args.newOwnerId, { role: "admin" }); // Ensure new owner is admin
  },
});

export const deleteCompany = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId);
    if (!user?.companyId) throw new Error("No company");
    
    const company = await ctx.db.get(user.companyId);
    if (!company || company.ownerId !== userId) throw new Error("Only owner can delete company");

    // Unset companyId for all users
    const users = await ctx.db.query("users")
      .withIndex("by_company", q => q.eq("companyId", user.companyId!))
      .collect();
      
    for (const u of users) {
      await ctx.db.patch(u._id, { 
        companyId: undefined,
        role: "employee", // Reset role
        department: undefined
      });
    }

    // Delete company
    await ctx.db.delete(user.companyId);
  },
});

export const getInvitations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const requests = await ctx.db.query("company_requests")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("status"), "invited"))
      .collect();

    return await Promise.all(requests.map(async (req) => {
      const company = await ctx.db.get(req.companyId);
      return {
        ...req,
        companyName: company?.name || "Unknown Company"
      };
    }));
  }
});

export const acceptInvitation = mutation({
  args: { requestId: v.id("company_requests") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const request = await ctx.db.get(args.requestId);
    if (!request || request.userId !== userId || request.status !== "invited") throw new Error("Invalid invitation");

    await ctx.db.patch(args.requestId, { status: "approved" });
    await ctx.db.patch(userId, { 
      companyId: request.companyId,
      role: "employee"
    });
  }
});

export const declineInvitation = mutation({
  args: { requestId: v.id("company_requests") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    
    const request = await ctx.db.get(args.requestId);
    if (!request || request.userId !== userId) throw new Error("Invalid invitation");
    
    await ctx.db.patch(args.requestId, { status: "rejected" });
  }
});

export const resolveRequest = mutation({
  args: { 
    requestId: v.id("company_requests"),
    approved: v.boolean() 
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user?.companyId || user.role !== "admin") throw new Error("Unauthorized");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.companyId !== user.companyId) throw new Error("Unauthorized");

    await ctx.db.patch(args.requestId, { 
      status: args.approved ? "approved" : "rejected" 
    });

    if (args.approved) {
      await ctx.db.patch(request.userId, {
        companyId: request.companyId,
        role: "employee", // Default role
      });
    }
  },
});

export const leave = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId);
    if (!user?.companyId) throw new Error("Not in a company");
    
    const company = await ctx.db.get(user.companyId);
    if (company?.ownerId === userId) {
        throw new Error("Owner cannot leave company. Delete company instead.");
    }

    const [workspaceAccess, workspaceRequests, companyRequests] = await Promise.all([
      ctx.db
        .query("workspace_access")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("workspace_requests")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("company_requests")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
    ]);

    await Promise.all([
      Promise.all(workspaceAccess.map((entry) => ctx.db.delete(entry._id))),
      Promise.all(workspaceRequests.map((request) => ctx.db.delete(request._id))),
      Promise.all(
        companyRequests
          .filter((request) => request.status !== "approved")
          .map((request) => ctx.db.delete(request._id)),
      ),
    ]);

    await ctx.db.patch(userId, { 
        companyId: undefined,
        role: undefined,
        department: undefined
    });
  },
});