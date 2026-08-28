
import { Pool } from "pg";

export const db = new Pool({
  user: "postgres",
  host: "postgres",
  database: "dispatchly",
  password: "postgres",
  port: 5432,
});
