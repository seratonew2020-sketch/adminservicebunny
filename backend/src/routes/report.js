import dayjs from "dayjs";
import {
  fetchDailySummary,
  fetchReportData,
  generatePDFReport,
} from "../services/reportService.js";

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
      const report = await fetchDailySummary(date);
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
