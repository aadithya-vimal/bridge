/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as announcements from "../announcements.js";
import type * as assets from "../assets.js";
import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as chat from "../chat.js";
import type * as cleanup from "../cleanup.js";
import type * as companies from "../companies.js";
import type * as debug from "../debug.js";
import type * as debug_env from "../debug_env.js";
import type * as http from "../http.js";
import type * as leads from "../leads.js";
import type * as migrations from "../migrations.js";
import type * as roles from "../roles.js";
import type * as tasks from "../tasks.js";
import type * as tickets from "../tickets.js";
import type * as users from "../users.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  announcements: typeof announcements;
  assets: typeof assets;
  auth: typeof auth;
  "auth/emailOtp": typeof auth_emailOtp;
  chat: typeof chat;
  cleanup: typeof cleanup;
  companies: typeof companies;
  debug: typeof debug;
  debug_env: typeof debug_env;
  http: typeof http;
  leads: typeof leads;
  migrations: typeof migrations;
  roles: typeof roles;
  tasks: typeof tasks;
  tickets: typeof tickets;
  users: typeof users;
  workspaces: typeof workspaces;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
