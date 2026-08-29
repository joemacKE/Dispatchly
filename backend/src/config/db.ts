import {
  Pool,
} from "pg";

import {
  env,
} from "./env";

export const db =
  new Pool({
    connectionString:
      env.DATABASE_URL,

    max:
      env.IS_PRODUCTION
        ? 10
        : 5,

    idleTimeoutMillis:
      30_000,

    connectionTimeoutMillis:
      10_000,
  });

db.on(
  "error",
  (error) => {
    console.error(
      "Unexpected PostgreSQL pool error:",
      error
    );
  }
);