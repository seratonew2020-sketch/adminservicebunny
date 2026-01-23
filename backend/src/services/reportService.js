// ตัวอย่าง Logic การคำนวณ
const calculateDailyStatus = (employees, logs, shift) => {
  // Logic หาเวลาเข้างานครั้งแรก
  const checkInLog = logs.find(l => l.io_type === 'I' || l.io_type === 'CheckIn');

  if (!checkInLog) return { status: 'absent', lateMinutes: 0 };

  const checkInTime = new Date(checkInLog.timestamp);
  // สมมติเวลาเข้างานจาก Shift (ควรดึงจาก DB จริง)
  const shiftStart = new Date(checkInTime);
  const [h, m] = shift.start_time.split(':');
  shiftStart.setHours(h, m, 0);

  let status = 'present';
  let lateMinutes = 0;

  if (checkInTime > shiftStart) {
    const diffMs = checkInTime - shiftStart;
    lateMinutes = Math.floor(diffMs / 60000); // แปลง ms เป็นนาที

    // ถ้าสายเกินเกณฑ์ที่กำหนด
    if (lateMinutes > shift.late_threshold_minutes) {
      status = 'late';
    }
  }

  return { status, lateMinutes, checkInTime: checkInLog.timestamp };
};

module.exports = { calculateDailyStatus };