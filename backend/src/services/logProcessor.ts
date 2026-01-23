import dayjs from "dayjs";

export interface AttendanceLog {
  id: number;
  employee_id: string;
  timestamp: string;
  io_type: string;
  source: string;
}

export interface ProcessedLog {
  id: number;
  empId: string;
  time: string;
  status: string;
  statusDetail?: string; // e.g. "ลืมสแกน (เข้า)", "ลืมสแกน (ออก)"
  device: string;
}

export const processAttendanceLogs = (
  logs: AttendanceLog[],
): ProcessedLog[] => {
  // 1. Group by Employee and Date
  const groupedLogs: Record<string, Record<string, AttendanceLog[]>> = {};

  logs.forEach((log) => {
    const date = dayjs(log.timestamp).format("YYYY-MM-DD");
    if (!groupedLogs[log.employee_id]) {
      groupedLogs[log.employee_id] = {};
    }
    if (!groupedLogs[log.employee_id][date]) {
      groupedLogs[log.employee_id][date] = [];
    }
    groupedLogs[log.employee_id][date].push(log);
  });

  const processedResults: ProcessedLog[] = [];

  // 2. Process each group
  Object.keys(groupedLogs).forEach((empId) => {
    Object.keys(groupedLogs[empId]).forEach((date) => {
      let dailyLogs = groupedLogs[empId][date];

      // 4. De-duplicate: Remove logs with exact same timestamp
      // Keep the one with the higher ID (assuming later insertion) or just first one
      const uniqueLogs: AttendanceLog[] = [];
      const seenTimes = new Set();
      dailyLogs.forEach((log) => {
        const timeStr = dayjs(log.timestamp).format("HH:mm:ss");
        if (!seenTimes.has(timeStr)) {
          seenTimes.add(timeStr);
          uniqueLogs.push(log);
        }
      });
      dailyLogs = uniqueLogs;

      // Sort by time ascending
      dailyLogs.sort(
        (a, b) => dayjs(a.timestamp).valueOf() - dayjs(b.timestamp).valueOf(),
      );

      // 3. Single Scan Logic
      if (dailyLogs.length === 1) {
        const log = dailyLogs[0];
        const hour = dayjs(log.timestamp).hour();
        let status = "ลืมสแกน";
        let statusDetail = "";

        // If scanned in AM (before 12:00), assume they forgot to scan OUT (PM)
        // BUT wait, requirements say:
        // - "Forgot In": If single scan is PM? Or if "Forgot Out" if single scan is AM?
        // Let's re-read carefully:
        // "รอบที่ 1 (เข้า): หากบันทึกเดียวนั้นเกิดขึ้นในช่วงเวลาเช้า... หรือไม่มีบันทึกอื่นในวันนั้นเลย" -> This implies the ONE record we have IS the 'IN' record. So they forgot the 'OUT'??
        // Wait, "ให้กำหนดสถานะเป็น 'ลืมสแกน' ... ระบุเพิ่มเติมว่าเป็นการลืมสแกน 'รอบที่ 1' หรือ 'รอบที่ 2'"
        // Usually:
        // If I have only one scan at 08:00 (AM) -> That is my IN scan. I forgot my OUT scan.
        // If I have only one scan at 18:00 (PM) -> That is my OUT scan. I forgot my IN scan.

        // Requirement interpretation:
        // "รอบที่ 1 (เข้า): หากบันทึกเดียวนั้นเกิดขึ้นในช่วงเวลาเช้า" -> This likely describes what the EXISTING record is.
        // If existing is AM -> It is "Check In". So status might be "ลืมสแกนออก" (Forgot Out).
        // However, the requirement says "Set status to 'ลืมสแกน'".

        // Let's stick to the prompt's implied logic for *categorizing the missing part* or just labeling the *existing* log?
        // Prompt says: "ระบุเพิ่มเติมในข้อมูลผลลัพธ์ว่าเป็นการลืมสแกน 'รอบที่ 1' (เข้า) หรือ 'รอบที่ 2' (ออก)"
        // This is slightly ambiguous. Does it mean "This record IS the skipped one"? No, we can't show a record that doesn't exist.
        // It likely means "Status = Forgot Scan", Detail = "Found One Scan (AM) - Missing Out" etc.

        // Let's implement:
        // If Time < 12:00 -> This is Check In. status="ลืมสแกน", statusDetail="เข้างาน (ขาดออก)"
        // If Time >= 12:00 -> This is Check Out. status="ลืมสแกน", statusDetail="ออกงาน (ขาดเข้า)"

        if (hour < 12) {
          statusDetail = "เข้างาน (ไม่สแกนออก)";
        } else {
          statusDetail = "ออกงาน (ไม่สแกนเข้า)";
          // If requirement says "Forgot In" is "Round 1", maybe we match text exactly next time.
        }

        processedResults.push({
          id: log.id,
          empId: log.employee_id,
          time: log.timestamp,
          status: "ลืมสแกน",
          statusDetail: statusDetail,
          device: log.source,
        });
        return;
      }

      // 2. Normal Logic (>= 2 scans)
      // We only care about Round 1 (First) and Round 2 (Last, or specifically the one > 6 hours)

      const firstLog = dailyLogs[0];
      // Assume First is ALWAYS In
      processedResults.push({
        id: firstLog.id,
        empId: firstLog.employee_id,
        time: firstLog.timestamp,
        status: "เข้างาน",
        device: firstLog.source,
      });

      // Find the "Out" log
      // "รอบที่สอง ของวัน จะถือเป็น "ออกงาน" ก็ต่อเมื่อมีระยะเวลาห่างจากรอบแรก อย่างน้อย 6 ชั่วโมง"
      // We process the rest
      let foundValidOut = false;

      for (let i = 1; i < dailyLogs.length; i++) {
        const currentLog = dailyLogs[i];
        const diffHours = dayjs(currentLog.timestamp).diff(
          dayjs(firstLog.timestamp),
          "hour",
          true,
        );

        if (diffHours >= 6) {
          // This is a valid OUT
          // Check if we already found one? Usually take the last one?
          // Requirement: "Round 2 ... becomes Out".
          // If there are multiple > 6 hours, usually the last one is the true Out.
          // For simplicity let's treat the *last* valid one as Out? Or the *first* valid one?
          // "รอบที่สอง ... จะถือเป็น ออกงาน" -> Implies the second chronological event satisfying the condition.
          if (!foundValidOut) {
            processedResults.push({
              id: currentLog.id,
              empId: currentLog.employee_id,
              time: currentLog.timestamp,
              status: "ออกงาน",
              device: currentLog.source,
            });
            foundValidOut = true;
          } else {
            // Duplicate Out? Or extra scan?
            // Prompt doesn't specify deeply. Ignore or mark as duplicate?
            // Let's just ignore for now or mark as "Extra".
          }
        } else {
          // < 6 Hours. "Rounding 2 ... still In or Abnormal".
          // Let's mark as "ซ้ำซ้อน/ผิดปกติ" (Abnormal)
          processedResults.push({
            id: currentLog.id,
            empId: currentLog.employee_id,
            time: currentLog.timestamp,
            status: "ระบุไม่ได้ (เวลาใกล้เคียง)",
            device: currentLog.source,
          });
        }
      }
    });
  });

  // Sort final result by time desc (as originally requested in route)
  return processedResults.sort(
    (a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf(),
  );
};
