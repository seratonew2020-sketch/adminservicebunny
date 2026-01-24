import Fastify from "fastify";
import cors from "@fastify/cors";
import * as dotenv from "dotenv";
import logRoutes from "./routes/logs.js";
import reportRoutes from "./routes/report.js";
import masterTimeRoutes from "./routes/masterTimes.js";
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
fastify.register(reportRoutes, { prefix: "/api" });
fastify.register(masterTimeRoutes, { prefix: "/api" });

// Health Checks
fastify.get("/", async () => ({ status: "OK", message: "WorkTime Backend 🚀" }));
fastify.get("/api", async () => ({ status: "OK", message: "API Gateway is active 🛠️" }));

// ฟังก์ชันสำหรับ Start Server (รันเฉพาะตอนไม่ได้อยู่บน Vercel)
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
    await fastify.listen({ port, host: "0.0.0.0" });
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