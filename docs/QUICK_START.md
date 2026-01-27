# 🚀 Quick Start Guide - Master Times System

## เริ่มต้นใช้งานภายใน 5 นาที

### ขั้นตอนที่ 1: ตั้งค่า Database Schema

```bash
# วิธีที่ 1: ใช้ Supabase Dashboard (แนะนำ)
# 1. เปิด Supabase Dashboard → SQL Editor
# 2. Copy เนื้อหาจากไฟล์ migrations/001_create_master_times_schema.sql
# 3. Paste และกด Run

# วิธีที่ 2: ใช้ psql (ถ้ามี local access)
psql -h <your-supabase-host> -U postgres -d postgres -f migrations/001_create_master_times_schema.sql
```

### ขั้นตอนที่ 2: สร้างข้อมูลทดสอบ

```bash
# สร้างข้อมูลทดสอบครบทุก test case
node scripts/generateTestData.js generate
```

**ผลลัพธ์ที่คาดหวัง:**
```
🚀 Starting test data generation...

📝 Test Case 1: กะเช้า 10:00-19:00 สมบูรณ์
  ✓ Inserted 2 logs
✅ Case 1 completed

📝 Test Case 2: ลืมสแกนออกงาน
  ✓ Inserted 1 logs
✅ Case 2 completed

...

✨ Test data generation completed successfully!
```

### ขั้นตอนที่ 3: ประมวลผลข้อมูล

```bash
# วิธีที่ 1: ใช้ API (แนะนำ)
curl -X POST http://localhost:3000/api/master-times/process-attendance \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 1,
    "start_date": "2026-01-20",
    "end_date": "2026-01-27"
  }'

# วิธีที่ 2: ใช้ Frontend UI
# เปิดเบราว์เซอร์ไปที่ http://localhost:5173/master-times
```

### ขั้นตอนที่ 4: ดูผลลัพธ์

```bash
# ดูข้อมูลที่ประมวลผลแล้ว
curl http://localhost:3000/api/master-times/processed-attendance

# ดูสถิติ
curl "http://localhost:3000/api/master-times/statistics?start_date=2026-01-20&end_date=2026-01-27"
```

---

## 📊 ตัวอย่างผลลัพธ์

### ข้อมูลที่ประมวลผลแล้ว

```json
{
  "status": "OK",
  "data": [
    {
      "employee_id": 1,
      "employee_code": "EMP001",
      "first_name": "สมชาย",
      "work_date": "2026-01-26",
      "check_in_time": "2026-01-26T10:05:00+07:00",
      "check_out_time": "2026-01-26T19:02:00+07:00",
      "shift_name": "กะเช้า 10:00-19:00",
      "status": "COMPLETE",
      "status_thai": "สมบูรณ์",
      "total_hours": 8.95,
      "is_overnight": false
    },
    {
      "employee_id": 1,
      "work_date": "2026-01-27",
      "check_in_time": "2026-01-27T10:05:00+07:00",
      "check_out_time": null,
      "status": "MISSING_OUT",
      "status_thai": "ลืมสแกนออกงาน",
      "total_hours": null
    }
  ]
}
```

### สถิติ

```json
{
  "status": "OK",
  "data": {
    "period": {
      "start_date": "2026-01-20",
      "end_date": "2026-01-27"
    },
    "total_records": 25,
    "total_employees": 8,
    "complete_records": 20,
    "missing_in_records": 2,
    "missing_out_records": 3,
    "total_hours": 180.5,
    "average_hours_per_record": 7.22,
    "completion_rate": 80.0
  }
}
```

---

## 🧪 การทดสอบ

### รันการทดสอบทั้งหมด

```bash
npm run test tests/masterTimes.test.js
```

**ผลลัพธ์ที่คาดหวัง:**
```
 ✓ tests/masterTimes.test.js (30)
   ✓ MasterTimesService - Time Processing (30)
     ✓ Overnight Boundary Detection (6)
     ✓ Work Date Calculation (4)
     ✓ Log Grouping by Work Date (3)
     ✓ Shift Matching (6)
     ✓ Work Hours Calculation (4)
     ✓ Work Day Processing (3)
     ✓ Edge Cases (4)
     ✓ Complex Scenarios (2)

 Test Files  1 passed (1)
      Tests  30 passed (30)
```

---

## 🎯 Test Cases ที่ครอบคลุม

| # | Test Case | สถานะที่คาดหวัง | ไฟล์ทดสอบ |
|---|-----------|----------------|-----------|
| 1 | กะเช้า 10:00-19:00 สมบูรณ์ | COMPLETE | ✅ |
| 2 | ลืมสแกนออกงาน | MISSING_OUT | ✅ |
| 3 | กะดึก 18:00-03:00 สมบูรณ์ | COMPLETE (overnight) | ✅ |
| 4 | กะดึก 19:00-03:00 สมบูรณ์ | COMPLETE (overnight) | ✅ |
| 5 | กะบ่าย 11:00-20:00 สมบูรณ์ | COMPLETE | ✅ |
| 6 | หลายวันติดต่อกัน | Mixed statuses | ✅ |
| 7 | กะดึกติดต่อกันหลายวัน | COMPLETE (all overnight) | ✅ |
| 8 | Edge Case - เวลาตรง 02:00 | COMPLETE | ✅ |
| 9 | Edge Case - เวลาตรง 03:00 | COMPLETE | ✅ |
| 10 | บันทึกมากกว่า 2 ครั้ง/วัน | COMPLETE | ✅ |

---

## 🔧 คำสั่งที่ใช้บ่อย

### จัดการข้อมูลทดสอบ

```bash
# สร้างข้อมูลทดสอบใหม่
node scripts/generateTestData.js generate

# ลบข้อมูลทดสอบ
node scripts/generateTestData.js clear

# ลบและสร้างใหม่
node scripts/generateTestData.js reset
```

### ประมวลผลข้อมูล

```bash
# ประมวลผลพนักงานคนเดียว
curl -X POST http://localhost:3000/api/master-times/process-attendance \
  -H "Content-Type: application/json" \
  -d '{"employee_id": 1, "start_date": "2026-01-20", "end_date": "2026-01-27"}'

# ประมวลผลหลายคน
curl -X POST http://localhost:3000/api/master-times/batch-process \
  -H "Content-Type: application/json" \
  -d '{"employee_ids": [1,2,3,4,5], "start_date": "2026-01-20", "end_date": "2026-01-27"}'
```

### ดูข้อมูล

```bash
# ดูรายการ Shift ทั้งหมด
curl http://localhost:3000/api/master-times

# ดูข้อมูลที่ประมวลผลแล้ว (พนักงานคนเดียว)
curl "http://localhost:3000/api/master-times/processed-attendance?employee_id=1"

# ดูข้อมูลที่ประมวลผลแล้ว (ช่วงเวลา)
curl "http://localhost:3000/api/master-times/processed-attendance?start_date=2026-01-20&end_date=2026-01-27"

# ดูเฉพาะรายการที่ลืมสแกน
curl "http://localhost:3000/api/master-times/processed-attendance?status=MISSING_OUT"

# ดูรายงานพนักงาน
curl "http://localhost:3000/api/master-times/report/1?start_date=2026-01-20&end_date=2026-01-27"
```

---

## 📱 ใช้งานผ่าน Frontend

1. เปิดเบราว์เซอร์ไปที่: `http://localhost:5173/master-times`

2. **จัดการ Master Shift Times:**
   - ดูรายการช่วงเวลาทำงานทั้งหมด
   - เพิ่ม/แก้ไข/ลบช่วงเวลาทำงาน

3. **ประมวลผลบันทึกเวลา:**
   - กรอกรหัสพนักงาน
   - เลือกช่วงวันที่
   - กดปุ่ม "ประมวลผล"

4. **ดูผลลัพธ์:**
   - ตารางแสดงข้อมูลที่ประมวลผลแล้ว
   - สถิติแบบ Real-time
   - สถานะการเข้างาน (สมบูรณ์/ลืมสแกนเข้า/ลืมสแกนออก)

---

## 🐛 Troubleshooting

### ปัญหา: ไม่สามารถเชื่อมต่อ Database

**วิธีแก้:**
```bash
# ตรวจสอบ environment variables
cat .env | grep SUPABASE

# ควรมี:
# VITE_SUPABASE_URL=https://xxx.supabase.co
# VITE_SUPABASE_ANON_KEY=xxx
# SUPABASE_SERVICE_ROLE_KEY=xxx
```

### ปัญหา: Test ไม่ผ่าน

**วิธีแก้:**
```bash
# ตรวจสอบว่าติดตั้ง dependencies ครบ
npm install

# รัน test แบบ verbose
npm run test -- --reporter=verbose
```

### ปัญหา: ข้อมูลไม่ถูกประมวลผล

**วิธีแก้:**
```bash
# 1. ตรวจสอบว่ามีข้อมูล attendance_logs
curl http://localhost:3000/api/logs

# 2. ตรวจสอบว่ามี Master Shift Times
curl http://localhost:3000/api/master-times

# 3. ลองประมวลผลใหม่
curl -X POST http://localhost:3000/api/master-times/process-attendance \
  -H "Content-Type: application/json" \
  -d '{"employee_id": 1, "start_date": "2026-01-20", "end_date": "2026-01-27"}'
```

---

## 📚 เอกสารเพิ่มเติม

- [Full Documentation](./MASTER_TIMES_README.md)
- [API Reference](./MASTER_TIMES_README.md#api-endpoints)
- [Database Schema](./MASTER_TIMES_README.md#โครงสร้างฐานข้อมูล)
- [Business Rules](./MASTER_TIMES_README.md#กฎการทำงาน)

---

## ✅ Checklist

- [ ] ติดตั้ง Database Schema
- [ ] สร้างข้อมูลทดสอบ
- [ ] รัน Test Suite (ควรผ่านทั้งหมด)
- [ ] ประมวลผลข้อมูลทดสอบ
- [ ] ตรวจสอบผลลัพธ์ใน Frontend
- [ ] ทดสอบ API Endpoints ทั้งหมด

---

**เวลาที่ใช้ทั้งหมด:** ~5 นาที ⏱️

**สถานะ:** Production-Ready ✅
