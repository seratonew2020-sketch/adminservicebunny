import Fastify from "fastify";
import cors from "@fastify/cors";
import * as dotenv from "dotenv";
import logRoutes from "./routes/logs.js";
import userRoutes from "./routes/users.js";
import reportRoutes from "./routes/report.js";
import masterTimeRoutes from "./routes/masterTimes.js";
import leaveRoutes from "./routes/leaves.js";
import employeeShiftRoutes from "./routes/employeeShifts.js";
import { fetchReportData, generatePDFReport } from "./services/reportService.js";

dotenv.config();

const fastify = Fastify({ logger: true });

// Register CORS
fastify.register(cors, {
  origin: true, // ใน Production ควรระบุ URL ของ Frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
});

// Register Routes
fastify.register(logRoutes, { prefix: "/api" });
fastify.register(userRoutes, { prefix: "/api" });
fastify.register(reportRoutes, { prefix: "/api" });
fastify.register(masterTimeRoutes, { prefix: "/api/master-times" });
fastify.register(leaveRoutes, { prefix: "/api" });
fastify.register(employeeShiftRoutes, { prefix: "/api/employee-shifts" });

// Health Checks
fastify.get("/", async () => ({ status: "OK", message: "WorkTime Backend 🚀" }));
fastify.get("/api", async () => ({ status: "OK", message: "API Gateway is active 🛠️" }));

// Handle Service Worker requests (silence 404s)
fastify.get("/sw.js", async (request, reply) => {
  return reply.type('application/javascript').send('');
});

// ฟังก์ชันสำหรับ Start Server (รันเฉพาะตอนไม่ได้อยู่บน Vercel)
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 5000;
    const host = process.env.BACKEND_HOST || "0.0.0.0";
    await fastify.listen({ port, host });
    console.log(`✅ Backend running at http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// ตรวจสอบสภาพแวดล้อมการรัน
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  start();
}

export default async (req, res) => {
  await fastify.ready();
  fastify.server.emit('request', req, res);
};