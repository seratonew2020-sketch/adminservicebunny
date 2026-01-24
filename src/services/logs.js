import { supabase } from '@/lib/supabase'

export const fetchAttendanceLogs = async ({ startDate, endDate, empId, name }) => {
  try {
    let empIdsToFilter = null

    // 1. ถ้ามีการกรองด้วยชื่อ ให้ค้นหา Employee ID จากชื่อก่อน
    if (name) {
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('employee_id')
        .or(`first_name.ilike.%${name}%,last_name.ilike.%${name}%`)

      if (empError) throw empError

      if (employees.length === 0) {
        return [] // ถ้าไม่เจอพนักงานชื่อนี้ ก็ไม่ต้องหา logs
      }
      empIdsToFilter = employees.map(e => e.employee_id)
    }

    // 2. Query logs table
    let query = supabase
      .from('attendance_logs')
      .select('*')
      .order('timestamp', { ascending: false })

    // กรองตามวันที่
    if (startDate) query = query.gte('timestamp', `${startDate}T00:00:00`)
    if (endDate) query = query.lte('timestamp', `${endDate}T23:59:59`)

    // กรองตามรหัสพนักงาน
    if (empId) {
      query = query.eq('employee_id', empId)
    } else if (empIdsToFilter !== null) {
      // ถ้ามี empIds ที่หาจากชื่อ ให้ใช้ in()
      query = query.in('employee_id', empIdsToFilter)
    }

    const { data: logs, error } = await query
    if (error) throw error
    if (!logs || logs.length === 0) return []

    // 3. Manual Join: ดึงข้อมูลพนักงานของ logs ที่เจอ
    // รวบรวม failed lookup IDs เพื่อดึงทีเดียว
    const relatedEmpIds = [...new Set(logs.map(log => log.employee_id).filter(Boolean))]

    let employeesMap = {}
    if (relatedEmpIds.length > 0) {
      const { data: employees, error: empDetailError } = await supabase
        .from('employees')
        .select('employee_id, first_name, last_name, department')
        .in('employee_id', relatedEmpIds)

      if (!empDetailError && employees) {
        employees.forEach(emp => {
          employeesMap[emp.employee_id] = emp
        })
      }
    }

    // 4. Map ข้อมูลกลับ
    // Note: User requested to display raw data as much as possible.
    // If 'io_type' is missing, try 'action' (based on user JSON dump).
    return logs.map(log => {
      const emp = employeesMap[log.employee_id] || {}
      return {
        id: log.id,
        employee_id: log.employee_id,
        name: emp.first_name ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : 'Unknown',
        department: emp.department || '-',
        timestamp: log.timestamp,
        type: log.io_type || log.action || '-', // Fallback to action if io_type is null
        image: log.image_url
      }
    })

  } catch (err) {
    console.error('Supabase Fetch Error:', err.message)
    throw err
  }
}
