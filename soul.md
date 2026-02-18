# 🐰 AdminServiceBunny - Soul

> *"The heart and philosophy of our employee management system"*

---

## 🎯 Vision

**AdminServiceBunny** is more than just an attendance tracking system—it's a comprehensive employee management platform built with care, precision, and the understanding that **people matter**.

We believe that managing employee time, attendance, and leave should be:
- **Accurate** - Every minute counts, every shift matters
- **Transparent** - Clear visibility for both managers and employees
- **Fair** - Consistent rules applied equally to everyone
- **Efficient** - Automated processes that save time and reduce errors
- **Human** - Understanding that behind every data point is a person

---

## 💡 Core Philosophy

### 1. **Production-Ready First**
We don't build prototypes. Every feature is:
- Secure by design (RLS policies, JWT authentication)
- Performance-optimized (efficient queries, proper indexing)
- Maintainable (SOLID principles, clean architecture)
- Well-tested (unit tests, integration tests, E2E tests)

### 2. **Data Integrity Above All**
- **Single Source of Truth**: Supabase PostgreSQL as our foundation
- **Audit Trails**: Every change is tracked and traceable
- **Validation Layers**: Frontend validation + Backend validation + Database constraints
- **No Silent Failures**: Explicit error handling with meaningful messages

### 3. **Developer Experience Matters**
```javascript
// We write code that reads like a story
const processAttendance = async (employeeId, dateRange) => {
  const logs = await fetchAttendanceLogs(employeeId, dateRange)
  const shifts = await getEmployeeShifts(employeeId)
  const processed = calculateWorkHours(logs, shifts)
  return enrichWithStatus(processed)
}
```

### 4. **User Experience is Non-Negotiable**
- **Intuitive UI**: Vuetify 3 with Material Design principles
- **Responsive**: Works seamlessly on desktop, tablet, and mobile
- **Internationalized**: Thai (th) and English (en) support
- **Accessible**: Semantic HTML, proper ARIA labels, keyboard navigation

---

## 🏗️ Architecture Principles

### **Layered Architecture**
```
┌─────────────────────────────────────┐
│         Frontend (Vue 3)            │
│  - Composition API                  │
│  - Pinia State Management           │
│  - Vue Router                       │
└─────────────────────────────────────┘
              ↕ HTTP/REST
┌─────────────────────────────────────┐
│      Backend (Express.js)           │
│  - Routes → Controllers → Services  │
│  - JWT Authentication               │
│  - Input Validation                 │
└─────────────────────────────────────┘
              ↕ Supabase Client
┌─────────────────────────────────────┐
│    Database (PostgreSQL/Supabase)   │
│  - Row Level Security (RLS)         │
│  - Triggers & Functions             │
│  - Proper Indexing                  │
└─────────────────────────────────────┘
```

### **Separation of Concerns**
- **Frontend**: UI/UX, state management, user interactions
- **Backend**: Business logic, validation, data transformation
- **Database**: Data persistence, integrity constraints, security policies

### **Security Layers**
1. **Authentication**: JWT tokens with secure httpOnly cookies
2. **Authorization**: Role-based access control (RBAC)
3. **Row Level Security**: Database-level access control
4. **Input Validation**: Express-validator + Frontend validation
5. **SQL Injection Prevention**: Parameterized queries only
6. **XSS Protection**: Helmet.js security headers

---

## 🎨 Design Principles

### **Code Quality Standards**

#### ✅ **DO:**
```javascript
// Clear, descriptive names
const calculateOvertimeHours = (checkIn, checkOut, shiftEnd) => {
  const workEnd = dayjs(checkOut)
  const scheduledEnd = dayjs(shiftEnd)
  return workEnd.isAfter(scheduledEnd)
    ? workEnd.diff(scheduledEnd, 'hour', true)
    : 0
}

// Proper error handling
try {
  const result = await processAttendance(employeeId, dateRange)
  return { status: 'OK', data: result }
} catch (error) {
  logger.error('Attendance processing failed', { employeeId, error })
  throw new AppError('Failed to process attendance', 500)
}
```

#### ❌ **DON'T:**
```javascript
// Vague names, no error handling
const calc = (a, b, c) => {
  return dayjs(b).diff(dayjs(c), 'h')
}

// Silent failures
const result = await db.query('SELECT * FROM users').catch(() => null)
```

### **Database Design**
- **Normalized Schema**: 3NF minimum, avoid data duplication
- **Proper Relationships**: Foreign keys with CASCADE/RESTRICT
- **Meaningful Names**: `employee_leaves` not `el`, `check_in_time` not `ci`
- **Timestamps**: `created_at`, `updated_at` on every table
- **Soft Deletes**: `deleted_at` for audit trails

### **API Design**
- **RESTful Conventions**: GET, POST, PUT, DELETE with proper status codes
- **Consistent Response Format**:
  ```json
  {
    "status": "OK" | "ERROR",
    "data": { ... },
    "error": { "message": "...", "code": "..." }
  }
  ```
- **Pagination**: `?page=1&limit=20` for list endpoints
- **Filtering**: `?status=approved&department_id=5`
- **Sorting**: `?sort_by=created_at&order=desc`

---

## 🔧 Tech Stack Rationale

### **Frontend: Vue 3 + Vite**
- **Why Vue 3?** Composition API for better code organization, excellent TypeScript support
- **Why Vite?** Lightning-fast HMR, optimized builds, modern tooling
- **Why Vuetify?** Material Design, comprehensive component library, accessibility built-in

### **Backend: Node.js + Express**
- **Why Node.js?** Same language as frontend, excellent async handling, vast ecosystem
- **Why Express?** Battle-tested, flexible, middleware-based architecture
- **Why not Python/Django?** Node.js aligns better with our frontend stack and Vercel deployment

### **Database: Supabase (PostgreSQL)**
- **Why Supabase?** PostgreSQL power + Firebase ease, built-in auth, real-time subscriptions
- **Why PostgreSQL?** ACID compliance, powerful JSON support, mature ecosystem
- **Why not MySQL?** PostgreSQL's superior JSON handling and window functions

### **State Management: Pinia**
- **Why Pinia?** Official Vue recommendation, TypeScript support, DevTools integration
- **Why not Vuex?** Pinia is simpler, more intuitive, better TypeScript support

---

## 📊 Key Features & Modules

### **1. Attendance Management**
- Real-time clock in/out tracking
- Automatic shift detection
- Overtime calculation
- Missing scan detection
- Overnight shift support

### **2. Leave Management**
- Multiple leave types (sick, annual, personal)
- Approval workflows
- Leave balance tracking
- Calendar integration
- Conflict detection

### **3. Employee Management**
- Department hierarchy
- Role-based permissions
- Shift scheduling
- Employee profiles
- Document management

### **4. Reporting & Analytics**
- Attendance reports
- Leave reports
- Department statistics
- Export to Excel/PDF
- Custom date ranges

### **5. Master Data**
- Shift times configuration
- Holiday calendar
- Department structure
- Leave policies
- Work rules

---

## 🧪 Testing Philosophy

### **Test Pyramid**
```
        /\
       /E2E\      ← Few, critical user flows
      /------\
     /  API  \    ← More, test business logic
    /--------\
   /   Unit   \   ← Many, test pure functions
  /------------\
```

### **Coverage Goals**
- **Unit Tests**: 80%+ coverage for services and utilities
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user journeys (login, clock in/out, leave approval)

### **Testing Tools**
- **Unit**: Vitest (fast, Vite-native)
- **E2E**: Playwright (cross-browser, reliable)
- **API**: Supertest or Playwright API testing

---

## 🚀 Deployment Strategy

### **Environments**
1. **Development**: Local (`localhost:5173` + `localhost:3000`)
2. **Staging**: Vercel Preview Deployments
3. **Production**: Vercel Production

### **CI/CD Pipeline**
```yaml
on: [push, pull_request]
jobs:
  - Lint (ESLint, Prettier)
  - Type Check (TypeScript)
  - Unit Tests (Vitest)
  - Build (Vite)
  - E2E Tests (Playwright)
  - Deploy (Vercel)
```

### **Zero-Downtime Deployments**
- Vercel's atomic deployments
- Database migrations run before deployment
- Rollback capability via Vercel dashboard

---

## 🌟 Best Practices We Follow

### **1. Git Workflow**
- **Branches**: `main` (production), `develop` (staging), `feature/*`, `fix/*`
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`)
- **Pull Requests**: Required reviews, automated checks must pass

### **2. Code Reviews**
- Every PR reviewed by at least one other developer
- Focus on: correctness, security, performance, maintainability
- Use GitHub suggestions for minor fixes

### **3. Documentation**
- **Code Comments**: Explain "why", not "what"
- **README**: Setup instructions, architecture overview
- **API Docs**: Endpoint descriptions, request/response examples
- **Changelogs**: Track breaking changes and migrations

### **4. Error Handling**
```javascript
// Custom error classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
  }
}

// Global error handler
app.use((err, req, res, next) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: 'ERROR',
      error: { message: err.message }
    })
  }

  // Log unexpected errors
  logger.error('Unexpected error', { err, req })
  res.status(500).json({
    status: 'ERROR',
    error: { message: 'Internal server error' }
  })
})
```

### **5. Performance Optimization**
- **Frontend**: Code splitting, lazy loading, image optimization
- **Backend**: Database query optimization, caching (Redis), rate limiting
- **Database**: Proper indexing, query analysis, connection pooling

---

## 🎓 Learning & Growth

### **Knowledge Sharing**
- Weekly tech talks
- Pair programming sessions
- Code review discussions
- Documentation contributions

### **Continuous Improvement**
- Regular retrospectives
- Performance monitoring
- User feedback integration
- Technology evaluation

---

## 🤝 Contributing Guidelines

### **Before You Code**
1. Understand the problem thoroughly
2. Check existing solutions and patterns
3. Discuss approach with the team
4. Write tests first (TDD when appropriate)

### **Code Standards**
- Follow ESLint and Prettier configurations
- Use TypeScript for type safety
- Write self-documenting code
- Add comments for complex logic

### **Pull Request Checklist**
- [ ] Tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No console.log or debugging code
- [ ] Environment variables documented
- [ ] Database migrations included (if applicable)

---

## 🐛 Debugging Philosophy

### **Root Cause Analysis (RCA)**
1. **Reproduce**: Can you consistently reproduce the bug?
2. **Isolate**: What's the minimal code that triggers it?
3. **Understand**: Why does it happen? (Not just how to fix it)
4. **Fix**: Implement the solution
5. **Prevent**: Add tests to prevent regression

### **Debugging Tools**
- **Frontend**: Vue DevTools, Browser DevTools, Network tab
- **Backend**: Node debugger, console.log (temporarily), Postman/curl
- **Database**: Supabase Dashboard, pgAdmin, query EXPLAIN ANALYZE

---

## 📈 Metrics We Care About

### **Performance**
- **Page Load**: < 2 seconds
- **API Response**: < 500ms (p95)
- **Database Queries**: < 100ms (p95)

### **Quality**
- **Test Coverage**: > 80%
- **Bug Rate**: < 5 bugs per release
- **Code Review Time**: < 24 hours

### **User Experience**
- **Uptime**: > 99.9%
- **Error Rate**: < 0.1%
- **User Satisfaction**: Measured via feedback

---

## 🌈 Future Vision

### **Short Term (3 months)**
- [ ] Mobile app (React Native or Flutter)
- [ ] Real-time notifications (WebSockets)
- [ ] Advanced analytics dashboard
- [ ] Biometric integration

### **Long Term (1 year)**
- [ ] AI-powered shift scheduling
- [ ] Predictive analytics for leave patterns
- [ ] Multi-tenant support
- [ ] API marketplace for integrations

---

## 💬 Communication Principles

### **Be Clear**
- Use precise language
- Provide context
- Share examples

### **Be Respectful**
- Assume positive intent
- Give constructive feedback
- Celebrate wins

### **Be Responsive**
- Acknowledge messages promptly
- Set expectations for response time
- Follow up on commitments

---

## 🎯 Success Criteria

We know we're successful when:
- ✅ Employees can clock in/out without issues
- ✅ Managers can approve leaves efficiently
- ✅ HR can generate accurate reports
- ✅ System runs reliably 24/7
- ✅ New features deploy without breaking existing ones
- ✅ Team members enjoy working on the codebase

---

## 🙏 Acknowledgments

This project stands on the shoulders of giants:
- **Vue.js Team** - For the amazing framework
- **Supabase Team** - For making PostgreSQL accessible
- **Vercel Team** - For seamless deployments
- **Open Source Community** - For countless libraries and tools

---

## 📜 License & Values

### **Code License**
Private/Proprietary - All rights reserved

### **Our Values**
1. **Quality over Speed** - Do it right, not just fast
2. **Security First** - Protect user data at all costs
3. **User-Centric** - Build for people, not just features
4. **Continuous Learning** - Always improving, always growing
5. **Team Collaboration** - Together we achieve more

---

**Last Updated**: 2026-02-17
**Version**: 1.0.0
**Maintained by**: AdminServiceBunny Team 🐰

---

> *"Great software is built by great teams who care about their craft."*

🐰 **AdminServiceBunny** - Where precision meets compassion in employee management.
