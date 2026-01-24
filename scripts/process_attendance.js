
const rawData = `20062   01-01-2026 11:02
20062   01-01-2026 19:16
20062   02-01-2026 10:56
20062   02-01-2026 19:14
20062   03-01-2026 11:20
20062   03-01-2026 19:25
20062   05-01-2026 11:12
20062   05-01-2026 19:24
20062   06-01-2026 10:48
20062   07-01-2026 03:00
20062   07-01-2026 10:52
20062   08-01-2026 03:28
20062   08-01-2026 11:52
20062   08-01-2026 19:21
20062   09-01-2026 11:50
20062   09-01-2026 19:51
20062   10-01-2026 19:38
20062   12-01-2026 11:05
20062   12-01-2026 16:16
20062   12-01-2026 16:35
20062   12-01-2026 16:38
20062   12-01-2026 16:43
20062   12-01-2026 16:45
20062   12-01-2026 16:46
20062   12-01-2026 19:31
20062   13-01-2026 12:11
20062   14-01-2026 03:06
20062   14-01-2026 12:20
20062   16-01-2026 13:22
20062   16-01-2026 19:53
20062   17-01-2026 11:13
20062   17-01-2026 19:23
20062   19-01-2026 11:20
20062   20-01-2026 03:03
20062   20-01-2026 12:15
20062   21-01-2026 03:02
20062   21-01-2026 11:09
20062   24-01-2026 11:55`;

const parseDate = (dateStr, timeStr) => {
    // Input DD-MM-YYYY, HH:mm
    const [d, m, y] = dateStr.split('-');
    return new Date(`${y}-${m}-${d}T${timeStr}:00`);
};

// Shift Logic:
// Any time between 00:00 and 06:00 is considered "Check Out" for the *previous* calendar day.
// Any time after 06:00 is considered part of the current day.

const processedRows = [];
const lines = rawData.split('\n').filter(l => l.trim());

// 1. Parsing
const timestamps = lines.map(line => {
    const parts = line.trim().split(/\s+/);
    const empId = parts[0];
    const dateStr = parts[1];
    const timeStr = parts[2];
    const ts = parseDate(dateStr, timeStr);

    // Determine effective working date
    let effectiveDate = new Date(ts);
    if (ts.getHours() < 6) {
        effectiveDate.setDate(effectiveDate.getDate() - 1);
    }
    const dateKey = effectiveDate.toISOString().split('T')[0];

    return {
        empId,
        originalDate: dateStr,
        originalTime: timeStr,
        timestamp: ts,
        dateKey
    };
});

// 2. Grouping by Effective Date
const logsByDate = {};
timestamps.forEach(ts => {
    if (!logsByDate[ts.dateKey]) logsByDate[ts.dateKey] = [];
    logsByDate[ts.dateKey].push(ts);
});

// 3. Analyze & Fix
const cleanedData = [];
const summary = {
    missingDays: [],
    anomalies: []
};

const allDates = Object.keys(logsByDate).sort();

// Check for missing days in range
if (allDates.length > 0) {
    const startDate = new Date(allDates[0]);
    const endDate = new Date(allDates[allDates.length - 1]);
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (!logsByDate[dateStr]) {
            summary.missingDays.push(dateStr);
        }
    }
}

allDates.forEach(date => {
    const dayLogs = logsByDate[date].sort((a, b) => a.timestamp - b.timestamp);

    if (dayLogs.length === 0) return;

    // Logic:
    // First log of the "shift" is Check In.
    // Last log of the "shift" is Check Out.
    // If only 1 log... depends.

    const checkIn = dayLogs[0];
    const checkOut = dayLogs[dayLogs.length - 1];

    // Add Check In
    cleanedData.push({
        employee_id: checkIn.empId,
        timestamp: checkIn.timestamp.toISOString(),
        io_type: 'check_in',
        source_log: `${checkIn.originalDate} ${checkIn.originalTime}`
    });

    // Check overlaps/anomalies
    if (dayLogs.length > 2) {
        // Many logs (e.g. 12-01 has 8 logs)
        summary.anomalies.push(`Date ${date}: Multiple scans found (${dayLogs.length}). Selected first (${checkIn.originalTime}) and last (${checkOut.originalTime}).`);
    } else if (dayLogs.length === 1) {
         // Single log
         // If it's very late (e.g. 19:38), might be only checkout? Or Forgot check in?
         // Assuming single log is Check In unless explicitly known otherwise, but user data shows 10-01 is 19:38.
         // Strategy: If time > 14:00, warn it might be 'Check Out' without 'Check In'.
         if (checkIn.timestamp.getHours() > 14) {
             cleanedData[cleanedData.length - 1].io_type = 'check_out'; // Change to check_out
               summary.anomalies.push(`Date ${date}: Only one scan found at ${checkIn.originalTime}. Treated as CHECK OUT due to late hour.`);
         } else {
               summary.anomalies.push(`Date ${date}: Only one scan found at ${checkIn.originalTime}. Treated as CHECK IN. Missing Check Out.`);
         }
         return; // Done for this day
    }

    // Add Check Out (if different from Check In)
    if (checkIn !== checkOut) {
        cleanedData.push({
            employee_id: checkOut.empId,
            timestamp: checkOut.timestamp.toISOString(),
            io_type: 'check_out',
            source_log: `${checkOut.originalDate} ${checkOut.originalTime}`
        });
    }
});

// 4. Output
console.log("--- ANALYSIS REPORT ---");
console.log("Missing Dates (No scans):", summary.missingDays.join(", "));
console.log("\nAnomalies/Notes:");
summary.anomalies.forEach(a => console.log("- " + a));
console.log("\n--- CLEANED DATA FOR IMPORT (JSON) ---");
console.log(JSON.stringify(cleanedData, null, 2));
