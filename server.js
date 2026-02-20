import Fastify from "fastify";
import cors from "@fastify/cors";
import * as dotenv from "dotenv";
import logRoutes from "./routes/logs.js";
import userRoutes from "./routes/users.js";
import reportRoutes from "./routes/report.js";
import masterTimeRoutes from "./routes/masterTimes.js";
import leaveRoutes from "./backend/src/routes/leaves.js";
import employeeShiftRoutes from "./routes/employeeShifts.js";
import holidayRoutes from "./backend/src/routes/holidays.js";
import employeeRoutes from "./backend/src/routes/employees.js";
import departmentsRoutes from "./backend/src/routes/departments.js";
import { startCronJobs } from "./backend/src/jobs/reminder.js";
import { fetchReportData, generatePDFReport } from "./services/reportService.js";

dotenv.config();

const fastify = Fastify({ logger: true });

// Register CORS
fastify.register(cors, {
  origin: true, // ใน Production ควรระบุ URL ของ Frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
});

// Register Supabase Client for authentication
import { supabase } from "./lib/supabaseClient.js";

// Register Postgres
// import postgres from "@fastify/postgres";
// fastify.register(postgres, {
//   connectionString: process.env.DATABASE_URL
// });

// Register Routes
// Note: In Vercel, /api/* is already routed to api/index.ts, so we don't add /api prefix
// For local dev, we keep the /api prefix for consistency
const isVercel = process.env.VERCEL === "1";
const apiPrefix = isVercel ? "" : "/api";

import authRoutes from "./backend/routes/auth-fastify.js";

// Decorator to verify Supabase Session
fastify.decorate("authenticate", async function (request, reply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.code(401).send({ message: "Missing or invalid authorization header" });
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return reply.code(401).send({ message: "Invalid session or token" });
    }

    // Fetch user role from database if needed for RBAC
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    request.user = {
      id: user.id,
      email: user.email,
      role: profile?.role || 'user'
    };
  } catch (err) {
    console.error("Auth Error:", err);
    reply.code(401).send({ message: "Authentication failed" });
  }
});

fastify.register(authRoutes, { prefix: apiPrefix });
fastify.register(logRoutes, { prefix: apiPrefix });
fastify.register(userRoutes, { prefix: apiPrefix });
fastify.register(reportRoutes, { prefix: apiPrefix });
fastify.register(masterTimeRoutes, { prefix: isVercel ? "/master-times" : "/api/master-times" });
fastify.register(leaveRoutes, { prefix: apiPrefix });
fastify.register(employeeShiftRoutes, { prefix: isVercel ? "/employee-shifts" : "/api/employee-shifts" });
fastify.register(holidayRoutes, { prefix: apiPrefix });
fastify.register(employeeRoutes, { prefix: apiPrefix });
fastify.register(departmentsRoutes, { prefix: apiPrefix });

// Health Checks
fastify.get("/", async () => ({ status: "OK", message: "WorkTime Backend 🚀" }));
fastify.get(apiPrefix || "/", async () => ({ status: "OK", message: "API Gateway is active 🛠️" }));

// Handle Service Worker requests (silence 404s)
fastify.get("/sw.js", async (request, reply) => {
  return reply.type('application/javascript').send('');
});

// ฟังก์ชันสำหรับ Start Server (รันเฉพาะตอนไม่ได้อยู่บน Vercel)
const start = async () => {
  startCronJobs();
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

// Export app สำหรับ Vercel
export const app = fastify;

export default async (req, res) => {
  await fastify.ready();
  fastify.server.emit('request', req, res);
};