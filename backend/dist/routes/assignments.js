"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const db_1 = require("../config/db");
async function default_1(app) {
    app.post("/assignments", async (req, reply) => {
        // ✅ Correct way: cast req.body instead of annotating destructure
        const body = req.body;
        const { request_id, dispatcher_id, rider_id } = body;
        const result = await db_1.db.query(`INSERT INTO assignments (request_id, dispatcher_id, rider_id, assigned_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`, [request_id, dispatcher_id, rider_id]);
        return reply.send(result.rows[0]);
    });
}
