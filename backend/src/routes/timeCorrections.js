import { createClient } from "@supabase/supabase-js";
import {
  sendHRAttentionEmail,
  sendEmployeeDecisionEmail,
} from "../services/email.js";

// Database Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Define Fastify Routes
export default async function (fastify, opts) {

  // POST /time-corrections
  // Employee requests a missed punch correction
  fastify.post("/time-corrections", async (request, reply) => {
    try {
      const { user_id, date, time_in, time_out, reason } = request.body;

      if (!user_id || !date || (!time_in && !time_out) || !reason) {
        return reply.status(400).send({
          message:
            "Missing required fields. Needs user_id, date, reason, and at least one of time_in/time_out.",
        });
      }

      // Pre-fetch employee details to include in email
      const { data: empData, error: empError } = await supabase
        .from("users")
        .select("email")
        .eq("id", user_id)
        .maybeSingle();

      const userEmail = empData?.email || "Unknown Employee";

      // 1. Insert into database
      const { data, error } = await supabase
        .from("time_correction_requests")
        .insert([
          {
            user_id,
            date,
            time_in: time_in || null,
            time_out: time_out || null,
            reason,
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // 2. Log action to audit table (fire & forget but use try/catch instead of then)
      try {
        await supabase.from("audit_logs").insert([{
          action: "create",
          entity: "time_correction",
          entity_id: data.id,
          user_id: user_id,
          details: { date, time_in, time_out, reason }
        }]);
      } catch (auditErr) {
        console.error('Audit log failed', auditErr);
      }

      // 3. Send Email to HR asynchronously
      // In a real app, query HR emails from DB. Here we use an env var or a fixed role lookup
      // e.g. querying users with role 'hr'
      const { data: hrUsers } = await supabase
        .from("employees")
        .select("email")
        .in("role", ["hr", "admin", "manager"]);

      if (hrUsers && hrUsers.length > 0) {
        for (const hr of hrUsers) {
          if (hr.email) {
            sendHRAttentionEmail(hr.email, {
              userEmail,
              date,
              time_in,
              time_out,
              reason,
            }).catch(console.error);
          }
        }
      }

      return reply.status(201).send(data);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({
        message: err.message || "Failed to create time correction request",
      });
    }
  });

  // GET /time-corrections
  // Admin/HR sees all pending, Employees see their own
  fastify.get("/time-corrections", async (request, reply) => {
    try {
      const { user_id, status } = request.query;

      let query = supabase
        .from("time_correction_requests")
        .select("*, users(email)");

      if (user_id) {
        query = query.eq("user_id", user_id);
      }

      if (status) {
        query = query.eq("status", status);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return reply.send({ data });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({
        message: err.message || "Failed to fetch time corrections",
      });
    }
  });

  // PUT /time-corrections/:id/status
  // HR approves or rejects
  fastify.put("/time-corrections/:id/status", async (request, reply) => {
    try {
      const { id } = request.params;
      const { status, hr_comment, resolved_by } = request.body;

      if (!["approved", "rejected"].includes(status)) {
        return reply.status(400).send({ message: "Invalid status value. Must be 'approved' or 'rejected'." });
      }

      // Check current status for concurrency
      const { data: currentReq, error: fetchErr } = await supabase
        .from("time_correction_requests")
        .select("*, users(email)")
        .eq("id", id)
        .single();

      if (fetchErr || !currentReq) {
        return reply.status(404).send({ message: "Request not found" });
      }

      if (currentReq.status !== "pending") {
        return reply.status(409).send({ message: `Request is already resolved (${currentReq.status}).` });
      }

      // Update the record
      const updateData = {
        status,
        hr_comment,
        resolved_by: resolved_by || null,
        resolved_at: new Date().toISOString(),
      };

      const { data: updatedReq, error: updateErr } = await supabase
        .from("time_correction_requests")
        .update(updateData)
        .eq("id", id)
        // ensure we only update if it's still pending (Optimistic Locking via query)
        .eq("status", "pending")
        .select()
        .single();

      if (updateErr || !updatedReq) {
        return reply.status(409).send({ message: "Failed to update. It may have been resolved by someone else." });
      }

      // If Approved, we technically should update the main attendance table here
      // For the sake of this feature, we focus on the request lifecycle.
      // Example extension: Insert/Update into `attendance_logs`

      // 2. Log action to audit table
      try {
        await supabase.from("audit_logs").insert([{
          action: `update_status_${status}`,
          entity: "time_correction",
          entity_id: id,
          user_id: resolved_by,
          details: { hr_comment }
        }]);
      } catch (auditErr) {
        console.error('Audit log failed', auditErr);
      }

      // 3. Send email to employee
      if (currentReq.users?.email) {
        sendEmployeeDecisionEmail(currentReq.users.email, currentReq, status, hr_comment).catch(console.error);
      }

      return reply.send(updatedReq);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({
        message: err.message || "Failed to update status",
      });
    }
  });
}
