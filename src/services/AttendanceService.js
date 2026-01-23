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
  // 1. ดึงข้อมูล 2 ชุดพร้อมกัน (Parallel Fetching)
  // fetchLogsByRange ยังคงดึงตามช่วงเวลา (ไม่กรองตาม User เพื่อลดความซับซ้อนของ query และใช้ Map กรองทีหลังได้เร็วพอกันสำหรับ dataset นี้)
  const [employees, logs] = await Promise.all([
    fetchAllEmployees(filters),
    fetchLogsByRange(startDate, endDate)
  ])

  // 2. เตรียม Log ใส่ Map เพื่อให้ค้นหาเร็วๆ (Optimization)
  // Key จะเป็น "EMP001-2023-10-25"
  const logsMap = {}
  logs.forEach(log => {
    // ตัดเอาแค่วันที่จาก timestamp (เช่น 2023-10-25T08:00:00 -> 2023-10-25)
    const dateKey = log.timestamp.split('T')[0]
    const key = `${log.employee_id}-${dateKey}`

    if (!logsMap[key]) logsMap[key] = []
    logsMap[key].push(log)
  })

  // 3. สร้าง Array ของวันที่ทั้งหมดในช่วงที่เลือก
  const dateRange = getDatesInRange(startDate, endDate)

  // 4. วนลูปจับคู่: พนักงานทุกคน x ทุกวันที่
  const reportData = []

  employees.forEach(emp => {
    dateRange.forEach(date => {
      const key = `${emp.employee_id}-${date}`
      const dailyLogs = logsMap[key] || [] // ถ้าไม่มี log จะได้ array ว่าง

      // คำนวณเวลาเข้า-ออก
      let checkIn = '-'
      let checkOut = '-'
      let workHours = 0
      let status = 'ขาดงาน' // Default

      if (dailyLogs.length > 0) {
        // เรียงเวลาจากน้อยไปมาก (กันพลาด)
        dailyLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

        // เวลาเข้า = ตัวแรก, เวลาออก = ตัวสุดท้าย
        const firstLog = dailyLogs[0]
        const lastLog = dailyLogs[dailyLogs.length - 1]

        checkIn = formatTime(firstLog.timestamp)
        status = 'ปกติ' // เปลี่ยนสถานะเป็นปกติก่อน

        // กรณีมีการสแกนมากกว่า 1 ครั้ง ถือว่ามีเวลาออก
        if (dailyLogs.length > 1) {
          checkOut = formatTime(lastLog.timestamp)

          // คำนวณชั่วโมงทำงาน (มิลลิวินาที -> ชั่วโมง)
          const diffMs = new Date(lastLog.timestamp) - new Date(firstLog.timestamp)
          workHours = (diffMs / (1000 * 60 * 60)).toFixed(2) // ทศนิยม 2 ตำแหน่ง
        }
      }

      // เพิ่มข้อมูลลงใน Report
      reportData.push({
        date: date,
        employee_id: emp.employee_id,
        full_name: `${emp.first_name} ${emp.last_name}`,
        department: emp.department || '-',
        check_in: checkIn,
        check_out: checkOut,
        work_hours: workHours,
        status: status,
        raw_logs: dailyLogs // เก็บ log ดิบเผื่อไว้กดดูรายละเอียด
      })
    })
  })

  return reportData
}

// ==========================================
// 3. Helper Functions
// ==========================================

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