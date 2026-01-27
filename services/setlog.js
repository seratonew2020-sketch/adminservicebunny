import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

// Set default timezone to Asia/Bangkok for backend processing
const DEFAULT_TZ = "Asia/Bangkok";

/**
 * setlog.js - ฐานบัญัญัติกฎการทำงานและการจัดกลุ่ม Log
 * ข้อมูลกะทำงาน (MASTER_SHIFTS) จะถูกดึงจาก database master_times แทน
 */


export const OVERNIGHT_BOUNDARY = {
  START_HOUR: 2,
  END_HOUR: 3
};

/**
 * คำนวณวันที่ทำงาน (Work Date) ตามกฎ Overnight Boundary
 * ใช้เวลา Asia/Bangkok เป็นหลัก
 */
export function calculateWorkDate(timestamp, isFirstLogOfDay = false) {
  // สร้าง dayjs object จาก timestamp และแปลงเป็น Asia/Bangkok
  const logTime = dayjs(timestamp).tz(DEFAULT_TZ);
  const hour = logTime.hour();

  // เริ่มต้นด้วยวันที่ตามปฏิทินในไทย
  let workDate = logTime.startOf('day');

  // กฎพิเศษ 02:00 - 03:00 (Overnight Boundary)
  if (hour >= OVERNIGHT_BOUNDARY.START_HOUR && hour < OVERNIGHT_BOUNDARY.END_HOUR) {
    if (isFirstLogOfDay) {
      // ถ้าเป็นบันทึกแรกของวัน แต่มาสแกนช่วง 2-3 ตี ให้ถือเป็นงานของวันก่อนหน้า
      workDate = workDate.subtract(1, 'day');
    }
  }
  // กฎทั่วไป: ถ้าบันทึกก่อน 06:00 น. มักจะเป้นการเลิกงานของกะดึกวันก่อนหน้า
  else if (hour < 6) {
    workDate = workDate.subtract(1, 'day');
  }

  return workDate.format('YYYY-MM-DD');
}

/**
 * ค้นหากะที่ใกล้เคียงที่สุด
 * @param {string} checkInTimeStr - เวลา check-in (ISO string)
 * @param {Array} masterShifts - ข้อมูลกะจาก master_times database
 */
export function findMatchingShift(checkInTimeStr, masterShifts = []) {
  if (!checkInTimeStr || masterShifts.length === 0) return null;

  const time = dayjs(checkInTimeStr).tz(DEFAULT_TZ);
  const totalMinutes = time.hour() * 60 + time.minute();

  let bestShift = null;
  let minDiff = Infinity;

  masterShifts.forEach(shift => {
    const [h, m] = shift.start_time.split(':').map(Number);
    const shiftMinutes = h * 60 + m;
    const diff = Math.abs(totalMinutes - shiftMinutes);

    // ยอมรับส่วนต่างไม่เกิน 2 ชม. (120 นาที)
    if (diff < minDiff && diff <= 120) {
      minDiff = diff;
      bestShift = {
        id: shift.id,
        name: shift.shift_name,
        start: shift.start_time,
        end: shift.end_time,
        type: shift.is_overnight ? 'ข้ามวัน' : 'ปกติ',
        is_overnight: shift.is_overnight
      };
    }
  });

  return bestShift;
}

/**
 * ฟังก์ชันหลักในการ Map attendance_logs
 * @param {Array} logs - ข้อมูล attendance logs
 * @param {Array} masterShifts - ข้อมูลกะจาก master_times database
 */
export function mapAttendanceLogs(logs, masterShifts = []) {
  if (!logs || logs.length === 0) return [];

  // 1. เรียงลำดับ logs ตามเวลา (ใช้ Native Date สำหรับการ Sort)
  const sortedLogs = [...logs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // 2. จัดกลุ่มตามพนักงานและวันที่ทำงาน
  const processedGroups = new Map();
  const calendarCounter = new Map(); // ไว้นับลำดับการสแกนในแต่ละวันปฏิทิน

  sortedLogs.forEach(log => {
    const logTimeThai = dayjs(log.timestamp).tz(DEFAULT_TZ);
    const empId = log.employee_id;
    const calKey = `${empId}_${logTimeThai.format('YYYY-MM-DD')}`;

    const count = (calendarCounter.get(calKey) || 0) + 1;
    calendarCounter.set(calKey, count);

    // คำนวณวันที่ทำงาน (Work Date) โดยใช้กฎเช้ามืด
    const workDate = calculateWorkDate(log.timestamp, count === 1);
    const groupKey = `${empId}_${workDate}`;

    if (!processedGroups.has(groupKey)) {
      processedGroups.set(groupKey, {
        employee_id: empId,
        work_date: workDate,
        logs: []
      });
    }

    processedGroups.get(groupKey).logs.push(log);
  });

  // 3. วิเคราะห์ในแต่ละกลุ่ม (Employee + Work Date)
  const result = [];
  processedGroups.forEach((groupData) => {
    const dayLogs = groupData.logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let checkIn = null;
    let checkOut = null;

    // กฎ "03:00 คือเวลาเลิกงาน"
    if (dayLogs.length === 1) {
      const log = dayLogs[0];
      const hour = dayjs(log.timestamp).tz(DEFAULT_TZ).hour();

      // ถ้ามีบันทึกเดียวในช่วงตี 2 - ตี 5 ให้ถือว่าเป็นขาออก
      if (hour >= 2 && hour <= 5) {
        checkOut = log;
        checkIn = null;
      } else {
        checkIn = log;
        checkOut = null;
      }
    } else {
      checkIn = dayLogs[0];
      checkOut = dayLogs[dayLogs.length - 1];
    }

    const shift = findMatchingShift(checkIn ? checkIn.timestamp : checkOut.timestamp, masterShifts);

    // กำหนดสถานะงานพื้นฐาน
    let status = (checkIn && checkOut) ? 'ปกติ' : (checkIn ? 'ขาดลงชื่อออก' : 'ขาดลงชื่อเข้า');
    let lateMinutes = 0;
    let workHours = 0;

    // คำนวณสาย
    if (checkIn && shift) {
      const inTime = dayjs(checkIn.timestamp).tz(DEFAULT_TZ);
      const [sh, sm] = shift.start.split(':').map(Number);
      const shiftStartInMinutes = sh * 60 + sm;
      const actualInInMinutes = inTime.hour() * 60 + inTime.minute();

      if (actualInInMinutes > shiftStartInMinutes) {
        lateMinutes = actualInInMinutes - shiftStartInMinutes;
        status = 'มาสาย';
      }
    }

    // คำนวณชั่วโมงทำงาน
    if (checkIn && checkOut) {
      const diffMs = dayjs(checkOut.timestamp).diff(dayjs(checkIn.timestamp));
      workHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    }

    // ตรวจสอบ OT (02:50 - 03:30)
    if (checkOut) {
      const outTime = dayjs(checkOut.timestamp).tz(DEFAULT_TZ);
      const totalMinutesOut = outTime.hour() * 60 + outTime.minute();

      // 02:50 = 170 นาที, 03:30 = 210 นาที
      if (totalMinutesOut >= 170 && totalMinutesOut <= 210) {
        status = 'OT';
      }
    }

    result.push({
      employee_id: groupData.employee_id,
      work_date: groupData.work_date, // YYYY-MM-DD
      check_in: checkIn ? checkIn.timestamp : null,
      check_out: checkOut ? checkOut.timestamp : null,
      shift_name: shift ? shift.name : 'ไม่ระบุ',
      type: shift ? shift.type : 'ปกติ',
      status: status,
      late_minutes: lateMinutes,
      work_hours: workHours
    });
  });

  // เรียงลำดับผลลัพธ์ตามวันที่ทำงาน (ใหม่ไปเก่า)
  return result.sort((a, b) => dayjs(b.work_date).diff(dayjs(a.work_date)));
}
