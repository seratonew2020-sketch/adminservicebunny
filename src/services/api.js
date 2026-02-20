import { supabase } from '@/lib/supabase'
import axios from 'axios';
import supabaseApi from '@/lib/axios'; // Import the new centralized instance

// ==========================================================
// Custom Backend API (Node.js/Fastify) Client
// ==========================================================
const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? '/api' : 'https://vue3-app-ten.vercel.app/api');
const backendClient = axios.create({
  baseURL: backendUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ==========================================================
// Employee Management API (Switched to Backend)
// ==========================================================

export const fetchEmployees = async ({ page = 1, limit = 10, search = '' } = {}) => {
  try {
    const response = await backendClient.get('/employees', {
      params: { page, limit, search }
    });
    return response.data; // { data: [...], total: N }
  } catch (error) {
    console.error('Error fetching employees:', error.message)
    return { data: [], total: 0 }
  }
}

export const fetchEmployeeById = async (id) => {
  try {
    const response = await backendClient.get(`/employees/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching employee:', error)
    if (error.response && error.response.status === 404) return null;
    throw error
  }
}

export const fetchEmployeeByUserId = async (userId) => {
  try {
    const response = await backendClient.get(`/employees/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching employee by user id:', error)
    if (error.response && error.response.status === 404) return null;
    throw error
  }
}

export const createEmployee = async (employeeData) => {
  try {
    const response = await backendClient.post('/employees', employeeData);
    return response.data;
  } catch (error) {
    console.error('Error creating employee:', error)
    throw error
  }
}

export const updateEmployee = async (id, employeeData) => {
  try {
    const response = await backendClient.put(`/employees/${id}`, employeeData);
    return response.data;
  } catch (error) {
    console.error('Error updating employee:', error)
    throw error
  }
}

export const deleteEmployee = async (id) => {
  try {
    await backendClient.delete(`/employees/${id}`);
    return true
  } catch (error) {
    console.error('Error deleting employee:', error)
    throw error
  }
}

// ฟังก์ชันดึงข้อมูล Attendance Logs (แบบไม่ Join)
// Refactored to use centralized supabaseApi for consistent auth headers if using Direct Supabase
export const fetchAttendanceLogs = async ({ page = 1, limit = 50 } = {}) => {
  try {
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Option 1: Use supabase-js client (which handles auth internally) - EXISTING
    /*
    const { data, count, error } = await supabase
      .from('attendance_logs')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(from, to)
    */

    // Option 2: Use axios with interceptor (if raw HTTP preferred) - NEW
    const response = await supabaseApi.get('/attendance_logs', {
      params: {
        select: '*',
        order: 'timestamp.desc',
        offset: from,
        limit: limit
      },
      headers: {
        'Prefer': 'count=exact'
      }
    });

    // Parse total from Content-Range header "0-9/100"
    const contentRange = response.headers['content-range'];
    const total = contentRange ? parseInt(contentRange.split('/')[1]) : 0;

    return { data: response.data, total: total }
  } catch (error) {
    console.error('Error fetching logs:', error.message)
    return { data: [], total: 0 }
  }
}

// ฟังก์ชันดึงข้อมูล Stats (Dashboard)
export const fetchStats = async () => {
  try {
    // 1. Total Employees
    // Using supabase-js is fine, but if you want to ensure no 403, use backendClient if possible,
    // or supabaseApi which we just fixed.

    // Let's use the new supabaseApi to ensure headers are sent correctly
    const empRes = await supabaseApi.head('/employees', {
      headers: { 'Prefer': 'count=exact' }
    });
    const totalEmployees = parseInt(empRes.headers['content-range']?.split('/')[1] || 0);

    // 2. Currently Clocked In (today)
    const today = new Date().toISOString().split('T')[0]
    const attRes = await supabaseApi.head('/attendance_logs', {
      headers: { 'Prefer': 'count=exact' },
      params: { 'timestamp': `gte.${today}` }
    });
    const currentlyClockedIn = parseInt(attRes.headers['content-range']?.split('/')[1] || 0);

    return {
      total_employees: totalEmployees || 0,
      currently_clocked_in: currentlyClockedIn || 0,
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
    // Using centralized axios instance to guarantee apikey header
    const response = await supabaseApi.get('/attendance_logs', {
      params: {
        select: '*, employees(first_name,last_name,department)',
        timestamp: `gte.${startDate}`,
        // Note: For complex AND logic in URL params, axios params might need specific serialization
        // simpler to just use supabase-js for complex queries, or ensure params are stringified correctly.
        // But for consistency with the fix request:
        'timestamp': `lte.${endDate}T23:59:59`,
        order: 'timestamp.asc'
      }
    });

    return { data: response.data, error: null }
  } catch (error) {
    console.error('Error fetching logs by range:', error.message)
    return { data: [], error }
  }
}

// ฟังก์ชันดึงข้อมูลพนักงานทั้งหมด (สำหรับตรวจสอบ Absent)
export const fetchAllEmployees = async () => {
  try {
    // Using backend client is safest for "All Employees" to avoid RLS limits
    const response = await backendClient.get('/employees', { params: { limit: 1000 } });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching all employees:', error.message)
    return []
  }
}

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

// ==========================================================
// Leave Management API
// ==========================================================

export const fetchLeaves = async (filters = {}) => {
  try {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.employeeCode) params.employeeCode = filters.employeeCode;
    if (filters.leaveType) params.leaveType = filters.leaveType;
    if (filters.start) params.start = filters.start;
    if (filters.end) params.end = filters.end;
    if (filters.limit) params.limit = filters.limit;

    const response = await backendClient.get('/leaves', { params });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching leaves:', error);
    return [];
  }
}

export const fetchLeavesForSchedule = async ({ start, end, status, leaveType } = {}) => {
  try {
    if (!start || !end) return [];

    const params = { start, end };
    if (status) params.status = status;
    if (leaveType) params.leaveType = leaveType;

    const response = await backendClient.get('/leaves', { params });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching schedule leaves:', error);
    throw error;
  }
}

export const fetchEmployeesByCodes = async (codes) => {
  try {
    if (!codes || codes.length === 0) return [];

    const response = await backendClient.post('/employees/by-codes', { codes });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching employees by codes:', error);
    return []; // Return empty array instead of throwing
  }
}

export const fetchDepartments = async () => {
  try {
    const response = await backendClient.get('/departments');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching departments:', error);
    return [];
  }
}

export const fetchLeaveById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('leaves')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching leave:', error)
    throw error
  }
}

export const createLeave = async (leaveData) => {
  try {
    const response = await backendClient.post('/leaves/request', leaveData)
    return response.data
  } catch (error) {
    console.error('Error creating leave:', error)
    throw error
  }
}

export const updateLeave = async (id, leaveData) => {
  try {
    const { data, error } = await supabase
      .from('leaves')
      .update(leaveData)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating leave:', error)
    throw error
  }
}

export const approveLeave = async (id, approvalData) => {
  try {
    const response = await backendClient.put(`/leaves/${id}/status`, approvalData)
    return response.data
  } catch (error) {
    console.error('Error approving leave:', error)
    throw error
  }
}

// Notification API
export const fetchNotifications = async () => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

export const markNotificationAsRead = async (id) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return false
  }
}

// Notification Preferences API
export const fetchNotificationPreferences = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') throw error // Ignore no rows found
    return data || { email_enabled: true, in_app_enabled: true } // Default
  } catch (error) {
    console.error('Error fetching preferences:', error)
    return { email_enabled: true, in_app_enabled: true }
  }
}

export const updateNotificationPreferences = async (userId, prefs) => {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: userId, ...prefs })
      .select()
      .single()
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating preferences:', error)
    throw error
  }
}

export const fetchLeaveStatistics = async (employeeId, year) => {
  // Placeholder implementation
  return { success: false, data: {} }
}

export const fetchRawAttendanceLogs = async (params) => {
  try {
    const response = await backendClient.get('/master-times/processed-attendance', {
      params
    })
    return response.data || []
  } catch (error) {
    console.error('Error fetching raw attendance logs:', error)
    return []
  }
}

// ==========================================================
// Time Correction API
// ==========================================================

export const fetchTimeCorrections = async (filters = {}) => {
  try {
    const response = await backendClient.get('/time-corrections', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching time corrections:', error);
    return { data: [], total: 0 };
  }
}

export const createTimeCorrection = async (data) => {
  try {
    const response = await backendClient.post('/time-corrections', data);
    return response.data;
  } catch (error) {
    console.error('Error creating time correction:', error);
    throw error;
  }
}

export const updateTimeCorrectionStatus = async (id, payload) => {
  try {
    const response = await backendClient.put(`/time-corrections/${id}/status`, payload);
    return response.data;
  } catch (error) {
    console.error('Error updating time correction status:', error);
    throw error;
  }
}

// ==========================================================
// Audit Logs API
// ==========================================================

export const fetchAuditLogs = async ({ page = 1, limit = 20, filters = {} } = {}) => {
  try {
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    // Apply filters
    // if (filters.table_name) query = query.ilike('table_name', `%${filters.table_name}%`)

    const { data, count, error } = await query

    if (error) throw error

    return { data, total: count }
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return { data: [], total: 0 }
  }
}

// ==========================================================
// Holiday Management API
// ==========================================================

export const fetchHolidays = async (filters = {}) => {
  try {
    const response = await backendClient.get('/holidays', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching holidays:', error);
    throw error;
  }
}

export const createHoliday = async (holidayData) => {
  try {
    const response = await backendClient.post('/holidays', holidayData);
    return response.data;
  } catch (error) {
    console.error('Error creating holiday:', error);
    throw error;
  }
}

export const updateHoliday = async (id, holidayData) => {
  try {
    const response = await backendClient.put(`/holidays/${id}`, holidayData);
    return response.data;
  } catch (error) {
    console.error('Error updating holiday:', error);
    throw error;
  }
}

export const deleteHoliday = async (id) => {
  try {
    await backendClient.delete(`/holidays/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting holiday:', error);
    throw error;
  }
}

export default {
  fetchEmployees,
  fetchEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  fetchAttendanceLogs,
  fetchStats,
  fetchAttendanceByDateRange,
  fetchAllEmployees,
  fetchMasterTimes,
  createMasterTime,
  updateMasterTime,
  deleteMasterTime,
  fetchLeaves,
  fetchLeaveById,
  createLeave,
  updateLeave,
  approveLeave,
  fetchLeaveStatistics,
  fetchRawAttendanceLogs,
  fetchAuditLogs,
  fetchHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  fetchLeavesForSchedule,
  fetchEmployeesByCodes,
  fetchDepartments,
  fetchEmployeeByUserId,
  fetchTimeCorrections,
  createTimeCorrection,
  updateTimeCorrectionStatus
};
