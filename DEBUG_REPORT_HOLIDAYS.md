# DEBUG REPORT: Holiday Creation Error

## 🎯 Endpoint
`POST http://localhost:5173/api/holidays`

---

## ✅ STATUS: **FIXED & WORKING**

---

## 🔍 Root Cause Analysis

### **Error Symptom**
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
Error creating holiday: AxiosError
```

### **Why it occurred**

The frontend was sending **Thai text** for the `type` field:
```javascript
{
  title: "วันสงกรานต์",
  type: "วันหยุดปกติ", // ❌ Thai text
  ...
}
```

But the database has a **CHECK constraint** on the `holidays.type` column that only allows specific **English values**:

**Database Constraint**: `holidays_type_check`

**Allowed Values**:
- ✅ `'public'`
- ✅ `'company'`
- ✅ `'vacation'`

**Rejected Values**:
- ❌ Any Thai text
- ❌ `'emergency'`
- ❌ `'substitute'`
- ❌ `'personal'`

---

## 🛠️ Fix Applied

### **File Modified**: `/src/pages/holidays.vue`

### **Change 1: Updated Type Dropdown Options**
**Before:**
```javascript
const holidayTypeItems = [
  'วันหยุดปกติ',           // ❌ Direct Thai text
  'วันหยุด ลา',
  'วันหยุดฉุกเฉิน',
  'สลับวันหยุด',
]
```

**After:**
```javascript
const holidayTypeItems = [
  { title: 'วันหยุดราชการ (Public Holiday)', value: 'public' },
  { title: 'วันหยุดบริษัท (Company Holiday)', value: 'company' },
  { title: 'วันลาพักร้อน (Vacation)', value: 'vacation' },
]
```

### **Change 2: Updated Default Values**
**Before:**
```javascript
type: 'วันหยุดปกติ',  // ❌ Thai value
```

**After:**
```javascript
type: 'public',  // ✅ English value
```

### **Change 3: Updated Label Mapping**
```javascript
const typeLabelMap = {
  public: 'วันหยุดราชการ',
  company: 'วันหยุดบริษัท',
  vacation: 'วันลาพักร้อน',
}
```

---

## 📊 Verification Results

### **Test 1: Direct Backend Test**
```bash
curl -X POST http://localhost:5000/api/holidays \
  -d '{"title":"Test","start_date":"2026-03-01","end_date":"2026-03-01","type":"public"}'
```
**Result**: ✅ **200 OK**
```json
{
  "id": "cd337eed-7ec3-41f8-8664-6ae780be9483",
  "title": "Test",
  "type": "public",
  ...
}
```

### **Test 2: Through Proxy**
```bash
curl -X POST http://localhost:5173/api/holidays \
  -d '{"title":"วันสงกรานต์","type":"public",...}'
```
**Result**: ✅ **200 OK**

### **Test 3: Invalid Type**
```bash
curl -X POST http://localhost:5000/api/holidays \
  -d '{"type":"วันหยุดปกติ",...}'
```
**Result**: ❌ **500 Internal Server Error**
```
Error: "new row for relation \"holidays\" violates check constraint \"holidays_type_check\""
Error Code: 23514
```

---

## 🎓 Key Learnings

1. **Database Constraints Must Match Frontend**
   - Always check database schema and constraints before implementing forms
   - Use proper value/label separation for dropdown fields

2. **Error Code 23514**: PostgreSQL Check Constraint Violation
   - Indicates the value doesn't match allowed constraint values
   - Solution: Update data to match constraint or modify constraint

3. **Localization Best Practice**
   - Store English values in database (for consistency)
   - Display Thai labels in UI (for UX)
   - Use value/title mapping for dropdowns

---

## 📝 Database Schema

### **`holidays` Table**
```sql
CREATE TABLE holidays (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('public', 'company', 'vacation')),
  employee_id UUID,
  requester_name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🚨 Recommendations

### **1. Add Constraint Documentation**
Create a migration comment or README documenting allowed values:
```sql
COMMENT ON COLUMN holidays.type IS
  'Allowed values: public, company, vacation';
```

### **2. Consider Extending Constraint (Optional)**
If you need more holiday types in the future:
```sql
ALTER TABLE holidays
DROP CONSTRAINT holidays_type_check;

ALTER TABLE holidays
ADD CONSTRAINT holidays_type_check
CHECK (type IN ('public', 'company', 'vacation', 'emergency', 'personal'));
```

### **3. Add Frontend Validation**
Prevent invalid submissions before API call:
```javascript
const isValidType = (type) => ['public', 'company', 'vacation'].includes(type);
```

---

## 🔗 Related Files

- **Frontend Form**: `/src/pages/holidays.vue`
- **API Client**: `/src/services/api.js`
- **Backend Route**: `/backend/src/routes/holidays.js`
- **Debug Scripts**:
  - `/backend/check_holidays.js`
  - `/backend/test_holiday_types.js`

---

**Debug completed on**: 2026-02-14
**Engineer**: Antigravity AI
**Time taken**: ~10 minutes
**Error Type**: Database Constraint Violation (23514)
