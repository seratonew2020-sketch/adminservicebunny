import { createClient } from "@supabase/supabase-js";

// Database Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function reportRoutes(fastify) {
  const summarySchema = {
    schema: {
      querystring: {
        type: "object",
        properties: {
          date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
        },
      },
    },
  };

  // GET /api/daily-summary
  fastify.get("/daily-summary", summarySchema, async (request, reply) => {
    try {
      const { date: queryDate } = request.query;
      const date = queryDate || dayjs().format("YYYY-MM-DD");

      console.log("Received Date:", date);

      // Simple implementation since the original file is missing
      const { data, error } = await supabase
        .from('attendance_logs')
        .select(`
          *,
          users:user_id(
            id,
            email,
            role,
            employees(employee_id, first_name, last_name, department_id, departments(name))
          )
        `)
        .eq('date', date);

      if (error) throw error;

      const report = {
        date,
        totalLogs: data ? data.length : 0,
        data: data || []
      };

      return reply.send(report);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({
        error: "Internal Server Error",
        details: err.message,
      });
    }
  });
}

export default reportRoutes;
