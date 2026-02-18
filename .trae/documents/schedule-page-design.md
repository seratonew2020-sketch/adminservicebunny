# Page Design Spec: /schedule

## Global Styles (ใช้ร่วมทั้งหน้า)
- Design tokens (Desktop-first):
  - Background: #0B1220 (หรือพื้นสว่าง #F7F8FA หากธีมเดิมเป็น light)
  - Surface/Card: #111A2E / #FFFFFF
  - Text primary: #E8EEF9 / #111827
  - Text secondary: #A7B0C0 / #6B7280
  - Accent (primary action): #3B82F6
  - Border/divider: rgba(148,163,184,0.25)
  - Radius: 10px (card), 8px (input/button)
  - Shadow: subtle (ยกเฉพาะ card/toolbar)
- Typography:
  - H1 22–24px/700, H2 16–18px/600, Body 14–15px/400, Caption 12px/400
  - ตัวเลข/วันที่ใช้ tabular-nums เพื่ออ่านตารางง่าย
- Buttons/Inputs:
  - Primary: เติมสี accent, hover เข้มขึ้น 6–8%
  - Secondary: เส้นขอบ + hover เปลี่ยนพื้นหลังบาง ๆ
  - Input focus: ring 2px สี accent (คอนทราสต์ชัด)
- Table readability:
  - Zebra rows, sticky header, sticky first column (ชื่อพนักงาน)
  - ช่องวันมีความกว้างคงที่ + เว้นระยะให้เลื่อนแนวนอนได้

## Meta Information
- Title: ตารางการลาหยุดพนักงาน | Schedule
- Description: ตารางลาหยุดแบบอ่านง่าย พร้อมกรอง ค้นหา เรียง สรุปสถิติ และรีเฟรชอัตโนมัติ
- Open Graph:
  - og:title = ตารางการลาหยุดพนักงาน
  - og:description = ดูภาพรวมการลาหยุด พร้อมตัวกรองและสถิติ

## Layout
- ใช้ Hybrid: CSS Grid (โครงหน้า) + Flexbox (ภายในแถบควบคุม)
- Desktop (>=1200px):
  - Grid 12 คอลัมน์
  - แถวบน: Header + Actions (เต็มกว้าง)
  - แถวสอง: Control Bar (เต็มกว้าง)
  - แถวสาม: Stats Cards (3–6 การ์ด)
  - แถวหลัก: ตาราง (เต็มกว้าง) พร้อม sticky header
- Responsive:
  - Tablet: แถบควบคุมห่อบรรทัด (wrap), การ์ดสถิติเป็น 2 คอลัมน์
  - Mobile: คุมความกว้างตารางด้วย horizontal scroll, ลดรายละเอียดคอลัมน์รอง, search เป็นเต็มบรรทัด

## Page Structure
1) Top App Bar
2) Schedule Control Bar (ช่วงเวลา/มุมมอง/ค้นหา/ตัวกรอง/เรียง/รีเฟรช)
3) Stats Summary Row
4) Main Schedule Table Area
5) Footer/Status Area (อัปเดตล่าสุด, สถานะการรีเฟรช, ข้อความผิดพลาด)

## Sections & Components

### 1) Top App Bar
- Left: ชื่อหน้า “Schedule: ตารางการลาหยุด” + ช่วงวันที่ปัจจุบัน (อ่านง่าย)
- Right: ปุ่ม “รีเฟรชทันที” + ตัวบอก “อัปเดตล่าสุดเมื่อ …”
- Behavior: sticky top; เมื่อกำลังโหลดให้แสดง spinner เล็กข้างเวลาอัปเดต

### 2) Schedule Control Bar
- Layout: Flex row + wrap; ระยะห่าง 8–12px
- Components:
  - Date Range Picker: start/end (หรือเลือกสัปดาห์/เดือน) + ปุ่ม “วันนี้”
  - View Switch: segmented control [วัน | สัปดาห์ | เดือน]
  - Search Input: placeholder “ค้นหาชื่อ/รหัสพนักงาน” + ปุ่มล้าง (x)
  - Filters (dropdown/multi-select ตามของเดิม):
    - หน่วยงาน/ทีม (dept)
    - ประเภทการลา (leaveType)
    - สถานะ (status)
    - ปุ่ม “ล้างตัวกรอง” (disable ถ้าไม่มีการเลือก)
  - Sort Control:
    - sortBy (ชื่อ, จำนวนวันลา, วันที่เริ่ม)
    - sortDir toggle (asc/desc)
  - Auto Refresh:
    - toggle เปิด/ปิด
    - interval select (เช่น 15s/30s/60s) หรือค่า default
- Interaction states:
  - เมื่อเปลี่ยน filter/search/sort ให้ trigger โหลดข้อมูลใหม่ และ reset scroll ตารางไปตำแหน่งเหมาะสม

### 3) Stats Summary Row
- Card grid 3–6 ใบ (ขึ้นกับข้อมูลที่มี):
  - “พนักงานที่ลาหยุด (ไม่ซ้ำ)”
  - “จำนวนวันลารวมในช่วง”
  - “ตามประเภทการลา” (mini list/stacked bar แบบเรียบ)
  - “ตามสถานะ”
- Behavior: สถิติเปลี่ยนตามตัวกรอง/คำค้น/ช่วงเวลาเดียวกับตาราง

### 4) Main Schedule Table Area
- Container:
  - มี min-height และ scroll ภายใน (เพื่อให้ header stick ได้)
  - แสดง skeleton rows ขณะโหลด
- Table format (อ่านง่าย):
  - Column 1 (sticky): ชื่อพนักงาน + รหัส + หน่วยงาน (ถ้ามี)
  - Columns ถัดไป: วันในช่วง (หรือช่องตามมุมมอง)
  - Cell rendering:
    - ถ้ามีการลา: แสดง “chip” สีตามประเภทการลา + สถานะ (เช่น เส้นขอบ/ไอคอนเล็ก)
    - ถ้าไม่มี: เว้นว่าง/พื้นจาง
- Legend:
  - แสดงมุมขวาบนของตารางหรือใต้ control bar: สี/ประเภท/สถานะ
- Sorting indicator:
  - แสดง caret บนหัวคอลัมน์ที่ถูกเรียง (ถ้าใช้การเรียงแบบหัวคอลัมน์)

### 5) Footer/Status Area
- Left: ข้อความสถานะ (เช่น “แสดงผล X รายการ”) และ empty state เมื่อไม่มีข้อมูล
- Right: สถานะรีเฟรชอัตโนมัติ (เปิด/ปิด) + เวลาอัปเดตล่าสุด
- Error state:
  - แสดงข้อความสั้น + ปุ่ม “ลองอีกครั้ง” และคงตัวกรองเดิมไว้

## Accessibility & Usability
- คอนทราสต์สีผ่านเกณฑ์อ่านง่าย; สีสถานะต้องมีทั้ง “สี + ข้อความ/สัญลักษณ์”
- Keyboard navigation: tab ไปยัง search/filter/sort ได้ครบ
- ARIA labels: date range, search, toggle auto-refresh, table cells ที่มีสถานะ
- Performance UX: ใช้ debounce กับ search (เช่น 300ms) และแสดง “กำลังอัปเดต…” แทนการกระพริบทั้ง