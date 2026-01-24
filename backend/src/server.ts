import Fastify from "fastify";
import cors from "@fastify/cors";
import * as dotenv from "dotenv";
import logRoutes from "./routes/logs.js";
import reportRoutes from "./routes/report.js";
import masterTimeRoutes from "./routes/masterTimes.js";
import {
  fetchReportData,
  generatePDFReport,
} from "./services/reportService.js";

// 1. โหลด Environment Variables
dotenv.config();

const fastify = Fastify({
  logger: true,
});

export const app = fastify;

// 2. Setup Supabase Check (Supabase logic is in lib/supabase.ts)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

// 3. Register CORS (อนุญาตให้ Frontend เข้าถึง)
fastify.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
});

// 4. Register Modular Routes
fastify.register(logRoutes, { prefix: "/api" });
fastify.register(reportRoutes, { prefix: "/api" });
fastify.register(masterTimeRoutes, { prefix: "/api" });

// API Level Health Check
fastify.get("/api", async () => {
  return { status: "OK", message: "API Gateway is active 🛠️" };
});

// Route สำหรับรายงาน PDF (Legacy/Direct)
fastify.get("/report/pdf", async (request, reply) => {
  const { startDate, endDate } = request.query as {
    startDate: string;
    endDate: string;
  };

  if (!startDate || !endDate) {
    return reply.code(400).send({ error: "Missing startDate or endDate" });
  }

  try {
    const data = await fetchReportData(startDate, endDate);
    const pdfBuffer = await generatePDFReport(data);

    reply.header("Content-Type", "application/pdf");
    reply.header(
      "Content-Disposition",
      `attachment; filename="attendance-report-${startDate}.pdf"`,
    );
    return reply.send(pdfBuffer);
  } catch (err) {
    fastify.log.error(err);
    return reply.code(500).send({ error: "Failed to generate report" });
  }
});

// Route เช็คสถานะ Server
fastify.get("/", async () => {
  return { status: "OK", message: "WorkTime Backend is running 🚀" };
});

// 5. Start Server (Only for Local Development)
if (require.main === module) {
  const start = async () => {
    try {
      const port = Number(process.env.PORT) || 3000;
      await fastify.listen({ port, host: "0.0.0.0" });
      console.log(`✅ Backend running at http://localhost:${port}`);
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  };
  start();
}
