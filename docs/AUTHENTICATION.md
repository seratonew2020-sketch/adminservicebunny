# Authentication System Documentation

This document describes the implementation, usage, and security aspects of the Supabase Authentication system integrated into the Vue 3 application.

## 1. System Overview

The system uses [Supabase Authentication](https://supabase.com/docs/guides/auth) to handle user identity and session management. It consists of:
- **Client**: Configured in `src/lib/supabase.ts` using `@supabase/supabase-js`.
- **State Management**: A Pinia store (`src/stores/auth.ts`) manages user state (`user`, `session`) and actions (`signIn`, `signOut`).
- **UI**: A Login page (`src/pages/login.vue`) with input validation.
- **Security**: Global Route Guards prevent unauthorized access to protected routes.

## 2. Installation & Setup

### Requirements
- Node.js (v20+)
- A Supabase Project

### Steps
1. **Install Dependencies**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Environment Configuration**
   Create or update your `.env` file with your Supabase credentials. **NEVER commit this file to version control.**
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## 3. Usage Guide

### Login Flow
The application automatically redirects unauthenticated users to `/login`.
1. User enters Email and Password.
2. System validates input format.
3. System authenticates against Supabase.
4. On success, user is redirected to the Dashboard.
5. On failure, an error message is displayed.

### Code Example: Using Auth in a Component

```vue
<script setup>
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const auth = useAuthStore()
const { user } = storeToRefs(auth)

const logout = async () => {
  await auth.signOut()
}
</script>

<template>
  <div v-if="user">
    <p>Welcome, {{ user.email }}</p>
    <button @click="logout">Sign Out</button>
  </div>
</template>
```

### Testing
Run unit tests to verify authentication logic:
```bash
npm run test:unit
```
(Ensure you have the `test:unit` script configured in `package.json` to run `vitest`)

## 4. Security Best Practices

- **Token Management**: Supabase automatically handles token storage (typically in localStorage/cookies) and refreshing. Do not manually manipulate tokens unless necessary.
- **Route Protection**: Always use the router guard in `src/router/index.ts` to protect sensitive routes.
- **Row Level Security (RLS)**: Enforce security rules in your Supabase Database to reject unauthorized database operations, even if the client-side code is bypassed.
- **HTTPS**: Always serve your application over HTTPS in production to encrypt credentials during transmission.

## 5. Troubleshooting

- **Login Failed**: Check your internet connection and verify credentials in the Supabase Dashboard.
- **Session not persisting**: Ensure your browser is not blocking cookies/storage for localhost or your domain.
