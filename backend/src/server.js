import Fastify from "fastify";
import cors from "@fastify/cors";
import * as dotenv from "dotenv";
import logRoutes from "./routes/logs.js";
import reportRoutes from "./routes/report.js";
import masterTimeRoutes from "./routes/masterTimes.js";
import leaveRoutes from "./routes/leaves.js";
import employeeRoutes from "./routes/employees.js";
import holidayRoutes from "./routes/holidays.js";
import departmentsRoutes from "./routes/departments.js";
import timeCorrectionRoutes from "./routes/timeCorrections.js";
import { startCronJobs } from "./jobs/reminder.js";

// 1. โหลด Environment Variables
dotenv.config();

const fastify = Fastify({
  logger: true,
});

export const app = fastify;

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);

  // Handle different error types
  if (error.validation) {
    return reply.status(400).send({
      error: "Validation Error",
      message: error.message,
      validation: error.validation,
    });
  }

  if (error.code === "ECONNREFUSED") {
    return reply.status(503).send({
      error: "Database Connection Error",
      message: "Unable to connect to database",
    });
  }

  // Default error response
  return reply.status(500).send({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

// 2. Environment Variables Validation
const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_KEY",
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(", ")}`);
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

// Setup Supabase Check (Supabase logic is in lib/supabase.ts)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("⚠️ Warning: Missing SUPABASE_URL or SUPABASE_KEY in environment variables. API requests requiring DB will fail.");
}

// 3. Register CORS (อนุญาตให้ Frontend เข้าถึง)
const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "*";
fastify.register(cors, {
  origin: corsOrigin === "*" ? true : corsOrigin.split(",").map(origin => origin.trim()),
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
});

// 4. Register Modular Routes
fastify.register(logRoutes, { prefix: "/api" });
fastify.register(reportRoutes, { prefix: "/api" });
fastify.register(masterTimeRoutes, { prefix: "/api" });
fastify.register(leaveRoutes, { prefix: "/api" });
fastify.register(employeeRoutes, { prefix: "/api" });
fastify.register(holidayRoutes, { prefix: "/api" });
fastify.register(departmentsRoutes, { prefix: "/api" });
fastify.register(timeCorrectionRoutes, { prefix: "/api" });

// Start Cron Jobs
// Only start cron jobs if running directly (not imported as a module)
const isMainModule = process.argv[1] === import.meta.filename;

if (isMainModule) {
  startCronJobs();
}

// API Level Health Check
fastify.get("/api", async () => {
  return { status: "OK", message: "API Gateway is active 🛠️" };
});

// Database Health Check
fastify.get("/api/health", async (request, reply) => {
  try {
    // Test database connection by attempting to fetch a simple query
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("employees")
      .select("id")
      .limit(1);

    if (error) {
      throw error;
    }

    return {
      status: "OK",
      message: "Database connection is healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    };
  } catch (error) {
    fastify.log.error("Database health check failed:", error);
    return reply.status(503).send({
      status: "ERROR",
      message: "Database connection failed",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Route เช็คสถานะ Server
fastify.get("/", async () => {
  return { status: "OK", message: "WorkTime Backend is running 🚀" };
});

// 5. Start Server (Only for Local Development)
if (isMainModule) {
  const startWithPort = async (initialPort, maxAttempts = 3) => {
    let port = initialPort;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await fastify.listen({ port, host: "0.0.0.0" });
        console.log(`✅ Backend running at http://localhost:${port}`);
        console.log('Registered Routes:');
        console.log(fastify.printRoutes());
        return;
      } catch (err) {
        if (err?.code === 'EADDRINUSE') {
          console.warn(`⚠️ Port ${port} in use, trying ${port + 1}...`);
          port += 1;
          continue;
        }
        fastify.log.error(err);
        process.exit(1);
      }
    }
    console.error('❌ Unable to start server: all attempted ports are in use.');
    process.exit(1);
  };

  const initialPort = Number(process.env.PORT) || 5000;
  startWithPort(initialPort);
}
