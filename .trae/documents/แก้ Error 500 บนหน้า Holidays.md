**วิเคราะห์ปัญหา**
- Backend ตอบ 500 เมื่อ POST /api/holidays เพราะตาราง holidays ใน Supabase ขาดคอลัมน์ start_date และ/หรือ end_date (ยืนยันแล้วจากการทดสอบ) 
- โค้ดฝั่ง Backend มี route ครบทั้ง GET/POST/PUT/DELETE ในไฟล์ [holidays.js](file:///Users/m/ไดรฟ์ของฉัน/adminservicebunny/backend/src/routes/holidays.js) และถูก register ใน [server.ts](file:///Users/m/ไดรฟ์ของฉัน/adminservicebunny/backend/src/server.ts) 
- ฝั่ง Frontend ส่งฟิลด์ถูกต้องจาก [holidays.vue](file:///Users/m/ไดรฟ์ของฉัน/adminservicebunny/src/pages/holidays.vue) ผ่าน [api.js](file:///Users/m/ไดรฟ์ของฉัน/adminservicebunny/src/services/api.js)

**Root Cause (สรุปสาเหตุจริง)**
- โครงสร้างตาราง holidays ไม่ตรงตามที่โค้ดคาดหวัง ทำให้ Supabase ตอบ error code 42703 (undefined column) และ Backend คืน 500

**แผนแก้ทีละขั้น**
1. รัน SQL Migration เพื่อแก้ schema: เปิด Supabase SQL Editor แล้วรันไฟล์ [20260210_fix_holidays_schema.sql](file:///Users/m/ไดรฟ์ของฉัน/adminservicebunny/supabase/migrations/20260210_fix_holidays_schema.sql) เพื่อสร้างคอลัมน์ start_date/end_date และตั้งค่า RLS/Policy ให้ครบ 
2. รีสตาร์ท Backend ที่พอร์ต 5000 เพื่อโหลด schema ใหม่
3. ทดสอบ API ด้วยคำสั่ง: 
   - GET: curl http://127.0.0.1:5000/api/holidays (ควรได้ 200 [])
   - POST: curl -X POST http://127.0.0.1:5000/api/holidays -H "Content-Type: application/json" -d '{"title":"Test","start_date":"2026-01-01","end_date":"2026-01-01","type":"public"}' (ควรได้ 200 พร้อมข้อมูลที่สร้าง)
4. ปรับปรุงข้อความ error ฝั่ง Backend (ทำแล้วบางส่วนใน [holidays.js](file:///Users/m/ไดรฟ์ของฉัน/adminservicebunny/backend/src/routes/holidays.js)) ให้คืนข้อความ "Database Schema Error" เมื่อพบ 42703 เพื่อช่วย debug บนหน้าเว็บ
5. ยืนยันหน้าเว็บ [holidays.vue](file:///Users/m/ไดรฟ์ของฉัน/adminservicebunny/src/pages/holidays.vue) โหลด/สร้าง/ลบ รายการได้ปกติ

**ขออนุญาต**
- อนุญาตให้ผมดำเนินการตามแผน (รันตรวจสอบ/รีสตาร์ท/ยืนยันผล) และถ้าจำเป็นจะปรับ error handling เพิ่มเติมในไฟล์ Backend ที่เกี่ยวข้อง