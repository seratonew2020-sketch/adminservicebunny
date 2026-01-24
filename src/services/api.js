import axios from 'axios'

// ดึงค่า Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// สร้าง Instance ของ Axios เพื่อไม่ต้องใส่ Header ทุกครั้ง
const apiClient = axios.create({
  baseURL: `${supabaseUrl}/rest/v1`,
  timeout: 10000,
  headers: {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation' // บอกให้ Server ส่งข้อมูลกลับมาด้วย
  }
})

// ฟังก์ชันดึงข้อมูล Employees พร้อม Pagination
export const fetchEmployees = async ({ page = 1, limit = 10 } = {}) => {
  try {
    // Calculate range for pagination (0-indexed)
    const from = (page - 1) * limit
    const to = from + limit - 1

    const response = await apiClient.get('/employees', {
      headers: {
        'Prefer': 'count=exact' // ขอจำนวนข้อมูลทั้งหมดมาด้วย
      },
      params: {
        select: '*',
        order: 'employee_id.asc',
        offset: from,
        limit: limit // Supabase uses limit/offset or Range header
      }
    })

    // Parse total count from Content-Range header (e.g., "0-9/100")
    // If not present, default to 0
    let total = 0
    const contentRange = response.headers['content-range']
    if (contentRange) {
      const parts = contentRange.split('/')
      total = parts.length > 1 ? parseInt(parts[1], 10) : 0
    }

    // Supabase JS client handles range automatically, but via axios we might need to be explicit with Range header or offset/limit params.
    // However, PostgREST supports limit/offset params directly.
    // Note: 'limit' in params limits the result set size.

    console.log(`Employees Page ${page}:`, response.data)
    return { data: response.data, total }

  } catch (error) {
    console.error('Error fetching employees:', error.message)
    if (error.response) {
      console.error('Supabase Status:', error.response.status)
      console.error('Supabase Details:', error.response.data)
    }
    return { data: [], total: 0 }
  }
}

// ฟังก์ชันดึงข้อมูล Attendance Logs (แบบไม่ Join)
export const fetchAttendanceLogs = async ({ page = 1, limit = 50 } = {}) => {
  try {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const response = await apiClient.get('/attendance_logs', {
      headers: {
        'Prefer': 'count=exact'
      },
      params: {
        select: '*',
        order: 'timestamp.desc', // Newest first
        offset: from,
        limit: limit
      }
    })

    let total = 0
    const contentRange = response.headers['content-range']
    if (contentRange) {
      const parts = contentRange.split('/')
      total = parts.length > 1 ? parseInt(parts[1], 10) : 0
    }

    console.log(`Attendance Logs Page ${page}:`, response.data)
    return { data: response.data, total }

  } catch (error) {
    console.error('Error fetching logs:', error.message)
    if (error.response) {
      console.error('Supabase Details:', error.response.data)
    }
    return { data: [], total: 0 }
  }
}

// ฟังก์ชันดึงข้อมูล Stats (Dashboard)
export const fetchStats = async () => {
  try {
    // Override headers for count=exact
    const config = {
      headers: { 'Prefer': 'count=exact' }
    }

    // 1. Total Employees
    const empReq = apiClient.head('/employees', config)

    // 2. Currently Clocked In (today)
    const today = new Date().toISOString().split('T')[0]
    const attReq = apiClient.head('/attendance_logs', {
      headers: { 'Prefer': 'count=exact' },
      params: { 'timestamp': `gte.${today}` }
    })

    const [empRes, attRes] = await Promise.all([empReq, attReq])

    const parseCount = (res) => {
      const range = res.headers['content-range']
      if (!range) return 0
      return parseInt(range.split('/')[1] || 0)
    }

    return {
      total_employees: parseCount(empRes),
      currently_clocked_in: parseCount(attRes),
      late_arrivals: 0
    }
  } catch (error) {
    console.error('Error fetching stats:', error.message)
    return {
      total_employees: 0,
      currently_clocked_in: 0,
      late_arrivals: 0
    }
  }
}
// ฟังก์ชันดึงข้อมูล Attendance Logs ตามช่วงเวลา (สำหรับ TimeAll)
export const fetchAttendanceByDateRange = async (startDate, endDate) => {
  try {
    const params = new URLSearchParams()
    params.append('select', '*,employees(first_name,last_name,department)')
    params.append('timestamp', `gte.${startDate}`)
    // Append time to endDate to ensure inclusive filtering for the whole day
    params.append('timestamp', `lte.${endDate}T23:59:59`)
    params.append('order', 'timestamp.asc')

    const response = await apiClient.get('/attendance_logs', {
      headers: { 'Prefer': 'count=exact' },
      params: params
    })
    return { data: response.data, error: null }
  } catch (error) {
    console.error('Error fetching logs by range:', error.message)
    return { data: [], error }
  }
}

// ฟังก์ชันดึงข้อมูลพนักงานทั้งหมด (สำหรับตรวจสอบ Absent)
export const fetchAllEmployees = async () => {
  try {
    const response = await apiClient.get('/employees', {
      params: {
        select: '*',
        order: 'employee_id.asc'
      }
    })
    return response.data
  } catch (error) {
    console.error('Error fetching all employees:', error.message)
    return []
  }
}

// ==========================================================
// Custom Backend API (Node.js/Fastify) for Master Times
// ==========================================================
const backendUrl = import.meta.env.VITE_BACKEND_URL || '/api' // Use proxy path
const backendClient = axios.create({
  baseURL: backendUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const fetchMasterTimes = async () => {
  try {
    const response = await backendClient.get('/master-times')
    return response.data
  } catch (error) {
    console.error('Error fetching master times:', error)
    return []
  }
}

export const createMasterTime = async (data) => {
  try {
    const response = await backendClient.post('/master-times', data)
    return response.data
  } catch (error) {
    console.error('Error creating master time:', error)
    throw error
  }
}

export const updateMasterTime = async (id, data) => {
  try {
    const response = await backendClient.put(`/master-times/${id}`, data)
    return response.data
  } catch (error) {
    console.error('Error updating master time:', error)
    throw error
  }
}

export const deleteMasterTime = async (id) => {
  try {
    await backendClient.delete(`/master-times/${id}`)
    return true
  } catch (error) {
    console.error('Error deleting master time:', error)
    throw error
  }
}
