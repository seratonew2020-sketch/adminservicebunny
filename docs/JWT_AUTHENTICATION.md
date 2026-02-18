# JWT Authentication System - Complete Guide

## 📋 Overview

This document provides comprehensive documentation for the JWT authentication system integrated with Supabase in the AdminServiceBunny project.

## 🎯 Features

- ✅ **JWT Token Authentication** - Secure token-based authentication
- ✅ **Role-Based Access Control (RBAC)** - Admin, Manager, User roles
- ✅ **Refresh Token Support** - Automatic token refresh
- ✅ **HttpOnly Cookies** - Secure token storage
- ✅ **Rate Limiting** - Protection against brute force attacks
- ✅ **Input Validation** - Comprehensive request validation
- ✅ **Security Headers** - Helmet.js integration
- ✅ **XSS Protection** - Input sanitization
- ✅ **CORS Configuration** - Secure cross-origin requests

## 📦 Installed Packages

```json
{
  "jsonwebtoken": "^9.0.3",
  "bcrypt": "^6.0.0",
  "cookie-parser": "^1.4.6",
  "express-validator": "^7.0.1",
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.5"
}
```

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│         Client (Vue 3)              │
│  - Stores tokens in httpOnly cookies│
│  - Sends Authorization header       │
└─────────────────────────────────────┘
              ↕ HTTPS
┌─────────────────────────────────────┐
│      Middleware Layer               │
│  - Security (Helmet, CORS)          │
│  - Rate Limiting                    │
│  - Input Validation                 │
│  - Authentication                   │
│  - Authorization                    │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│      Auth Routes                    │
│  - /api/auth/login                  │
│  - /api/auth/register               │
│  - /api/auth/logout                 │
│  - /api/auth/refresh                │
│  - /api/auth/me                     │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│      Supabase Auth                  │
│  - User Management                  │
│  - Token Generation                 │
│  - Session Management               │
└─────────────────────────────────────┘
```

## 🔐 Security Features

### 1. **Helmet Security Headers**
```javascript
const helmetConfig = helmet({
  contentSecurityPolicy: { ... },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
});
```

### 2. **Rate Limiting**

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| General API | 100 requests | 15 minutes |
| Authentication | 5 requests | 15 minutes |
| Modifications | 30 requests | 15 minutes |
| Sensitive Ops | 3 requests | 1 hour |

### 3. **Input Validation**
All inputs are validated using `express-validator`:
- Email format validation
- Password strength requirements
- SQL injection prevention
- XSS attack prevention

### 4. **Token Security**
- **Access Token**: 1 hour expiry, httpOnly cookie
- **Refresh Token**: 7 days expiry, httpOnly cookie
- **Secure flag**: Enabled in production
- **SameSite**: Strict mode

## 🚀 API Endpoints

### **POST /api/auth/login**
Login user and receive JWT tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "status": "OK",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user"
    },
    "session": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_at": 1234567890
    }
  }
}
```

**Cookies Set:**
- `access_token` (httpOnly, secure, sameSite=strict)
- `refresh_token` (httpOnly, secure, sameSite=strict)

---

### **POST /api/auth/register**
Register a new user.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "user"
}
```

**Response:**
```json
{
  "status": "OK",
  "data": {
    "user": {
      "id": "uuid",
      "email": "newuser@example.com",
      "first_name": "Jane",
      "last_name": "Smith",
      "role": "user"
    },
    "message": "User registered successfully"
  }
}
```

---

### **POST /api/auth/logout**
Logout user and clear tokens.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "status": "OK",
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### **POST /api/auth/refresh**
Refresh access token using refresh token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
*Or automatically from httpOnly cookie*

**Response:**
```json
{
  "status": "OK",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": 1234567890
  }
}
```

---

### **GET /api/auth/me**
Get current user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "status": "OK",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "admin",
      "department_id": 5,
      "employee_id": 123,
      "created_at": "2026-01-01T00:00:00Z"
    }
  }
}
```

---

### **PUT /api/auth/change-password**
Change user password.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "current_password": "OldPass123",
  "new_password": "NewSecurePass456"
}
```

**Response:**
```json
{
  "status": "OK",
  "data": {
    "message": "Password changed successfully"
  }
}
```

## 🛡️ Middleware Usage

### **Protect Routes with Authentication**
```javascript
const { authenticateToken } = require('../middleware/auth');

router.get('/protected', authenticateToken, (req, res) => {
  // req.user, req.userId, req.userEmail are available
  res.json({ message: 'Protected data', user: req.user });
});
```

### **Role-Based Authorization**
```javascript
const { authenticateToken, requireRole } = require('../middleware/auth');

// Admin only
router.delete('/users/:id',
  authenticateToken,
  requireRole(['admin']),
  deleteUser
);

// Admin or Manager
router.get('/reports',
  authenticateToken,
  requireRole(['admin', 'manager']),
  getReports
);
```

### **Resource Ownership Check**
```javascript
const { authenticateToken, requireOwnership } = require('../middleware/auth');

router.put('/profile/:id',
  authenticateToken,
  requireOwnership(async (req) => req.params.id),
  updateProfile
);
```

### **Input Validation**
```javascript
const { validateEmployee } = require('../middleware/validation');

router.post('/employees',
  authenticateToken,
  validateEmployee,
  createEmployee
);
```

### **Rate Limiting**
```javascript
const { authLimiter, modificationLimiter } = require('../middleware/security');

// Strict rate limiting for login
router.post('/login', authLimiter, loginHandler);

// Moderate rate limiting for data changes
router.post('/employees', modificationLimiter, createEmployee);
```

## 🔧 Server Setup

Update your `server.js` or `app.js`:

```javascript
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const {
  helmetConfig,
  corsOptions,
  sanitizeInput,
  requestLogger,
  errorHandler,
  notFoundHandler
} = require('./src/middleware/security');

const authRoutes = require('./src/routes/auth');

const app = express();

// Security middleware
app.use(helmetConfig);
app.use(cors(corsOptions));
app.use(cookieParser());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom middleware
app.use(sanitizeInput);
app.use(requestLogger);

// Routes
app.use('/api/auth', authRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## 🎨 Frontend Integration

### **Vue 3 Composable**
```javascript
// src/composables/useAuth.js
import { ref } from 'vue';
import axios from 'axios';

export function useAuth() {
  const user = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const login = async (email, password) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      }, {
        withCredentials: true // Important for cookies
      });

      user.value = response.data.data.user;

      // Store access token in localStorage as backup
      localStorage.setItem('access_token', response.data.data.session.access_token);

      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error?.message || 'Login failed';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, {
        withCredentials: true
      });

      user.value = null;
      localStorage.removeItem('access_token');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const getCurrentUser = async () => {
    try {
      const response = await axios.get('/api/auth/me', {
        withCredentials: true
      });

      user.value = response.data.data.user;
      return user.value;
    } catch (err) {
      console.error('Get user error:', err);
      return null;
    }
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    getCurrentUser
  };
}
```

### **Axios Interceptor**
```javascript
// src/lib/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post('/api/auth/refresh', {}, {
          withCredentials: true
        });

        const newToken = response.data.data.access_token;
        localStorage.setItem('access_token', newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

## 🧪 Testing

### **Test Login Endpoint**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }' \
  -c cookies.txt
```

### **Test Protected Endpoint**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -b cookies.txt
```

### **Test Token Refresh**
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

## 🐛 Troubleshooting

### **Issue: CORS errors**
**Solution:** Ensure `withCredentials: true` in axios and proper CORS configuration:
```javascript
credentials: true,
origin: 'http://localhost:5173'
```

### **Issue: Cookies not being set**
**Solution:** Check:
- `cookieParser()` middleware is installed
- `secure` flag is false in development
- Browser allows third-party cookies

### **Issue: Token expired**
**Solution:** Implement automatic token refresh in axios interceptor

### **Issue: Rate limit exceeded**
**Solution:** Wait for the rate limit window to reset or increase limits in development

## 📚 Best Practices

1. **Never store sensitive data in JWT payload**
2. **Always use HTTPS in production**
3. **Rotate refresh tokens regularly**
4. **Implement token blacklisting for logout**
5. **Use short expiry times for access tokens**
6. **Log all authentication attempts**
7. **Implement account lockout after failed attempts**
8. **Use strong password requirements**
9. **Enable 2FA for admin accounts**
10. **Regular security audits**

## 🔄 Migration from Supabase Auth Only

If you're migrating from Supabase-only auth:

1. Keep Supabase for user management
2. Add JWT middleware for API protection
3. Update frontend to use new auth endpoints
4. Implement token refresh logic
5. Add role-based access control
6. Test thoroughly before deployment

## 📊 Security Checklist

- [ ] Helmet security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] XSS protection implemented
- [ ] CORS properly configured
- [ ] Tokens stored in httpOnly cookies
- [ ] Token refresh mechanism working
- [ ] Role-based access control implemented
- [ ] Audit logging enabled
- [ ] HTTPS enforced in production

---

**Last Updated**: 2026-02-17
**Version**: 1.0.0
**Maintained by**: AdminServiceBunny Team 🐰
