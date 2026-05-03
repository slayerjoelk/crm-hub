import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

if (!process.env.TURSO_DATABASE_URL) throw new Error("TURSO_DATABASE_URL not set");

const url = process.env.TURSO_DATABASE_URL.startsWith("https://")
  ? process.env.TURSO_DATABASE_URL
  : `https://${process.env.TURSO_DATABASE_URL}`;

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
export { schema };
