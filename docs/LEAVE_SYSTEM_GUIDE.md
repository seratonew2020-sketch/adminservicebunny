# 🎯 Leave Management System - Quick Start Guide

## ✅ สิ่งที่เสร็จสมบูรณ์แล้ว

### Backend API (Fastify + RESTful)
- ✅ **Leave Service** (`services/leaveService.js`)
  - Business logic สำหรับจัดการการลา
  - CRUD operations พร้อม validation
  - Leave statistics calculation
  - Error handling ครบถ้วน

- ✅ **Leave Routes** (`routes/leaves.js`)
  - RESTful API endpoints
  - HTTP status codes ที่ถูกต้อง
  - Request validation
  - Comprehensive error responses

- ✅ **Server Integration** (`server.js`)
  - Leave routes ถูก register แล้ว
  - CORS configuration
  - Health check endpoints

### Documentation
- ✅ **API Documentation** (`docs/LEAVE_API.md`)
  - ทุก endpoint พร้อมตัวอย่าง
  - Request/Response formats
  - Error handling guide
  - cURL examples

- ✅ **Backend Structure** (`docs/BACKEND_STRUCTURE.md`)
  - Architecture overview
  - Security best practices
  - Performance optimization
  - Troubleshooting guide

- ✅ **Database Migration** (`docs/migrations/create_leaves_table.sql`)
  - Table schema
  - Indexes for performance
  - Triggers for auto-update
  - RLS policy examples

---

## 🚀 การเริ่มต้นใช้งาน

### 1. สร้างตาราง Leaves ใน Supabase

เข้าไปที่ Supabase Dashboard → SQL Editor และรัน:

```sql
-- Copy จาก docs/migrations/create_leaves_table.sql
-- หรือรันคำสั่งด้านล่าง

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS leaves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id VARCHAR(50) NOT NULL,
  leave_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  approved_by VARCHAR(50),
  approved_at TIMESTAMP,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_employee
    FOREIGN KEY (employee_id)
    REFERENCES employees(employee_id)
    ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_leaves_employee_id ON leaves(employee_id);
CREATE INDEX idx_leaves_status ON leaves(status);
CREATE INDEX idx_leaves_dates ON leaves(start_date, end_date);
```

### 2. ตรวจสอบ Backend Server

Server กำลังทำงานที่:
- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:5173

ทดสอบ health check:
```bash
curl http://localhost:3000/api
# Expected: {"status":"OK","message":"API Gateway is active 🛠️"}
```

### 3. ทดสอบ Leave API

#### Get All Leaves
```bash
curl http://localhost:3000/api/leaves
```

#### Create Leave Request
```bash
curl -X POST http://localhost:3000/api/leaves \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "EMP001",
    "leave_type": "annual",
    "start_date": "2026-02-01",
    "end_date": "2026-02-05",
    "reason": "Family vacation"
  }'
```

#### Get Leave by ID
```bash
curl http://localhost:3000/api/leaves/{leave_id}
```

#### Approve Leave
```bash
curl -X PATCH http://localhost:3000/api/leaves/{leave_id}/approve \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "approved_by": "MGR001",
    "remarks": "Approved"
  }'
```

#### Get Leave Statistics
```bash
curl http://localhost:3000/api/leaves/statistics/EMP001?year=2026
```

---

## 📁 โครงสร้างไฟล์ที่สร้างใหม่

```
vue3-app/
├── routes/
│   └── leaves.js                    ✅ NEW - Leave API routes
├── services/
│   └── leaveService.js              ✅ NEW - Leave business logic
├── docs/
│   ├── LEAVE_API.md                 ✅ NEW - API documentation
│   ├── BACKEND_STRUCTURE.md         ✅ NEW - Architecture guide
│   └── migrations/
│       └── create_leaves_table.sql  ✅ NEW - Database migration
└── server.js                        ✅ UPDATED - Added leave routes
```

---

## 🔧 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaves` | Get all leaves (with filters) |
| GET | `/api/leaves/:id` | Get leave by ID |
| POST | `/api/leaves` | Create leave request |
| PUT | `/api/leaves/:id` | Update leave request |
| PATCH | `/api/leaves/:id/approve` | Approve/reject leave |
| DELETE | `/api/leaves/:id` | Delete leave request |
| GET | `/api/leaves/statistics/:employeeId` | Get leave statistics |

---

## 🎨 Frontend Integration (Next Steps)

### 1. สร้าง Leave Store (Pinia)
```javascript
// src/stores/useLeaveStore.ts
import { defineStore } from 'pinia';
import axios from 'axios';

export const useLeaveStore = defineStore('leave', {
  state: () => ({
    leaves: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchLeaves(filters = {}) {
      this.loading = true;
      try {
        const response = await axios.get('/api/leaves', { params: filters });
        this.leaves = response.data.data;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    async createLeave(leaveData) {
      const response = await axios.post('/api/leaves', leaveData);
      return response.data;
    },

    async approveLeave(leaveId, approvalData) {
      const response = await axios.patch(
        `/api/leaves/${leaveId}/approve`,
        approvalData
      );
      return response.data;
    }
  }
});
```

### 2. สร้าง Leave Management Page
```vue
<!-- src/pages/leaves/index.vue -->
<template>
  <v-container>
    <v-card>
      <v-card-title>Leave Management</v-card-title>
      <v-data-table
        :items="leaves"
        :headers="headers"
        :loading="loading"
      >
        <!-- Table content -->
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup>
import { useLeaveStore } from '@/stores/useLeaveStore';

const leaveStore = useLeaveStore();
const { leaves, loading } = storeToRefs(leaveStore);

onMounted(() => {
  leaveStore.fetchLeaves();
});
</script>
```

---

## 🔐 Security Considerations

### Current Implementation
- ✅ Input validation
- ✅ Error handling
- ✅ SQL injection prevention (Supabase client)
- ✅ Environment variables for secrets

### Recommended Additions
- [ ] JWT authentication
- [ ] Role-based access control (RBAC)
- [ ] Row Level Security (RLS) policies
- [ ] Rate limiting
- [ ] Request logging

---

## 📊 Database Schema

### Leaves Table Fields
- `id` (UUID) - Primary key
- `employee_id` (VARCHAR) - Foreign key to employees
- `leave_type` (VARCHAR) - Type of leave
- `start_date` (DATE) - Leave start date
- `end_date` (DATE) - Leave end date
- `days` (INTEGER) - Number of leave days
- `reason` (TEXT) - Reason for leave
- `status` (VARCHAR) - pending/approved/rejected
- `approved_by` (VARCHAR) - Approver ID
- `approved_at` (TIMESTAMP) - Approval timestamp
- `remarks` (TEXT) - Additional comments
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

---

## 🧪 Testing Checklist

- [x] Health check endpoint works
- [ ] Create leave request
- [ ] Get all leaves
- [ ] Get leave by ID
- [ ] Update leave request
- [ ] Approve leave request
- [ ] Reject leave request
- [ ] Delete leave request
- [ ] Get leave statistics
- [ ] Filter leaves by status
- [ ] Filter leaves by employee
- [ ] Filter leaves by date range

---

## 🐛 Known Issues & Solutions

### Issue: Table 'leaves' not found
**Solution**: Run the migration script in Supabase SQL Editor

### Issue: Port 3000 already in use
**Solution**:
```bash
lsof -ti:3000 | xargs kill -9
npm run dev:all
```

### Issue: CORS errors
**Solution**: CORS is already configured in `server.js`. Check frontend axios baseURL.

---

## 📚 Additional Resources

- **API Documentation**: `docs/LEAVE_API.md`
- **Backend Structure**: `docs/BACKEND_STRUCTURE.md`
- **Migration Script**: `docs/migrations/create_leaves_table.sql`

---

## ✨ Features Implemented

### Leave Service
- ✅ CRUD operations
- ✅ Leave approval workflow
- ✅ Leave statistics calculation
- ✅ Date validation
- ✅ Automatic days calculation
- ✅ Error handling with meaningful messages

### Leave Routes
- ✅ RESTful API design
- ✅ Proper HTTP status codes
- ✅ Request validation
- ✅ Query parameter filtering
- ✅ Comprehensive error responses

### Documentation
- ✅ Complete API documentation
- ✅ cURL examples for all endpoints
- ✅ Database schema documentation
- ✅ Architecture overview
- ✅ Security best practices

---

## 🎯 Next Steps

1. **Run Migration**: สร้างตาราง `leaves` ใน Supabase
2. **Test API**: ทดสอบทุก endpoint ด้วย cURL หรือ Postman
3. **Frontend Integration**: สร้าง Leave Management UI
4. **Add Authentication**: เพิ่ม JWT authentication
5. **Implement RLS**: เพิ่ม Row Level Security policies
6. **Add Tests**: เขียน unit tests และ integration tests

---

**Status**: ✅ Backend API พร้อมใช้งาน
**Last Updated**: 2026-01-26
**Version**: 1.0.0
