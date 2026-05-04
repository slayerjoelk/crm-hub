import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const isPlaceholder =
  !process.env.TURSO_DATABASE_URL ||
  process.env.TURSO_DATABASE_URL === "libsql://your-db.turso.io";

const dbUrl = isPlaceholder
  ? "file:./local.db"
  : process.env.TURSO_DATABASE_URL;

const client = createClient({
  url: dbUrl!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
export { schema };
