import dayjs from "dayjs";

export const calculateAttendanceStats = (
  logs,
  mtdLogs = [],
) => {
  const byUser = {};

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
