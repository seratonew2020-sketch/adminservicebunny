import axios from 'axios'

// --- Setup Axios Client (เหมือนเดิม) ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const apiClient = axios.create({
  baseURL: `${supabaseUrl}/rest/v1`,
  headers: {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json'
  }
})

// ==========================================
// 1. ดึงข้อมูล (API Calls)
// ==========================================

// ดึงพนักงานทุกคน (หรือตามเงื่อนไขค้นหา)
export const fetchAllEmployees = async ({ id = '', name = '' } = {}) => {
  try {
    const params = new URLSearchParams()
    params.append('select', '*')
    params.append('order', 'employee_id.asc')

    if (id) {
       // Filter by ID (partial match, case-insensitive)
       params.append('employee_id', `ilike.%${id}%`)
    }

    if (name) {
       // Filter by Name (partial match on first_name OR last_name)
       // Supabase 'or' syntax: or=(first_name.ilike.%val%,last_name.ilike.%val%)
       params.append('or', `(first_name.ilike.%${name}%,last_name.ilike.%${name}%)`)
    }

    const response = await apiClient.get('/employees', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching employees:', error)
    return []
  }
}

// ดึง Log ตามช่วงเวลา (ไม่ต้อง Join employees ในนี้ เพื่อเลี่ยง Error 400)
export const fetchLogsByRange = async (startDate, endDate) => {
  try {
    const params = new URLSearchParams()
    params.append('select', '*')
    params.append('timestamp', `gte.${startDate}`)
    params.append('timestamp', `lte.${endDate}T23:59:59`) // Inclusive end date
    params.append('order', 'timestamp.asc')

    const response = await apiClient.get('/attendance_logs', {
      params: params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching logs:', error)
    return []
  }
}

// ==========================================
// 2. ฟังก์ชันประมวลผล (Business Logic)
// ==========================================

export const generateAttendanceReport = async (startDate, endDate, filters = {}) => {
  // 1. ดึงข้อมูลพนักงานและ Log ที่ประมวลผลแล้วจาก Backend (ซึ่งใช้ setlog.js)
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const [employees, processedLogsResponse] = await Promise.all([
    fetchAllEmployees(filters),
    axios.get(`${API_BASE}/api/logs`, {
      params: { start_date: startDate, end_date: endDate }
    })
  ])

  const processedLogs = processedLogsResponse.data.data || []

  // 2. เตรียม Map ค้นหา Log ที่ประมวลผลแล้ว: Key = "employee_id-YYYY-MM-DD"
  const logsByDay = {}
  processedLogs.forEach(log => {
    const key = `${log.employee_id}-${log.work_date}`
    logsByDay[key] = log
  })

  // 3. เตรียมช่วงวันที่
  const dateRange = getDatesInRange(startDate, endDate)
  const reportData = []

  // 4. ผนวกข้อมูลพนักงาน + วันที่ เพื่อหาคนขาดงาน
  employees.forEach(emp => {
    dateRange.forEach(date => {
      const key = `${emp.employee_id}-${date}`
      const log = logsByDay[key]

      if (log) {
        // มีข้อมูล (ดึงจาก setlog.js)
        reportData.push({
          date: date,
          employee_id: emp.employee_id,
          full_name: `${emp.first_name} ${emp.last_name}`,
          department: emp.department || '-',
          check_in: log.check_in,
          check_out: log.check_out,
          work_hours: log.work_hours || 0,
          status: log.status, // ปกติ, มาสาย, OT, ขาดลงชื่อ...
          is_late: log.late_minutes > 0 ? `${log.late_minutes} นาที` : '',
          late_minutes: log.late_minutes || 0,
          shift_name: log.shift_name,
          raw_logs: []
        })
      } else {
        // ไม่มีข้อมูล = ขาดงาน
        reportData.push({
          date: date,
          employee_id: emp.employee_id,
          full_name: `${emp.first_name} ${emp.last_name}`,
          department: emp.department || '-',
          check_in: '-',
          check_out: '-',
          work_hours: 0,
          status: 'ขาดงาน',
          is_late: '',
          late_minutes: 0,
          shift_name: '-',
          raw_logs: []
        })
      }
    })
  })

  return reportData
}

// ==========================================
// 3. Helper Functions
// ==========================================

// Defined Shifts (กะเวลาที่กำหนด)
const definedShifts = [
  { start_time: '10:00' },
  { start_time: '11:00' },
  { start_time: '18:00' },
  { start_time: '19:00' },
]

// คำนวณสถานะมาสาย
export const calculateTimeStatus = (logTimeISO, type) => {
  // Filter only Check-In
  const isCheckIn = type === 'check_in' || type === 'CHECK' || type === 'เข้างาน'
                    || (typeof type === 'string' && type.toLowerCase().includes('in'));

  if (!isCheckIn) return { status_detail: '', late_minutes: 0, is_late: '' }

  // Parse Log Time (UTC Face Value)
  const logDate = new Date(logTimeISO)
  const logH = logDate.getUTCHours()
  const logM = logDate.getUTCMinutes()
  const logTotalM = logH * 60 + logM

  // Find Closest Shift
  let bestShift = null
  let minDiff = Infinity

  for (const shift of definedShifts) {
    const [sH, sM] = shift.start_time.split(':').map(Number)
    const shiftTotalM = sH * 60 + sM
    const diff = logTotalM - shiftTotalM // +ve = Late, -ve = Early

    // Logic: Pick closest shift
    if (Math.abs(diff) < minDiff) {
      minDiff = Math.abs(diff)
      bestShift = { ...shift, diffMinutes: diff }
    }
  }

  if (bestShift && bestShift.diffMinutes > 0) {
    return {
      status_detail: `Late (${bestShift.start_time})`,
      late_minutes: bestShift.diffMinutes,
      is_late: `${bestShift.diffMinutes} นาที`
    }
  } else if (bestShift) {
     return {
      status_detail: `On Time (${bestShift.start_time})`,
      late_minutes: 0,
      is_late: ''
    }
  }

  return { status_detail: '-', late_minutes: 0, is_late: '' }
}

// ฟังก์ชันสร้าง Array วันที่ (เช่น ['2023-10-01', '2023-10-02', ...])
function getDatesInRange(startDate, endDate) {
  const date = new Date(startDate)
  const end = new Date(endDate)
  const dates = []

  while (date <= end) {
    dates.push(date.toISOString().split('T')[0])
    date.setDate(date.getDate() + 1)
  }
  return dates
}

// ฟังก์ชันแปลง Timestamp เป็นเวลา (HH:mm)
function formatTime(isoString) {
  if (!isoString) return '-'
  const date = new Date(isoString)
  // จัดรูปแบบเป็น HH:mm (ภาษาไทย)
  return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}