import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  EMPLOYEE: "employee",
  CLIENT: "client",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.EMPLOYEE),
  v.literal(ROLES.CLIENT),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      
      // Custom fields for BRIDGE
      password_hash: v.optional(v.string()),
      auth_provider: v.optional(v.union(v.literal('google'), v.literal('email'))),
      role: v.optional(roleValidator),
      customRoleId: v.optional(v.id("roles")), // Link to dynamic company role
      department: v.optional(v.string()),
      companyId: v.optional(v.id("companies")),
      
      // Email Verification Fields
      pendingEmail: v.optional(v.string()),
      verificationCode: v.optional(v.string()),
      verificationCodeExpiresAt: v.optional(v.number()),
    }).index("email", ["email"]).index("by_company", ["companyId"]),

    companies: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      ownerId: v.id("users"),
    }),

    // New Roles Table for dynamic company roles
    roles: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      companyId: v.id("companies"),
    }).index("by_company", ["companyId"]),

    // New Workspaces Table
    workspaces: defineTable({
      name: v.string(),
      type: v.string(), // 'general', 'web', 'growth', 'creative', 'clients'
      companyId: v.id("companies"),
      features: v.object({
        chat: v.boolean(),
        files: v.boolean(),
        kanban: v.boolean(),
        crm: v.boolean(),
        analytics: v.boolean(),
        announcements: v.boolean(),
        support: v.boolean(),
      }),
    }).index("by_company", ["companyId"]),

    company_requests: defineTable({
      userId: v.id("users"),
      companyId: v.id("companies"),
      status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("invited")),
    }).index("by_user", ["userId"]).index("by_company", ["companyId"]).index("by_status", ["status"]),

    tasks: defineTable({
      title: v.string(),
      status: v.string(), // 'todo', 'in-progress', 'review', 'done'
      velocity_forecast: v.number(),
      is_locked: v.boolean(),
      assignee_id: v.optional(v.id("users")),
      companyId: v.id("companies"),
    }).index("by_status", ["status"]).index("by_company", ["companyId"]),

    leads: defineTable({
      client_name: v.string(),
      value: v.number(),
      stage: v.string(),
      win_probability: v.number(),
      companyId: v.id("companies"),
    }).index("by_company", ["companyId"]),

    tickets: defineTable({
      subject: v.string(),
      description: v.optional(v.string()),
      client_id: v.optional(v.string()), // Made optional
      priority: v.optional(v.string()), // 'low', 'medium', 'high', 'critical'
      sentiment_score: v.optional(v.number()), // Made optional
      status: v.string(), // 'open', 'pending_closure', 'closed'
      assigned_workspace_id: v.optional(v.id("workspaces")),
      closing_statement: v.optional(v.string()),
      closed_by: v.optional(v.id("users")),
      closed_at: v.optional(v.number()),
      companyId: v.id("companies"),
      created_by: v.optional(v.id("users")),
    }).index("by_company", ["companyId"]).index("by_assigned_workspace", ["assigned_workspace_id"]),

    ticket_timeline: defineTable({
      ticketId: v.id("tickets"),
      userId: v.id("users"),
      type: v.string(), // 'comment', 'commit', 'status_change', 'assignment', 'forward'
      content: v.string(),
      metadata: v.optional(v.any()),
    }).index("by_ticket", ["ticketId"]),

    role_requests: defineTable({
      userId: v.id("users"),
      requestedRole: v.optional(roleValidator),
      customRoleId: v.optional(v.id("roles")),
      status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
      reason: v.optional(v.string()),
      companyId: v.id("companies"),
    }).index("by_status", ["status"]).index("by_user", ["userId"]).index("by_company", ["companyId"]),

    workspace_access: defineTable({
      userId: v.id("users"),
      workspace: v.string(), // Now stores the workspace ID string
      role: v.optional(v.string()),
      companyId: v.id("companies"),
    }).index("by_user", ["userId"]).index("by_workspace", ["workspace"]).index("by_company", ["companyId"]),

    workspace_requests: defineTable({
      userId: v.id("users"),
      workspace: v.string(), // Now stores the workspace ID string
      status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
      companyId: v.id("companies"),
    }).index("by_status", ["status"]).index("by_user", ["userId"]).index("by_company", ["companyId"]),

    assets: defineTable({
      title: v.string(),
      storageId: v.id("_storage"),
      type: v.string(),
      size: v.number(),
      uploaderId: v.id("users"),
      companyId: v.id("companies"),
    }).index("by_uploader", ["uploaderId"]).index("by_company", ["companyId"]),

    messages: defineTable({
      body: v.string(),
      userId: v.id("users"),
      channel: v.optional(v.string()),
      companyId: v.id("companies"),
    }).index("by_channel", ["channel"]).index("by_company", ["companyId"]),

    announcements: defineTable({
      title: v.string(),
      content: v.string(),
      priority: v.string(), // 'low', 'medium', 'high'
      authorId: v.id("users"),
      companyId: v.id("companies"),
    }).index("by_company", ["companyId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;