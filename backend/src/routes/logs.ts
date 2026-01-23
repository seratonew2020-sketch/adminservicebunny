import { FastifyInstance } from "fastify";
import { supabase } from "../lib/supabase";
import { processAttendanceLogs } from "../services/logProcessor";
import dayjs from "dayjs";

async function logRoutes(fastify: FastifyInstance) {
  // สร้าง API endpoint: GET http://localhost:3000/api/logs
  fastify.get("/logs", async (request, reply) => {
    try {
      const { startDate, endDate, empId, name } = request.query as {
        startDate?: string;
        endDate?: string;
        empId?: string;
        name?: string;
      };

      let query = supabase
        .from("attendance_logs")
        .select("*")
        .order("timestamp", { ascending: false });

      if (startDate) {
        query = query.gte("timestamp", `${startDate}T00:00:00`);
      }
      if (endDate) {
        query = query.lte("timestamp", `${endDate}T23:59:59`);
      }
      if (empId) {
        query = query.ilike("employee_id", `%${empId}%`);
      }

      // name filtering (requires manual step since join is missing)
      let validEmpIds: string[] | null = null;
      if (name) {
        const { data: emps } = await supabase
          .from("employees")
          .select("employee_id")
          .or(`first_name.ilike.%${name}%,last_name.ilike.%${name}%`);

        if (emps && emps.length > 0) {
          validEmpIds = emps.map((e) => e.employee_id);
          query = query.in("employee_id", validEmpIds);
        } else if (name) {
          return []; // Name searched but no overlap found
        }
      }

      const { data, error } = await query.limit(3000);

      if (error) {
        console.error("❌ Supabase Query Error:", error);
        throw error;
      }

      if (!data) return [];

      // Fetch employees for display names (Join alternative)
      const { data: allEmps } = await supabase
        .from("employees")
        .select("employee_id, first_name, last_name");

      const empMap: Record<string, any> = {};
      allEmps?.forEach((e) => {
        empMap[e.employee_id] = e;
      });

      const dataWithNames = data.map((log) => ({
        ...log,
        employees: empMap[log.employee_id] || {
          first_name: log.employee_id,
          last_name: "",
        },
      }));

      // 2. ใช้ Logic การจัดรูปแบบที่ซับซ้อน (Business Logic Layer)
      const formattedData = processAttendanceLogs(dataWithNames as any[]);

      // 3. ส่งกลับไป (Response Layer)
      return formattedData;
    } catch (err: any) {
      console.error("❌ Route Logs Error:", err);
      fastify.log.error(err);
      return reply.code(500).send({
        error: "ดึงข้อมูลไม่สำเร็จ",
        details: err.message,
      });
    }
  });
  fastify.get("/logs/analytics", async (request, reply) => {
    try {
      const { startDate, endDate, empId, name } = request.query as {
        startDate?: string;
        endDate?: string;
        empId?: string;
        name?: string;
      };

      // 1. Base Query (Filtered)
      let query = supabase
        .from("attendance_logs")
        .select("*")
        .order("timestamp", { ascending: false });

      if (startDate) query = query.gte("timestamp", startDate);
      if (endDate) query = query.lte("timestamp", `${endDate}T23:59:59`);
      if (empId) query = query.ilike("employee_id", `%${empId}%`);

      let validEmpIds: string[] | null = null;
      if (name) {
        const { data: emps } = await supabase
          .from("employees")
          .select("employee_id")
          .or(`first_name.ilike.%${name}%,last_name.ilike.%${name}%`);
        if (emps) {
          validEmpIds = emps.map((e) => e.employee_id);
          query = query.in("employee_id", validEmpIds);
        }
      }

      if (validEmpIds && validEmpIds.length === 0)
        return { byUser: {}, globalMonthToDateLogs: [] };

      // 2. MTD Query (Global or Filtered?)
      // Requirement: "Summarize scan items from the beginning of the month to the present... Combine all information of all users"
      // This implies a global list, but maybe applied to the filtered users if filters exist?
      // Let's assume it respects the USER filter (empId/name) but overrides the DATE filter to be "Start of Month -> Now".

      const startOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
      const now = dayjs().format("YYYY-MM-DD");

      let mtdQuery = supabase
        .from("attendance_logs")
        .select("*")
        .gte("timestamp", startOfMonth)
        .lte("timestamp", `${now}T23:59:59`)
        .order("timestamp", { ascending: true });

      if (empId) mtdQuery = mtdQuery.ilike("employee_id", `%${empId}%`);
      if (validEmpIds) mtdQuery = mtdQuery.in("employee_id", validEmpIds);

      const [resFiltered, resMtd] = await Promise.all([
        query.limit(3000),
        mtdQuery.limit(5000),
      ]);

      if (resFiltered.error) throw resFiltered.error;
      if (resMtd.error) throw resMtd.error;

      // 3. Process
      // Use the FILTERED logs for the user stats (Daily/Monthly counts based on the user's selected range)
      // Use MTD logs for the summary section

      // Note: If the user selected a date range OUTSIDE the MTD window, the "dailyStats" will reflect that range.
      // The "Monthly Stats" will reflect entries in that range.

      // We pass Processed Logs to the stats processor?
      // The processor expects Raw logs.

      const { processAttendanceLogs } =
        await import("../services/logProcessor");
      const { calculateAttendanceStats } =
        await import("../services/statisticsProcessor");

      // To get accurate "In/Out" status for MTD summary, we must process them first.
      const mtdProcessed = processAttendanceLogs(resMtd.data as any[]);

      // For stats, we usually want to count "Days Present", so we should process them too to dedup.
      // But the requirement says "Count scans". Let's stick to raw counts for "Number of scans" metadata,
      // but "Total Days" implies unique days.
      // Let's pass RAW logs to calculateStats and let it handle simple counting.

      const stats = calculateAttendanceStats(
        resFiltered.data as any[],
        mtdProcessed,
      );

      return stats;
    } catch (err: any) {
      fastify.log.error(err);
      return reply
        .code(500)
        .send({ error: "Failed to fetch analytics", details: err.message });
    }
  });
}

export default logRoutes;
