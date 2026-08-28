"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const db_1 = require("./config/db");
const assignments_1 = __importDefault(require("./routes/assignments"));
const app = (0, fastify_1.default)({ logger: true });
app.register(assignments_1.default);
// Health check
app.get("/health", async () => {
    const result = await db_1.db.query("SELECT NOW()");
    return { status: "ok", time: result.rows[0].now };
});
app.listen({ port: 3000, host: "0.0.0.0" }, (err) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
});
