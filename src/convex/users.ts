import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { roleValidator } from "./schema";

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 * Usage: const signedInUser = await ctx.runQuery(api.authHelpers.currentUser);
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (user === null) {
      return null;
    }

    // If there's a pending email that expired, clear it
    if (user.verificationCodeExpiresAt && user.verificationCodeExpiresAt < Date.now()) {
       // We don't need to clear it immediately, but it's good practice or just ignore it.
       // We'll just return the user as is.
    }

    return user;
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const promoteAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db.get(userId);
    if (!user) return;

    const updates: Record<string, unknown> = {};

    // Only sync if missing to allow manual overrides
    if (identity.email && !user.email) {
      updates.email = identity.email;
    }
    if (identity.name && !user.name) {
      updates.name = identity.name;
    }
    if (identity.pictureUrl && user.image !== identity.pictureUrl) {
      updates.image = identity.pictureUrl;
    }

    const isAnonymous = identity.provider === "anonymous";
    if (user.isAnonymous !== isAnonymous) {
      updates.isAnonymous = isAnonymous;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(userId, updates);
    }
  },
});

export const updateSelf = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    
    // Handle Image Update
    if (args.imageStorageId) {
      const url = await ctx.storage.getUrl(args.imageStorageId);
      if (url) {
        updates.image = url;
      }
    }

    // Handle Email Update
    if (args.email !== undefined && args.email !== user.email) {
      // Check if email is already in use
      const existingUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", args.email!))
        .first();
      
      if (existingUser) {
        throw new Error("This email address is already in use by another account.");
      }

      // Generate verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      updates.pendingEmail = args.email;
      updates.verificationCode = code;
      updates.verificationCodeExpiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

      // In a real production app, you would send this code via email.
      // For this environment, we'll log it to the server console.
      console.log(`EMAIL VERIFICATION CODE for ${args.email}: ${code}`);
      
      await ctx.db.patch(userId, updates);
      return { status: "verification_required" };
    }
    
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(userId, updates);
    }
    
    return { status: "success" };
  },
});

export const verifyEmailChange = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user || !user.pendingEmail || !user.verificationCode) {
      throw new Error("No pending email change found.");
    }

    if (user.verificationCodeExpiresAt && user.verificationCodeExpiresAt < Date.now()) {
      throw new Error("Verification code has expired. Please try again.");
    }

    if (user.verificationCode !== args.code) {
      throw new Error("Invalid verification code.");
    }

    // Apply the email change
    await ctx.db.patch(userId, {
      email: user.pendingEmail,
      pendingEmail: undefined,
      verificationCode: undefined,
      verificationCodeExpiresAt: undefined,
      emailVerificationTime: Date.now(),
    });

    return { success: true };
  },
});

export const resendVerificationCode = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user || !user.pendingEmail) {
      throw new Error("No pending email change found.");
    }

    // Generate new verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    await ctx.db.patch(userId, {
      verificationCode: code,
      verificationCodeExpiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    // In a real production app, you would send this code via email.
    console.log(`RESENT EMAIL VERIFICATION CODE for ${user.pendingEmail}: ${code}`);
    
    return { success: true };
  },
});

export const requestRole = mutation({
  args: {
    role: v.optional(roleValidator),
    customRoleId: v.optional(v.id("roles")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    
    const user = await ctx.db.get(userId);
    if (!user?.companyId) throw new Error("No company");

    if (!args.role && !args.customRoleId) {
      throw new Error("Must request either a system role or a custom role");
    }

    if (args.role === "admin") {
      throw new Error("The admin role is restricted and cannot be requested.");
    }

    if (args.role && user.role === args.role && !args.customRoleId) {
      throw new Error(`You already have the role: ${args.role}`);
    }
    
    if (args.customRoleId && user.customRoleId === args.customRoleId) {
       throw new Error("You already have this custom role");
    }

    // Check if there is already a pending request
    const existing = await ctx.db
      .query("role_requests")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existing) {
      throw new Error("You already have a pending role request.");
    }

    await ctx.db.insert("role_requests", {
      userId,
      requestedRole: args.role,
      customRoleId: args.customRoleId,
      status: "pending",
      reason: args.reason,
      companyId: user.companyId,
    });
  },
});

export const getRoleRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (user?.role !== "admin" || !user.companyId) {
      return []; 
    }

    const requests = await ctx.db
      .query("role_requests")
      .withIndex("by_company", (q) => q.eq("companyId", user.companyId!))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Join with user details
    const requestsWithUser = await Promise.all(
      requests.map(async (req) => {
        const requester = await ctx.db.get(req.userId);
        let customRoleName = undefined;
        if (req.customRoleId) {
          const role = await ctx.db.get(req.customRoleId);
          customRoleName = role?.name;
        }
        return {
          ...req,
          requesterName: requester?.name || requester?.email || "Unknown",
          requesterEmail: requester?.email,
          customRoleName,
        };
      })
    );

    return requestsWithUser;
  },
});

export const resolveRoleRequest = mutation({
  args: {
    requestId: v.id("role_requests"),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin") {
      throw new Error("Only admins can resolve role requests");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");

    // Double check to prevent admin role approval via this method
    if (args.approved && request.requestedRole === "admin") {
       throw new Error("Cannot approve admin role requests.");
    }

    const status = args.approved ? "approved" : "rejected";
    await ctx.db.patch(args.requestId, { status });

    if (args.approved) {
      const updates: any = {};
      if (request.requestedRole) updates.role = request.requestedRole;
      if (request.customRoleId) updates.customRoleId = request.customRoleId;
      
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(request.userId, updates);
      }
    }
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    role: v.optional(v.string()), // System role
    customRoleId: v.optional(v.id("roles")), // Custom company role
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Unauthorized");
    const currentUser = await ctx.db.get(currentUserId);
    
    if (!currentUser?.companyId || currentUser.role !== "admin") throw new Error("Unauthorized");

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser || targetUser.companyId !== currentUser.companyId) throw new Error("User not found in company");

    // Prevent modifying owner if not owner (though logic is tricky, let's just allow admin to manage employees)
    // Ideally check if targetUser is owner
    const company = await ctx.db.get(currentUser.companyId);
    if (company?.ownerId === targetUser._id && currentUser._id !== targetUser._id) {
       throw new Error("Cannot modify owner");
    }

    // Prevent owner from being demoted (even by themselves)
    if (company?.ownerId === targetUser._id && args.role && args.role !== "admin") {
       throw new Error("The company owner cannot be demoted from admin role.");
    }

    const updates: any = {};
    if (args.role) updates.role = args.role;
    if (args.customRoleId !== undefined) updates.customRoleId = args.customRoleId;
    if (args.department !== undefined) updates.department = args.department;

    await ctx.db.patch(args.userId, updates);
  },
});

export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const adminId = await getAuthUserId(ctx);
    if (!adminId) throw new Error("Unauthorized");
    const admin = await ctx.db.get(adminId);
    if (!admin?.companyId || admin.role !== "admin") throw new Error("Unauthorized");
    
    if (args.userId === adminId) {
        throw new Error("Cannot delete yourself");
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser || targetUser.companyId !== admin.companyId) {
        throw new Error("User not found in company");
    }

    const company = await ctx.db.get(admin.companyId);
    if (company?.ownerId === args.userId) {
        throw new Error("Cannot delete the company owner");
    }

    // Delete user
    await ctx.db.delete(args.userId);
    
    // Cleanup related data
    const access = await ctx.db.query("workspace_access")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .collect();
    for (const a of access) await ctx.db.delete(a._id);

    const requests = await ctx.db.query("workspace_requests")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .collect();
    for (const r of requests) await ctx.db.delete(r._id);
    
    const roleRequests = await ctx.db.query("role_requests")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .collect();
    for (const r of roleRequests) await ctx.db.delete(r._id);
  }
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user?.companyId) return [];

    const users = await ctx.db.query("users")
      .withIndex("by_company", q => q.eq("companyId", user.companyId!))
      .collect();
      
    // Enrich with custom role names
    const usersWithRoles = await Promise.all(users.map(async (u) => {
        let customRoleName = undefined;
        if (u.customRoleId) {
            const role = await ctx.db.get(u.customRoleId);
            customRoleName = role?.name;
        }
        return { ...u, customRoleName };
    }));
    
    return usersWithRoles;
  },
});

/**
 * Use this function internally to get the current user data. Remember to handle the null user case.
 * @param ctx
 * @returns
 */
export const getCurrentUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
};