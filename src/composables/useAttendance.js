import { computed } from 'vue'

export function useAttendance(logs) {

  // Helper: Calculate Late Minutes from Benchmarks
  // Benchmarks: 10:00 (Morning), 19:00 (Night)
  const calculateLateMinutes = (checkInDate) => {
    const hour = checkInDate.getHours()
    // const minutes = checkInDate.getMinutes() // Unused for now

    let shiftStartHour = 10 // Default Morning
    if (hour >= 19 || hour < 4) shiftStartHour = 19 // Night

    // Create Benchmark Date
    const benchmark = new Date(checkInDate)
    benchmark.setHours(shiftStartHour, 0, 0, 0)

    // If check-in is BEFORE benchmark, not late
    if (checkInDate < benchmark) return 0

    // Calculate Diff
    const diffMs = checkInDate - benchmark
    return Math.floor(diffMs / 60000) // Minutes
  }

  // Process Logs into Daily Records
  const dailyRecords = computed(() => {
    if (!logs.value) return []

    const groups = {}

    // Group by Employee + Date
    logs.value.forEach(log => {
      const dateObj = new Date(log.timestamp)
      const dateKey = dateObj.toLocaleDateString() // Simple Key
      const empId = log.employee_id
      const key = `${empId}-${dateKey}`

      if (!groups[key]) {
        groups[key] = {
          date: dateKey,
          employee_id: empId,
          scans: [],
          rawDate: dateObj
        }
      }
      groups[key].scans.push(dateObj)
    })

    // Analyze each group
    const records = Object.values(groups).map(group => {
      // Sort scans by time
      group.scans.sort((a, b) => a - b)

      const checkIn = group.scans[0]
      const checkOut = group.scans.length > 1 ? group.scans[group.scans.length - 1] : null

      // Condition: 2 scans required
      let status = 'Normal'
      let lateMin = 0

      // Check Status
      if (!checkOut) {
        status = 'Forgot Scan' // Only 1 scan
      }

      // Calculate Late (from Check In)
      lateMin = calculateLateMinutes(checkIn)

      return {
        id: `${group.employee_id}-${group.date}`, // Unique ID for table keys
        date: group.date,
        employee_id: group.employee_id,
        checkIn: checkIn,
        checkOut: checkOut,
        lateMinutes: lateMin,
        status: status,
        rawDate: group.rawDate
      }
    })

    // Sort by latest date
    return records.sort((a, b) => b.rawDate - a.rawDate)
  })

  // Advanced Stats Aggregation
  const analysisStats = computed(() => {
    let totalLateMinutes = 0
    let lateCount = 0
    let forgotScanCount = 0

    // Breakdown
    let todayLate = 0
    let weekLate = 0
    let monthLate = 0

    const now = new Date()
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const isToday = (d) => d.toDateString() === now.toDateString()

    dailyRecords.value.forEach(r => {
      totalLateMinutes += r.lateMinutes
      if (r.lateMinutes > 0) lateCount++
      if (r.status === 'Forgot Scan') forgotScanCount++

      // Time-based aggregation
      const rDate = new Date(r.rawDate)
      if (isToday(rDate)) todayLate += r.lateMinutes
      if (rDate >= startOfWeek) weekLate += r.lateMinutes
      if (rDate >= startOfMonth) monthLate += r.lateMinutes
    })

    return {
      totalWorkHours: '142h', // Mock
      lateCount,
      forgotScanCount,
      totalLateMinutes,
      todayLate,
      weekLate,
      monthLate
    }
  })

  return {
    dailyRecords,
    analysisStats,
    calculateLateMinutes
  }
}
