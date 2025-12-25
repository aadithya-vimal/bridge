import { internalMutation } from "./_generated/server";

export const migrateToZaphics = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 1. Find or create Zaphics company
    let zaphics = await ctx.db.query("companies")
      .filter(q => q.eq(q.field("name"), "Zaphics"))
      .first();

    if (!zaphics) {
      const firstUser = await ctx.db.query("users").first();
      if (!firstUser) {
        console.log("No users found, cannot create Zaphics owner");
        return "No users found";
      }
      
      const id = await ctx.db.insert("companies", {
        name: "Zaphics",
        ownerId: firstUser._id,
      });
      zaphics = await ctx.db.get(id);
      console.log("Created Zaphics company");
    }

    if (!zaphics) return "Error creating company";
    const companyId = zaphics._id;

    // 2. Migrate Users
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      if (!user.companyId) {
        // ONLY make them admin if they are the owner
        const role = user._id === zaphics.ownerId ? "admin" : "employee";
        await ctx.db.patch(user._id, { companyId, role });
      }
    }

    // 3. Migrate Data
    const tables = [
      "tasks", "leads", "tickets", "role_requests", 
      "workspace_access", "workspace_requests", 
      "assets", "messages", "announcements"
    ];

    for (const table of tables) {
      // @ts-ignore
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) {
        // @ts-ignore
        if (!doc.companyId) {
          // @ts-ignore
          await ctx.db.patch(doc._id, { companyId });
        }
      }
    }

    return "Migration complete";
  }
});

export const fixRoles = internalMutation({
  args: {},
  handler: async (ctx) => {
    const zaphics = await ctx.db.query("companies")
      .filter(q => q.eq(q.field("name"), "Zaphics"))
      .first();
      
    if (!zaphics) return "Zaphics not found";
    
    const users = await ctx.db.query("users").collect();
    let count = 0;
    for (const user of users) {
      if (user.companyId === zaphics._id && user._id !== zaphics.ownerId) {
         if (user.role === 'admin') {
             await ctx.db.patch(user._id, { role: 'employee' });
             count++;
         }
      }
    }
    return `Fixed ${count} users`;
  }
});