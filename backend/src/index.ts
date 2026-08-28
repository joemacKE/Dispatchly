import Fastify from "fastify";
import { db } from "./config/db";
import assignmentsRoute from "./routes/assignments"



const app = Fastify({ logger: true });
app.register(assignmentsRoute)

// Health check
app.get("/health", async () => {
  const result = await db.query("SELECT NOW()");
  return { status: "ok", time: result.rows[0].now };
});

app.listen({ port: 3000, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
