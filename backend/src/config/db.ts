import { Pool } from "pg";

export const db = new Pool({
  user: "postgres",
  host: "127.0.0.1",
  database: "dispatchly",
  password: "password",
  port: 5432,
});
