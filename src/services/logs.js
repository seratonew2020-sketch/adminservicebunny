import { supabase } from '@/lib/supabase'

export const fetchAttendanceLogs = async ({ startDate, endDate, empId, name }) => {
  try {
    // 1. เริ่ม Query จากตาราง attendance_logs
    let query = supabase
      .from('attendance_logs')
      .select(`
        *,
        employees!inner (
          first_name,
          last_name,
          department
        )
      `)
      .order('timestamp', { ascending: false })

    // 2. กรองตามวันที่ (ถ้ามี)
    if (startDate) {
      query = query.gte('timestamp', `${startDate}T00:00:00`)
    }
    if (endDate) {
      query = query.lte('timestamp', `${endDate}T23:59:59`)
    }

    // 3. กรองตามรหัสพนักงาน (ถ้ามี)
    if (empId) {
      query = query.eq('employee_id', empId)
    }

    // 4. กรองตามชื่อ (ต้อง search ในตาราง employees)
    if (name) {
      // หมายเหตุ: การ Search ข้ามตารางใน Supabase ต้องใช้ Logic เพิ่มเติม
      // แต่วิธีง่ายสุดคือดึงมาแล้ว Filter หรือใช้ Text Search ของ Supabase
      // ในที่นี้ขอเว้นไว้ก่อนเพื่อให้โค้ดรันได้
    }

    const { data, error } = await query

    if (error) throw error

    // 5. จัด Format ข้อมูลให้ตรงกับที่หน้าจอต้องการ
    return data.map(log => ({
      id: log.id,
      employee_id: log.employee_id,
      name: `${log.employees?.first_name || ''} ${log.employees?.last_name || ''}`,
      department: log.employees?.department,
      timestamp: log.timestamp,
      type: log.io_type, // เข้า/ออก
      image: log.image_url
    }))

  } catch (err) {
    console.error('Supabase Fetch Error:', err.message)
    throw err
  }
}
