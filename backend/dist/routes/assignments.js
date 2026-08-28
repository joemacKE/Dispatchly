"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const db_1 = require("../config/db");
async function default_1(app) {
    /**
     * CREATE ASSIGNMENT
     *
     * POST /assignments
     */
    app.post("/assignments", async (req, reply) => {
        const body = req.body;
        const { request_id, dispatcher_id, rider_id } = body;
        if (!request_id || !dispatcher_id || !rider_id) {
            return reply.status(400).send({
                success: false,
                message: "request_id, dispatcher_id and rider_id are required"
            });
        }
        const result = await db_1.db.query(`
      INSERT INTO assignments (
        request_id,
        dispatcher_id,
        rider_id,
        status,
        assigned_at
      )
      VALUES ($1, $2, $3, 'assigned', NOW())
      RETURNING *
      `, [
            request_id,
            dispatcher_id,
            rider_id
        ]);
        return reply.status(201).send({
            success: true,
            message: "Assignment created successfully",
            assignment: result.rows[0]
        });
    });
    /**
     * GET ASSIGNMENT
     *
     * GET /assignments/:id
     */
    app.get("/assignments/:id", async (req, reply) => {
        const params = req.params;
        const assignmentId = Number(params.id);
        if (!Number.isInteger(assignmentId)) {
            return reply.status(400).send({
                success: false,
                message: "Invalid assignment ID"
            });
        }
        const result = await db_1.db.query(`
      SELECT *
      FROM assignments
      WHERE id = $1
      `, [assignmentId]);
        if (result.rows.length === 0) {
            return reply.status(404).send({
                success: false,
                message: "Assignment not found"
            });
        }
        return reply.send({
            success: true,
            assignment: result.rows[0]
        });
    });
    /**
     * UPDATE ASSIGNMENT STATUS
     *
     * PATCH /assignments/:id/status
     */
    app.patch("/assignments/:id/status", async (req, reply) => {
        const params = req.params;
        const body = req.body;
        const assignmentId = Number(params.id);
        const newStatus = body.status;
        if (!Number.isInteger(assignmentId)) {
            return reply.status(400).send({
                success: false,
                message: "Invalid assignment ID"
            });
        }
        const validStatuses = [
            "assigned",
            "picked_up",
            "in_transit",
            "delivered"
        ];
        if (!validStatuses.includes(newStatus)) {
            return reply.status(400).send({
                success: false,
                message: "Invalid status",
                allowedStatuses: validStatuses
            });
        }
        /**
         * Get the current assignment.
         */
        const existing = await db_1.db.query(`
      SELECT *
      FROM assignments
      WHERE id = $1
      `, [assignmentId]);
        if (existing.rows.length === 0) {
            return reply.status(404).send({
                success: false,
                message: "Assignment not found"
            });
        }
        const assignment = existing.rows[0];
        /**
         * Define the allowed status transitions.
         */
        const allowedTransitions = {
            assigned: ["picked_up"],
            picked_up: ["in_transit"],
            in_transit: ["delivered"],
            delivered: []
        };
        const currentStatus = assignment.status;
        if (!allowedTransitions[currentStatus].includes(newStatus)) {
            return reply.status(400).send({
                success: false,
                message: `Cannot change assignment status from ${currentStatus} to ${newStatus}`
            });
        }
        /**
         * Update timestamps depending on the new status.
         */
        let result;
        if (newStatus === "picked_up") {
            result = await db_1.db.query(`
        UPDATE assignments
        SET
          status = $1,
          picked_up_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
        `, [newStatus, assignmentId]);
        }
        else if (newStatus === "delivered") {
            result = await db_1.db.query(`
        UPDATE assignments
        SET
          status = $1,
          delivered_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
        `, [newStatus, assignmentId]);
        }
        else {
            result = await db_1.db.query(`
        UPDATE assignments
        SET
          status = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
        `, [newStatus, assignmentId]);
        }
        return reply.send({
            success: true,
            message: `Assignment status updated to ${newStatus}`,
            assignment: result.rows[0]
        });
    });
}
