import dayjs from "dayjs";

export const processAttendanceLogs = (logs) => {
  // 1. Group by Employee and Date
  const groupedLogs = {};

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

  const processedResults = [];

  // 2. Process each group
  Object.keys(groupedLogs).forEach((empId) => {
    Object.keys(groupedLogs[empId]).forEach((date) => {
      let dailyLogs = groupedLogs[empId][date];

      // 4. De-duplicate: Remove logs with exact same timestamp
      // Keep the one with the higher ID (assuming later insertion) or just first one
      const uniqueLogs = [];
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

        if (hour < 12) {
          statusDetail = "เข้างาน (ไม่สแกนออก)";
        } else {
          statusDetail = "ออกงาน (ไม่สแกนเข้า)";
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
      let foundValidOut = false;

      for (let i = 1; i < dailyLogs.length; i++) {
        const currentLog = dailyLogs[i];
        const diffHours = dayjs(currentLog.timestamp).diff(
          dayjs(firstLog.timestamp),
          "hour",
          true,
        );

        if (diffHours >= 6) {
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
          }
        } else {
          // < 6 Hours. "Rounding 2 ... still In or Abnormal".
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
