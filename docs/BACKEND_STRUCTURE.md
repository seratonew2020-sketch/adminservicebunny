# Backend API Structure Documentation

## 📁 โครงสร้าง Backend

```
vue3-app/
├── server.js                 # Main Fastify server entry point
├── routes/                   # API Route handlers
│   ├── logs.js              # Attendance logs endpoints
│   ├── users.js             # User/Employee management endpoints
│   ├── report.js            # Report generation endpoints
│   ├── masterTimes.js       # Master time settings endpoints
│   └── leaves.js            # ✅ Leave management endpoints (NEW)
├── services/                 # Business Logic Layer
│   ├── userService.js       # User/Employee business logic
│   ├── reportService.js     # Report generation logic
│   └── leaveService.js      # ✅ Leave management logic (NEW)
└── docs/
    ├── LEAVE_API.md         # Leave API documentation
    └── migrations/
        └── create_leaves_table.sql  # Database migration script
```

---

## 🏗️ Architecture Pattern

### Layered Architecture (3-Tier)

```
┌─────────────────────────────────────┐
│      Routes Layer (HTTP)            │  ← Handles HTTP requests/responses
│  - Request validation               │
│  - Error handling                   │
│  - HTTP status codes                │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Services Layer (Business Logic)  │  ← Core business logic
│  - Data validation                  │
│  - Business rules                   │
│  - Data transformation              │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Database Layer (Supabase)        │  ← Data persistence
│  - PostgreSQL                       │
│  - Row Level Security (RLS)         │
│  - Real-time subscriptions          │
└─────────────────────────────────────┘
```

---

## 📋 API Endpoints Overview

### 1. **Logs API** (`/api/logs`)
- GET `/logs` - Get all attendance logs
- POST `/logs` - Create new log entry

### 2. **Users API** (`/api/users`)
- GET `/users` - Get all users
- GET `/users/:id` - Get user by ID
- POST `/users` - Create new user
- PUT `/users/:id` - Update user
- DELETE `/users/:id` - Delete user

### 3. **Reports API** (`/api/reports`)
- GET `/reports` - Generate reports
- POST `/reports/pdf` - Generate PDF report

### 4. **Master Times API** (`/api/master-times`)
- GET `/master-times` - Get time settings
- PUT `/master-times` - Update time settings

### 5. **Leaves API** (`/api/leaves`) ✅ NEW
- GET `/leaves` - Get all leaves (with filters)
- GET `/leaves/:id` - Get leave by ID
- POST `/leaves` - Create leave request
- PUT `/leaves/:id` - Update leave request
- PATCH `/leaves/:id/approve` - Approve/reject leave
- DELETE `/leaves/:id` - Delete leave request
- GET `/leaves/statistics/:employeeId` - Get leave statistics

---

## 🔧 Technology Stack

### Backend Framework
- **Fastify** - High-performance web framework
  - Fast JSON serialization
  - Schema validation
  - Plugin architecture
  - Built-in logging

### Database
- **Supabase** (PostgreSQL)
  - Real-time capabilities
  - Row Level Security (RLS)
  - Auto-generated REST API
  - Built-in authentication

### Key Libraries
- `@supabase/supabase-js` - Supabase client
- `@fastify/cors` - CORS support
- `dotenv` - Environment variables
- `nodemon` - Auto-restart during development

---

## 🔐 Security Best Practices

### 1. Environment Variables
```javascript
// ❌ BAD - Hardcoded credentials
const supabase = createClient('https://xxx.supabase.co', 'public-key');

// ✅ GOOD - Using environment variables
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);
```

### 2. Input Validation
```javascript
// ✅ Validate required fields
const requiredFields = ['employee_id', 'leave_type', 'start_date', 'end_date'];
const missingFields = requiredFields.filter(field => !leaveData[field]);

if (missingFields.length > 0) {
  throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
}
```

### 3. Error Handling
```javascript
// ✅ Proper error handling with try-catch
try {
  const result = await leaveService.createLeave(leaveData);
  return reply.code(201).send(result);
} catch (error) {
  fastify.log.error(error);
  return reply.code(500).send({
    success: false,
    error: 'Internal Server Error',
    message: error.message
  });
}
```

### 4. SQL Injection Prevention
```javascript
// ✅ Using Supabase client (parameterized queries)
const { data, error } = await supabase
  .from('leaves')
  .select('*')
  .eq('employee_id', employeeId); // Safe - parameterized

// ❌ NEVER do raw SQL with user input
// const query = `SELECT * FROM leaves WHERE employee_id = '${employeeId}'`;
```

---

## 📊 Database Schema

### Leaves Table
```sql
CREATE TABLE leaves (
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
```

---

## 🚀 Running the Backend

### Development Mode
```bash
# Run backend only
npm run dev:backend

# Run both frontend and backend
npm run dev:all
```

### Environment Setup
Create `.env` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3000
NODE_ENV=development
```

---

## 🧪 Testing APIs

### Using cURL
```bash
# Test health check
curl http://localhost:3000/

# Get all leaves
curl http://localhost:3000/api/leaves

# Create leave request
curl -X POST http://localhost:3000/api/leaves \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "EMP001",
    "leave_type": "annual",
    "start_date": "2026-02-01",
    "end_date": "2026-02-05",
    "reason": "Vacation"
  }'
```

### Using Postman/Insomnia
Import the API endpoints from `docs/LEAVE_API.md`

---

## 📈 Performance Optimization

### 1. Database Indexes
```sql
-- Indexes for faster queries
CREATE INDEX idx_leaves_employee_id ON leaves(employee_id);
CREATE INDEX idx_leaves_status ON leaves(status);
CREATE INDEX idx_leaves_dates ON leaves(start_date, end_date);
```

### 2. Query Optimization
```javascript
// ✅ Select only needed fields
.select('id, employee_id, leave_type, status')

// ✅ Use pagination
.range(0, 49) // First 50 records

// ✅ Use filters at database level
.eq('status', 'pending')
.gte('start_date', '2026-01-01')
```

### 3. Caching (Future Enhancement)
```javascript
// Consider Redis for caching frequently accessed data
// Example: Cache leave statistics
```

---

## 🔄 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error message"
}
```

### HTTP Status Codes
- `200 OK` - Successful GET/PUT/PATCH/DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Invalid input
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 📝 Next Steps

### Immediate
1. ✅ Create `leaves` table in Supabase
2. ✅ Test all Leave API endpoints
3. ✅ Verify error handling

### Future Enhancements
1. **Authentication & Authorization**
   - JWT token validation
   - Role-based access control (RBAC)
   - RLS policies in Supabase

2. **API Documentation**
   - Swagger/OpenAPI integration
   - Auto-generated API docs

3. **Testing**
   - Unit tests (Jest/Vitest)
   - Integration tests
   - E2E tests

4. **Monitoring**
   - Error tracking (Sentry)
   - Performance monitoring
   - Logging (Winston/Pino)

5. **Rate Limiting**
   - Prevent API abuse
   - `@fastify/rate-limit` plugin

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev:backend
```

### Database Connection Issues
```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Verify Supabase connection
curl https://your-project.supabase.co/rest/v1/
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Resources

- [Fastify Documentation](https://www.fastify.io/)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [REST API Best Practices](https://restfulapi.net/)

---

**Last Updated**: 2026-01-26
**Version**: 1.0.0
