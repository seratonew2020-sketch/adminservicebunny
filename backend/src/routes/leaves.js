import { supabase } from "../lib/supabase.js";
import { notifyAdmins, createNotification } from "../services/notificationService.js";

async function leaveRoutes(fastify) {
  // GET /api/leaves - List all leaves with filters
  fastify.get("/leaves", async (request, reply) => {
    try {
      const { status, leaveType, start, end, employeeCode, limit = 500 } = request.query;

      let query = supabase
        .from('leaves')
        .select('*')
        .order('start_date', { ascending: false })
        .limit(Number(limit));

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }

      if (leaveType) {
        query = query.eq('leave_type', leaveType);
      }

      if (employeeCode) {
        query = query.eq('employee_code', employeeCode);
      }

      // Date range filters
      if (start && end) {
        query = query
          .lte('start_date', end)
          .or(`end_date.is.null,end_date.gte.${start}`);
      }

      const { data, error } = await query;

      if (error) {
        fastify.log.error('Supabase error fetching leaves:', error);
        return reply.code(500).send({ error: error.message });
      }

      return data || [];
    } catch (err) {
      fastify.log.error('Error in GET /api/leaves:', err);
      return reply.code(500).send({ error: err.message });
    }
  });

  // POST /api/leaves/request
  fastify.post("/leaves/request", async (request, reply) => {
    const { employee_code, leave_type, start_date, end_date, reason } = request.body;

    // Validate
    if (!employee_code || !leave_type || !start_date || !end_date) {
      return reply.code(400).send({ error: "Missing required fields" });
    }

    try {
      // 1. Get Employee Info (Need user_id)
      const { data: emp, error: empError } = await supabase
        .from("employees")
        .select("id, user_id, first_name, last_name")
        .eq("employee_id", employee_code)
        .single();

      if (empError || !emp) throw new Error("Employee not found");

      // 2. Insert Leave
      const { data: leave, error: leaveError } = await supabase
        .from("leaves")
        .insert([{
          employee_code,
          leave_type,
          start_date,
          end_date,
          reason,
          status: "pending",
          employee_id: emp.id // Optional if schema has it
        }])
        .select()
        .single();

      if (leaveError) throw leaveError;

      // 3. Notify Admins
      const fullName = `${emp.first_name} ${emp.last_name}`;
      await notifyAdmins(
        "New Leave Request",
        `${fullName} has requested leave for ${leave_type} (${start_date} to ${end_date}).`,
        "/leaves/approvals"
      );

      return reply.code(201).send(leave);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: "Failed to submit leave request", details: err.message });
    }
  });

  // PUT /api/leaves/:id/status
  fastify.put("/leaves/:id/status", async (request, reply) => {
    const { id } = request.params;
    const { status, approved_by } = request.body; // status: approved/rejected

    if (!["approved", "rejected"].includes(status)) {
      return reply.code(400).send({ error: "Invalid status" });
    }

    try {
      // 1. Update Leave
      const { data: leave, error: updateError } = await supabase
        .from("leaves")
        .update({ status, approved_at: new Date(), approved_by })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      // 2. Get Requester Info
      const { data: emp } = await supabase
        .from("employees")
        .select("user_id, first_name")
        .eq("employee_code", leave.employee_code)
        .single();

      if (emp && emp.user_id) {
        // 3. Notify User
        const title = `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`;
        const message = `Your leave request for ${leave.start_date} has been ${status}.`;
        const type = status === 'approved' ? 'success' : 'error';

        await createNotification(emp.user_id, title, message, type, "/leaves/request");
      }

      return leave;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: "Failed to update leave status", details: err.message });
    }
  });
}

export default leaveRoutes;
