import { getAuthUserId } from "@convex-dev/auth/server";
import {
  internalMutation,
  mutation,
  MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id, TableNames } from "./_generated/dataModel";
import { ROLES } from "./schema";

const RESET_SECRET = process.env.CLEAR_DATA_SECRET ?? "bridge-dev-reset";

const performClearData = async (
  ctx: MutationCtx,
  invokingUserId?: Id<"users">
) => {
  const results: Record<string, number> = {};

  const deleteTable = async <T extends TableNames>(
    table: T,
    beforeDelete?: (doc: Doc<T>) => Promise<void>
  ) => {
    let removed = 0;
    while (true) {
      const batch = await ctx.db.query(table).take(100);
      if (batch.length === 0) break;

      await Promise.all(
        batch.map(async (doc: Doc<T>) => {
          if (beforeDelete) {
            await beforeDelete(doc);
          }
          await ctx.db.delete(doc._id);
        })
      );

      removed += batch.length;
    }
    results[table] = (results[table] ?? 0) + removed;
  };

  await deleteTable("announcements");
  await deleteTable("assets", async (asset) => {
    await ctx.storage.delete(asset.storageId);
  });
  await deleteTable("messages");
  await deleteTable("tickets");
  await deleteTable("tasks");
  await deleteTable("leads");
  await deleteTable("workspace_access");
  await deleteTable("workspace_requests");
  await deleteTable("company_requests");
  await deleteTable("workspaces");
  await deleteTable("roles");
  await deleteTable("companies");

  let usersProcessed = 0;
  while (true) {
    const batch = await ctx.db.query("users").take(50);
    if (batch.length === 0) break;

    await Promise.all(
      batch.map(async (userDoc: Doc<"users">) => {
        const { _id, _creationTime, ...rest } = userDoc;
        const nextDoc = { ...rest };

        delete nextDoc.companyId;
        delete nextDoc.customRoleId;
        delete nextDoc.department;

        if (invokingUserId && userDoc._id === invokingUserId) {
          nextDoc.role = ROLES.ADMIN;
        } else {
          delete nextDoc.role;
        }

        await ctx.db.replace(_id, nextDoc);
      })
    );

    usersProcessed += batch.length;
  }

  results["users_reset"] = usersProcessed;
  return results;
};

export const clearData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const invokingUser = await ctx.db.get(userId);
    if (invokingUser?.role !== ROLES.ADMIN) throw new Error("Unauthorized");

    return await performClearData(ctx, userId);
  },
});

export const internalClearData = internalMutation({
  args: {
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.secret !== RESET_SECRET) {
      throw new Error("Unauthorized");
    }

    return await performClearData(ctx);
  },
});