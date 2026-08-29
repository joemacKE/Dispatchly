import { Pool } from "pg";

export const db = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@postgres:5432/dispatchly",
});