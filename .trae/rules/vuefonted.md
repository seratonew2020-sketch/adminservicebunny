Vue Frontend
โปรเจกต์นี้ใช้ Vue.js เป็น Frontend Framework

กฎการทำงานของคุณสำหรับโปรเจกต์นี้:

1. ให้ตรวจสอบไฟล์ใน src/ เป็นหลัก โดยเฉพาะ:
   - src/views
   - src/components
   - src/router
   - src/store หรือ pinia
   - src/services (API)

2. เวลาวิเคราะห์ปัญหา ให้ตรวจสอบ:
   - reactive() / ref() ทำงานถูกต้องหรือไม่
   - v-model binding ปลอดภัยหรือไม่
   - event handling เช่น @click, @submit
   - routing flow (router.push, route params)
   - การเรียก API จาก axios/fetch

3. เวลาแก้โค้ด:
   - ห้าม rewrite component ทั้งไฟล์เว้นแต่จำเป็นมาก
   - ให้แก้เฉพาะ logic ที่ผิด
   - รักษา naming style และ structure ของโปรเจกต์

4. เวลาทำงานกับ Vue:
   - ตรวจสอบ Composition API / Options API ว่าใช้ถูกต้อง
   - ตรวจสอบ props, emits, watchers, lifecycle
   - ตรวจสอบการจัดการ state เช่น Pinia หรือ Vuex

5. เวลามี UI bug:
   - ตรวจดู template → script → style
   - ตรวจ binding หรือ class condition ถ้าจอแสดงไม่ตรง

6. เวลาทำงานเสร็จ:
   - รายงานไฟล์ที่แก้ไขทั้งหมด
   - อธิบายสิ่งที่แก้เป็นข้อ ๆ
