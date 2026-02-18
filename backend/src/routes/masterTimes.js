import { supabase } from "../lib/supabase.js";
import { processAttendanceLogs } from "../services/logProcessor.js";
import { promises as fs } from "fs";
import { resolve } from "path";

async function masterTimeRoutes(fastify) {
  // GET /api/master-times
  fastify.get("/master-times", async (request, reply) => {
    try {
      const { data, error } = await supabase
        .from("master_times")
        .select("*")
        .order("start_time", { ascending: true }); // Order by start time logic or ID

      if (error) throw error;
      return data;
    } catch (err) {
      fastify.log.error(err);
      return reply
        .code(500)
        .send({ error: "Failed to fetch master times", details: err.message });
    }
  });

  // POST /api/master-times
  fastify.post(
    "/master-times",
    async (request, reply) => {
      const { name, start_time, end_time } = request.body;

      // Basic validation
      if (!name || !start_time || !end_time) {
        return reply.code(400).send({
          error: "Missing required fields: name, start_time, end_time",
        });
      }

      try {
        const { data, error } = await supabase
          .from("master_times")
          .insert([{ name, start_time, end_time }])
          .select()
          .single();

        if (error) throw error;
        return reply.code(201).send(data);
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({
          error: "Failed to create master time",
          details: err.message,
        });
      }
    },
  );

  // GET /api/master-times/processed-attendance
  fastify.get("/master-times/processed-attendance", async (request, reply) => {
    try {
      const { start_date, end_date, limit = 1000 } = request.query;

      let query = supabase
        .from("attendance_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(Number(limit));

      if (start_date) query = query.gte("timestamp", `${start_date}T00:00:00`);
      if (end_date) query = query.lte("timestamp", `${end_date}T23:59:59`);

      const { data, error } = await query;
      if (error) {
        try {
          const candidates = [
            resolve(process.cwd(), "attendance_logs_rows.csv"),
            resolve(process.cwd(), "../attendance_logs_rows.csv"),
          ];
          let raw = "";
          for (const p of candidates) {
            try {
              raw = await fs.readFile(p, "utf-8");
              break;
            } catch {}
          }
          if (!raw) return [];
          const lines = raw.split("\n").filter((l) => l.trim().length > 0);
          const body = lines.slice(1);
          const logs = [];
          for (let i = 0; i < body.length; i++) {
            const line = body[i];
            const cols = [];
            let current = "";
            let inQuotes = false;
            for (let c of line) {
              if (c === '"') {
                inQuotes = !inQuotes;
                continue;
              }
              if (c === "," && !inQuotes) {
                cols.push(current);
                current = "";
              } else {
                current += c;
              }
            }
            cols.push(current);
            const ts = cols[2];
            const action = cols[3];
            const location = cols[4];
            const empId = cols[6];
            if (!ts || !empId) continue;
            const dateOnly = ts.split("T")[0];
            if (start_date && dateOnly < start_date) continue;
            if (end_date && dateOnly > end_date) continue;
            logs.push({
              id: i + 1,
              employee_id: empId,
              timestamp: ts,
              io_type: action,
              source: location,
            });
          }
          const processed = processAttendanceLogs(logs).slice(0, Number(limit));
          return processed;
        } catch {
          throw error;
        }
      }

      const processed = processAttendanceLogs(data || []);
      return processed;
    } catch (err) {
      try {
        const candidates = [
          resolve(process.cwd(), "attendance_logs_rows.csv"),
          resolve(process.cwd(), "../attendance_logs_rows.csv"),
        ];
        let raw = "";
        for (const p of candidates) {
          try {
            raw = await fs.readFile(p, "utf-8");
            break;
          } catch {}
        }
        if (!raw) throw err;
        const lines = raw.split("\n").filter((l) => l.trim().length > 0);
        const body = lines.slice(1);
        const logs = [];
        for (let i = 0; i < body.length; i++) {
          const line = body[i];
          const cols = [];
          let current = "";
          let inQuotes = false;
          for (let c of line) {
            if (c === '"') {
              inQuotes = !inQuotes;
              continue;
            }
            if (c === "," && !inQuotes) {
              cols.push(current);
              current = "";
            } else {
              current += c;
            }
          }
          cols.push(current);
          const ts = cols[2];
          const action = cols[3];
          const location = cols[4];
          const empId = cols[6];
          if (!ts || !empId) continue;
          const dateOnly = ts.split("T")[0];
          const { start_date, end_date, limit = 1000 } = request.query;
          if (start_date && dateOnly < start_date) continue;
          if (end_date && dateOnly > end_date) continue;
          logs.push({ id: i + 1, employee_id: empId, timestamp: ts, io_type: action, source: location });
        }
        const { limit = 1000 } = request.query;
        const processed = processAttendanceLogs(logs).slice(0, Number(limit));
        return processed;
      } catch {
        fastify.log.error(err);
        return reply
          .code(500)
          .send({ error: "Failed to fetch processed attendance", details: err.message });
      }
    }
  });

  // PUT /api/master-times/:id
  fastify.put(
    "/master-times/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { name, start_time, end_time } = request.body;

      try {
        const { data, error } = await supabase
          .from("master_times")
          .update({ name, start_time, end_time, updated_at: new Date() })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        if (!data)
          return reply.code(404).send({ error: "Master time not found" });

        return data;
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({
          error: "Failed to update master time",
          details: err.message,
        });
      }
    },
  );

  // DELETE /api/master-times/:id
  fastify.delete(
    "/master-times/:id",
    async (request, reply) => {
      const { id } = request.params;

      try {
        const { error } = await supabase
          .from("master_times")
          .delete()
          .eq("id", id);

        if (error) throw error;
        return reply.code(204).send();
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({
          error: "Failed to delete master time",
          details: err.message,
        });
      }
    },
  );
}

export default masterTimeRoutes;
