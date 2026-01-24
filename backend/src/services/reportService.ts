import { supabase } from "../lib/supabase.js";
// import { chromium } from "playwright"; // Playwright is too heavy for Vercel/AWS Lambda directly

// Initialize Supabase Client
// Ensure process.env.SUPABASE_URL and process.env.SUPABASE_ANON_KEY are set

export const generatePDFReport = async (reportData: any) => {
  throw new Error(
    "PDF Generation disabled on Vercel (Playwright dependency issue)",
  );
  // // 1. Launch Browser
  // const browser = await chromium.launch();
  // const page = await browser.newPage();

  // // 2. Set Content (Example: You could pass HTML or navigate to a URL)
  // await page.setContent(\`
  //       <html>
  //           <body>
  //               <h1>Attendance Report</h1>
  //               <pre>\${JSON.stringify(reportData, null, 2)}</pre>
  //           </body>
  //       </html>
  //   \`);

  // // 3. PDF Options
  // const pdf = await page.pdf({ format: "A4" });

  // await browser.close();
  // return pdf;
};

export const fetchReportData = async (startDate: string, endDate: string) => {
  // Determine filters, similar to frontend logic
  const { data, error } = await supabase
    .from("attendance_logs")
    .select("*")
    .gte("timestamp", startDate)
    .lte("timestamp", `${endDate}T23:59:59`);

  if (error) throw error;
  return data;
};

// ตัวอย่าง Logic การคำนวณ
export const calculateDailyStatus = (
  employee: any,
  logs: any[],
  shift: any,
) => {
  // แก้ไข: ตรวจสอบ logs ให้ยืดหยุ่นขึ้น (รองรับทั้ง I, CheckIn หรือตัวพิมพ์เล็ก)
  const checkInLog = logs.find(
    (l: any) =>
      l.io_type?.toUpperCase() === "I" ||
      l.io_type?.toLowerCase() === "checkin" ||
      l.io_type === "Check-In" ||
      l.io_type === "check_in",
  );

  // ถ้าไม่มี log หรือไม่มีข้อมูลกะงาน (shift) ให้คืนค่า absent ทันที
  if (!checkInLog || !shift || !shift.start_time) {
    return { status: "absent", lateMinutes: 0, checkInTime: "-" };
  }

  try {
    const checkInTime = new Date(checkInLog.timestamp);
    const shiftStart = new Date(checkInTime);
    const [h, m] = shift.start_time.split(":");
    shiftStart.setHours(parseInt(h), parseInt(m), 0);

    let status = "present";
    let lateMinutes = 0;

    if (checkInTime > shiftStart) {
      const diffMs = checkInTime.getTime() - shiftStart.getTime();
      lateMinutes = Math.floor(diffMs / 60000);
      if (lateMinutes > (shift.late_threshold_minutes || 15)) {
        status = "late";
      }
    }

    return { status, lateMinutes, checkInTime: checkInLog.timestamp };
  } catch (err) {
    console.error("Calculation Error:", err);
    return { status: "error", lateMinutes: 0 };
  }
};

export const fetchDailySummary = async (date: string) => {
  // 1. Fetch All Employees
  const { data: employees, error: empError } = await supabase
    .from("employees")
    .select("*");

  if (empError) throw empError;

  // 2. Fetch Logs for the Date
  const start = `${date}T00:00:00`;
  const end = `${date}T23:59:59`;
  const { data: logs, error: logError } = await supabase
    .from("attendance_logs")
    .select("*")
    .gte("timestamp", start)
    .lte("timestamp", end);

  if (logError) throw logError;

  // 3. Process Each Employee
  // Mock Shift (In real app, fetch from DB or Employee config)
  const defaultShift = { start_time: "08:00", late_threshold_minutes: 15 };

  const report =
    employees?.map((emp: any) => {
      // Filter logs for this employee
      const empLogs =
        logs?.filter((l: any) => l.employee_id === emp.employee_id) || [];

      // Calculate Status
      const { status, lateMinutes, checkInTime } = calculateDailyStatus(
        emp,
        empLogs,
        defaultShift,
      );

      return {
        id: emp.employee_id,
        name: `${emp.first_name} ${emp.last_name}`,
        checkInTime: checkInTime,
        status: status,
        lateMinutes: lateMinutes,
      };
    }) || [];

  return report;
};
