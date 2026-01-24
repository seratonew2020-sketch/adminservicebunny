import dayjs from "dayjs";
import { AttendanceLog, ProcessedLog } from "./logProcessor.js";

export interface UserStats {
  userId: string;
  name: string; // Placeholder if available in logs or passed in
  dailyStats: Record<string, number>; // "YYYY-MM-DD": count
  monthlyStats: Record<string, number>; // "YYYY-MM": count
  totalDaysScanned: number;
}

export interface AnalyticsResult {
  byUser: Record<string, UserStats>;
  globalMonthToDateLogs: ProcessedLog[];
}

export const calculateAttendanceStats = (
  logs: AttendanceLog[],
  mtdLogs: ProcessedLog[] = [],
): AnalyticsResult => {
  const byUser: Record<string, UserStats> = {};

  // Process all filtered logs for stats
  logs.forEach((log) => {
    const empId = log.employee_id;
    const date = dayjs(log.timestamp).format("YYYY-MM-DD");
    const month = dayjs(log.timestamp).format("YYYY-MM");

    if (!byUser[empId]) {
      byUser[empId] = {
        userId: empId,
        name: "", // You might need to join/merge name if available
        dailyStats: {},
        monthlyStats: {},
        totalDaysScanned: 0,
      };
    }

    // Daily Count
    if (!byUser[empId].dailyStats[date]) {
      byUser[empId].dailyStats[date] = 0;
    }
    byUser[empId].dailyStats[date]++;

    // Monthly Count
    if (!byUser[empId].monthlyStats[month]) {
      byUser[empId].monthlyStats[month] = 0;
    }
    byUser[empId].monthlyStats[month]++;
  });

  // Calculate Total Days Scanned
  Object.values(byUser).forEach((userStat) => {
    userStat.totalDaysScanned = Object.keys(userStat.dailyStats).length;
  });

  return {
    byUser,
    globalMonthToDateLogs: mtdLogs.sort(
      (a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf(),
    ), // Oldest first
  };
};
