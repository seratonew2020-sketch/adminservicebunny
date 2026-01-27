/**
 * =====================================================
 * Master Times Service - Time Processing Engine
 * =====================================================
 *
 * This service handles all time tracking logic including:
 * - Processing raw attendance logs
 * - Grouping logs by work date
 * - Handling overnight shifts (02:00-03:00 rule)
 * - Detecting missing check-ins/check-outs
 * - Calculating work hours
 */

import { supabase } from '../lib/supabaseClient.js';

/**
 * Time Processing Service Class
 */
export class MasterTimesService {
  /**
   * กำหนดช่วงเวลาพิเศษสำหรับการข้ามวัน (02:00 - 03:00)
   */
  static OVERNIGHT_BOUNDARY = {
    START_HOUR: 2,
    END_HOUR: 3
  };

  /**
   * ตรวจสอบว่าเวลาอยู่ในช่วง 02:00 - 03:00 หรือไม่
   * @param {Date} dateTime - วันเวลาที่ต้องการตรวจสอบ
   * @returns {boolean}
   */
  static isInOvernightBoundary(dateTime) {
    const hour = dateTime.getHours();
    return hour >= this.OVERNIGHT_BOUNDARY.START_HOUR &&
           hour < this.OVERNIGHT_BOUNDARY.END_HOUR;
  }

  /**
   * Helper function to get YYYY-MM-DD in local time
   * @param {Date} date
   * @returns {string}
   */
  static toLocalDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * คำนวณวันที่ทำงานจากเวลาบันทึก
   * ตามกฎ: ถ้าบันทึกในช่วง 02:00-03:00 ให้ถือเป็นวันก่อนหน้า
   *
   * @param {Date} logTime - เวลาที่บันทึก
   * @param {number} logIndex - ลำดับการบันทึกในวัน (0 = ครั้งแรก, 1 = ครั้งที่สอง)
   * @returns {Date} - วันที่ทำงาน
   */
  static calculateWorkDate(logTime, logIndex = 0) {
    const workDate = new Date(logTime);

    // กฎพิเศษสำหรับช่วง 02:00 - 03:00
    if (this.isInOvernightBoundary(logTime)) {
      if (logIndex === 0) {
        // บันทึกครั้งแรกในช่วง 02:00-03:00 = เวลาออกงานของวันก่อนหน้า
        workDate.setDate(workDate.getDate() - 1);
      }
      // บันทึกครั้งที่สอง = เวลาออกงานของวันนั้น (ไม่ต้องปรับ)
    } else if (logTime.getHours() < 6) {
      // ถ้าเวลาก่อน 06:00 (แต่ไม่อยู่ในช่วง 02:00-03:00) ให้ถือเป็นวันก่อนหน้า
      workDate.setDate(workDate.getDate() - 1);
    }

    // Reset time to midnight for date comparison
    workDate.setHours(0, 0, 0, 0);
    return workDate;
  }

  /**
   * จัดกลุ่มบันทึกเวลาตามวันที่ทำงาน
   *
   * @param {Array} logs - รายการบันทึกเวลาทั้งหมด
   * @returns {Map} - Map ของวันที่ทำงาน => รายการบันทึก
   */
  static groupLogsByWorkDate(logs) {
    const groupedLogs = new Map();

    // เรียงลำดับตามเวลา
    const sortedLogs = [...logs].sort((a, b) =>
      new Date(a.timestamp || a.log_time) - new Date(b.timestamp || b.log_time)
    );

    // ติดตามลำดับการบันทึกในแต่ละวันตามปฏิทิน
    const calendarDayCounter = new Map();

    sortedLogs.forEach(log => {
      const logTime = new Date(log.timestamp || log.log_time);
      const calendarDateKey = this.toLocalDateKey(logTime);

      const currentCount = calendarDayCounter.get(calendarDateKey) || 0;
      calendarDayCounter.set(calendarDateKey, currentCount + 1);

      // logIndex คือลำดับที่เริ่มจาก 0
      const workDate = this.calculateWorkDate(logTime, currentCount);
      const workDateKey = this.toLocalDateKey(workDate);

      if (!groupedLogs.has(workDateKey)) {
        groupedLogs.set(workDateKey, []);
      }

      groupedLogs.get(workDateKey).push({
        ...log,
        log_time: logTime, // keeping for internal logic
        timestamp: logTime,
        work_date: workDate
      });
    });

    return groupedLogs;
  }

  /**
   * หา Shift ที่เหมาะสมที่สุดจากเวลาเข้างาน
   *
   * @param {Date} checkInTime - เวลาเข้างาน
   * @param {Array} shifts - รายการ Shift ทั้งหมด
   * @returns {Object|null} - Shift ที่เหมาะสมที่สุด
   */
  static findBestMatchingShift(checkInTime, shifts) {
    if (!checkInTime || !shifts || shifts.length === 0) return null;

    const checkInHour = checkInTime.getHours();
    const checkInMinute = checkInTime.getMinutes();
    const checkInTotalMinutes = checkInHour * 60 + checkInMinute;

    let bestShift = null;
    let minDifference = Infinity;

    shifts.forEach(shift => {
      // Robustness: ensure start_time exists
      if (!shift.start_time) return;

      const [shiftHour, shiftMinute] = shift.start_time.split(':').map(Number);
      const shiftTotalMinutes = shiftHour * 60 + shiftMinute;

      // คำนวณความแตกต่าง (ยอมรับ ±2 ชั่วโมง)
      const difference = Math.abs(checkInTotalMinutes - shiftTotalMinutes);

      if (difference < minDifference && difference <= 120) { // 120 นาที = 2 ชั่วโมง
        minDifference = difference;
        bestShift = shift;
      }
    });

    return bestShift;
  }

  /**
   * คำนวณจำนวนชั่วโมงทำงาน
   *
   * @param {Date} checkIn - เวลาเข้างาน
   * @param {Date} checkOut - เวลาออกงาน
   * @returns {number} - จำนวนชั่วโมง (ทศนิยม 2 ตำแหน่ง)
   */
  static calculateWorkHours(checkIn, checkOut) {
    if (!checkIn || !checkOut) return null;

    const diffMs = checkOut - checkIn;
    const diffHours = diffMs / (1000 * 60 * 60);

    return Math.round(diffHours * 100) / 100; // ปัดเศษ 2 ตำแหน่ง
  }

  /**
   * ประมวลผลบันทึกเวลาสำหรับวันทำงานหนึ่งวัน
   *
   * @param {string} workDateKey - วันที่ทำงาน (YYYY-MM-DD)
   * @param {Array} logs - รายการบันทึกเวลาในวันนั้น
   * @param {Array} shifts - รายการ Shift ทั้งหมด
   * @returns {Object} - ข้อมูลการเข้างานที่ประมวลผลแล้ว
   */
  static processWorkDayLogs(workDateKey, logs, shifts) {
    const sortedLogs = [...logs].sort((a, b) => a.log_time - b.log_time);

    const checkInLog = sortedLogs[0];
    const checkOutLog = sortedLogs[sortedLogs.length - 1];

    const checkInTime = checkInLog ? checkInLog.log_time : null;
    const checkOutTime = sortedLogs.length > 1 ? checkOutLog.log_time : null;

    // หา Shift ที่เหมาะสม
    const matchedShift = this.findBestMatchingShift(checkInTime, shifts);

    // กำหนดสถานะ
    let status = 'COMPLETE';
    if (!checkInTime) {
      status = 'MISSING_IN';
    } else if (!checkOutTime) {
      status = 'MISSING_OUT';
    }

    // คำนวณชั่วโมงทำงาน
    const totalHours = this.calculateWorkHours(checkInTime, checkOutTime);

    // ตรวจสอบว่าเป็น Shift ข้ามวันหรือไม่
    const isOvernight = matchedShift ? matchedShift.is_overnight : false;

    return {
      work_date: workDateKey,
      check_in_time: checkInTime ? checkInTime.toISOString() : null,
      check_out_time: checkOutTime ? checkOutTime.toISOString() : null,
      shift_id: matchedShift ? matchedShift.id : null,
      status,
      total_hours: totalHours,
      is_overnight: isOvernight,
      raw_logs_count: logs.length
    };
  }

  /**
   * ประมวลผลบันทึกเวลาทั้งหมดของพนักงาน
   *
   * @param {number} employeeId - รหัสพนักงาน
   * @param {Date} startDate - วันที่เริ่มต้น
   * @param {Date} endDate - วันที่สิ้นสุด
   * @returns {Promise<Array>} - รายการข้อมูลที่ประมวลผลแล้ว
   */
  static async processEmployeeAttendance(employeeId, startDate, endDate) {
    try {
      // 1. ดึงข้อมูล Shift ทั้งหมด
      const { data: shifts, error: shiftsError } = await supabase
        .from('master_times')
        .select('*')
        .eq('is_active', true);

      if (shiftsError) throw shiftsError;

      // 2. ดึงบันทึกเวลาของพนักงาน
      const { data: logs, error: logsError } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .order('timestamp', { ascending: true });

      if (logsError) throw logsError;

      if (!logs || logs.length === 0) {
        return [];
      }

      // 3. จัดกลุ่มตามวันที่ทำงาน
      const groupedLogs = this.groupLogsByWorkDate(logs);

      // 4. ประมวลผลแต่ละวัน
      const processedData = [];

      for (const [workDateKey, dayLogs] of groupedLogs) {
        const processed = this.processWorkDayLogs(workDateKey, dayLogs, shifts);
        processedData.push({
          employee_id: employeeId,
          ...processed
        });
      }

      return processedData;
    } catch (error) {
      console.error('Error processing employee attendance:', error);
      throw error;
    }
  }

  /**
   * บันทึกข้อมูลที่ประมวลผลแล้วลงฐานข้อมูล
   *
   * @param {Array} processedData - ข้อมูลที่ประมวลผลแล้ว
   * @returns {Promise<Object>} - ผลลัพธ์การบันทึก
   */
  static async saveProcessedAttendance(processedData) {
    try {
      const results = [];

      for (const data of processedData) {
        // ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
        const { data: existing } = await supabase
          .from('processed_attendance')
          .select('id')
          .eq('employee_id', data.employee_id)
          .eq('work_date', data.work_date)
          .maybeSingle();

        if (existing) {
          // Update
          const { data: updated, error } = await supabase
            .from('processed_attendance')
            .update({
              check_in_time: data.check_in_time,
              check_out_time: data.check_out_time,
              shift_id: data.shift_id,
              status: data.status,
              total_hours: data.total_hours,
              is_overnight: data.is_overnight
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (error) throw error;
          results.push(updated);
        } else {
          // Insert
          const { data: inserted, error } = await supabase
            .from('processed_attendance')
            .insert([data])
            .select()
            .single();

          if (error) throw error;
          results.push(inserted);
        }
      }

      return { success: true, data: results };
    } catch (error) {
      console.error('Error saving processed attendance:', error);
      throw error;
    }
  }

  /**
   * สร้างรายงานสรุปการเข้างาน
   *
   * @param {number} employeeId - รหัสพนักงาน
   * @param {Date} startDate - วันที่เริ่มต้น
   * @param {Date} endDate - วันที่สิ้นสุด
   * @returns {Promise<Object>} - รายงานสรุป
   */
  static async generateAttendanceReport(employeeId, startDate, endDate) {
    try {
      let query = supabase
        .from('attendance_summary')
        .select('*');
      query = query.eq('employee_id', employeeId);
      query = query.gte('work_date', this.toLocalDateKey(startDate));
      query = query.lte('work_date', this.toLocalDateKey(endDate));
      query = query.order('work_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // คำนวณสถิติ
      const totalDays = data.length;
      const completeDays = data.filter(d => d.status === 'COMPLETE').length;
      const missingInDays = data.filter(d => d.status === 'MISSING_IN').length;
      const missingOutDays = data.filter(d => d.status === 'MISSING_OUT').length;
      const totalHours = data.reduce((sum, d) => sum + (d.total_hours || 0), 0);

      return {
        employee_id: employeeId,
        period: {
          start_date: this.toLocalDateKey(startDate),
          end_date: this.toLocalDateKey(endDate)
        },
        summary: {
          total_days: totalDays,
          complete_days: completeDays,
          missing_in_days: missingInDays,
          missing_out_days: missingOutDays,
          total_hours: Math.round(totalHours * 100) / 100,
          average_hours_per_day: totalDays > 0
            ? Math.round((totalHours / totalDays) * 100) / 100
            : 0
        },
        details: data
      };
    } catch (error) {
      console.error('Error generating attendance report:', error);
      throw error;
    }
  }
}

export default MasterTimesService;
