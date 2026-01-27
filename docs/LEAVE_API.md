# Leave Management API Documentation

## Base URL
```
http://localhost:3000/api
```

## Endpoints

### 1. Get All Leaves
**GET** `/leaves`

Get all leave requests with optional filters.

**Query Parameters:**
- `employee_id` (optional): Filter by employee ID
- `status` (optional): Filter by status (`pending`, `approved`, `rejected`)
- `start_date` (optional): Filter by start date (YYYY-MM-DD)
- `end_date` (optional): Filter by end date (YYYY-MM-DD)

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/leaves?status=pending"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "employee_id": "EMP001",
      "leave_type": "sick",
      "start_date": "2026-01-27",
      "end_date": "2026-01-28",
      "days": 2,
      "reason": "Medical appointment",
      "status": "pending",
      "approved_by": null,
      "approved_at": null,
      "created_at": "2026-01-26T06:00:00Z",
      "updated_at": "2026-01-26T06:00:00Z",
      "employees": {
        "id": "uuid",
        "name": "John Doe",
        "department": "IT",
        "position": "Developer"
      }
    }
  ],
  "count": 1
}
```

---

### 2. Get Leave by ID
**GET** `/leaves/:id`

Get detailed information about a specific leave request.

**Path Parameters:**
- `id` (required): Leave ID

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/leaves/uuid-here"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employee_id": "EMP001",
    "leave_type": "annual",
    "start_date": "2026-02-01",
    "end_date": "2026-02-05",
    "days": 5,
    "reason": "Family vacation",
    "status": "approved",
    "approved_by": "MGR001",
    "approved_at": "2026-01-26T08:00:00Z",
    "created_at": "2026-01-25T10:00:00Z",
    "updated_at": "2026-01-26T08:00:00Z",
    "employees": {
      "id": "uuid",
      "name": "John Doe",
      "department": "IT",
      "position": "Developer",
      "email": "john@example.com"
    }
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Leave not found"
}
```

---

### 3. Create Leave Request
**POST** `/leaves`

Create a new leave request.

**Request Body:**
```json
{
  "employee_id": "EMP001",
  "leave_type": "sick",
  "start_date": "2026-01-27",
  "end_date": "2026-01-28",
  "reason": "Medical appointment",
  "status": "pending"
}
```

**Required Fields:**
- `employee_id`: Employee ID
- `leave_type`: Type of leave (`annual`, `sick`, `personal`, `maternity`, `paternity`, etc.)
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)

**Optional Fields:**
- `reason`: Reason for leave
- `status`: Initial status (defaults to `pending`)

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/leaves" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "EMP001",
    "leave_type": "sick",
    "start_date": "2026-01-27",
    "end_date": "2026-01-28",
    "reason": "Medical appointment"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employee_id": "EMP001",
    "leave_type": "sick",
    "start_date": "2026-01-27",
    "end_date": "2026-01-28",
    "days": 2,
    "reason": "Medical appointment",
    "status": "pending",
    "approved_by": null,
    "approved_at": null,
    "created_at": "2026-01-26T06:00:00Z",
    "updated_at": "2026-01-26T06:00:00Z"
  },
  "message": "Leave request created successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Missing required fields: employee_id, leave_type"
}
```

---

### 4. Update Leave Request
**PUT** `/leaves/:id`

Update an existing leave request.

**Path Parameters:**
- `id` (required): Leave ID

**Request Body (all fields optional):**
```json
{
  "leave_type": "annual",
  "start_date": "2026-02-01",
  "end_date": "2026-02-05",
  "reason": "Updated reason",
  "status": "pending"
}
```

**Example Request:**
```bash
curl -X PUT "http://localhost:3000/api/leaves/uuid-here" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Updated medical appointment details"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employee_id": "EMP001",
    "leave_type": "sick",
    "start_date": "2026-01-27",
    "end_date": "2026-01-28",
    "days": 2,
    "reason": "Updated medical appointment details",
    "status": "pending",
    "updated_at": "2026-01-26T07:00:00Z"
  },
  "message": "Leave updated successfully"
}
```

---

### 5. Approve/Reject Leave
**PATCH** `/leaves/:id/approve`

Approve or reject a leave request.

**Path Parameters:**
- `id` (required): Leave ID

**Request Body:**
```json
{
  "status": "approved",
  "approved_by": "MGR001",
  "remarks": "Approved with conditions"
}
```

**Required Fields:**
- `status`: Must be either `approved` or `rejected`
- `approved_by`: ID of the approver

**Optional Fields:**
- `remarks`: Additional comments

**Example Request:**
```bash
curl -X PATCH "http://localhost:3000/api/leaves/uuid-here/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "approved_by": "MGR001",
    "remarks": "Approved"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employee_id": "EMP001",
    "leave_type": "sick",
    "start_date": "2026-01-27",
    "end_date": "2026-01-28",
    "days": 2,
    "status": "approved",
    "approved_by": "MGR001",
    "approved_at": "2026-01-26T08:00:00Z",
    "remarks": "Approved",
    "updated_at": "2026-01-26T08:00:00Z"
  },
  "message": "Leave approved successfully"
}
```

---

### 6. Delete Leave Request
**DELETE** `/leaves/:id`

Delete a leave request.

**Path Parameters:**
- `id` (required): Leave ID

**Example Request:**
```bash
curl -X DELETE "http://localhost:3000/api/leaves/uuid-here"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Leave deleted successfully"
}
```

---

### 7. Get Leave Statistics
**GET** `/leaves/statistics/:employeeId`

Get leave statistics for a specific employee.

**Path Parameters:**
- `employeeId` (required): Employee ID

**Query Parameters:**
- `year` (optional): Year for statistics (defaults to current year)

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/leaves/statistics/EMP001?year=2026"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total_leaves": 5,
    "approved_leaves": 3,
    "pending_leaves": 1,
    "rejected_leaves": 1,
    "total_days": 12,
    "by_type": {
      "annual": {
        "count": 2,
        "days": 7
      },
      "sick": {
        "count": 2,
        "days": 3
      },
      "personal": {
        "count": 1,
        "days": 2
      }
    }
  },
  "year": 2026
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Missing required fields: employee_id"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Leave not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Database connection failed"
}
```

---

## Leave Types
Common leave types supported:
- `annual` - Annual Leave
- `sick` - Sick Leave
- `personal` - Personal Leave
- `maternity` - Maternity Leave
- `paternity` - Paternity Leave
- `unpaid` - Unpaid Leave
- `compensatory` - Compensatory Leave

## Leave Status
- `pending` - Awaiting approval
- `approved` - Approved by manager
- `rejected` - Rejected by manager

---

## Database Schema

```sql
CREATE TABLE leaves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id),
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
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Testing with cURL

### Create a leave request
```bash
curl -X POST "http://localhost:3000/api/leaves" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "EMP001",
    "leave_type": "annual",
    "start_date": "2026-02-01",
    "end_date": "2026-02-05",
    "reason": "Family vacation"
  }'
```

### Get all pending leaves
```bash
curl -X GET "http://localhost:3000/api/leaves?status=pending"
```

### Approve a leave
```bash
curl -X PATCH "http://localhost:3000/api/leaves/{leave_id}/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "approved_by": "MGR001"
  }'
```
