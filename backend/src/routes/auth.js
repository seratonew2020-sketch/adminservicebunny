/**
 * Authentication Routes
 * Handles user authentication, registration, and session management
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { validateLogin, validateRegistration } = require('../middleware/validation');
const { authLimiter } = require('../middleware/security');
const { authenticateToken } = require('../middleware/auth');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT tokens
 * @access  Public
 */
router.post('/login', authLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        status: 'ERROR',
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    const { user, session } = data;

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, department_id, employee_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    // Set httpOnly cookies for tokens
    res.cookie('access_token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    });

    res.cookie('refresh_token', session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 604800000 // 7 days
    });

    res.json({
      status: 'OK',
      data: {
        user: {
          id: user.id,
          email: user.email,
          ...profile
        },
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: {
        message: 'Login failed',
        code: 'LOGIN_FAILED'
      }
    });
  }
});

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public (or Admin only - uncomment authenticateToken)
 */
router.post('/register', authLimiter, validateRegistration, async (req, res) => {
  try {
    const { email, password, first_name, last_name, role = 'user' } = req.body;

    // Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm email in development
    });

    if (authError) {
      return res.status(400).json({
        status: 'ERROR',
        error: {
          message: authError.message,
          code: 'REGISTRATION_FAILED'
        }
      });
    }

    const { user } = authData;

    // Create user profile in database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email,
        first_name,
        last_name,
        role
      })
      .select()
      .single();

    if (profileError) {
      // Rollback: delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(user.id);

      return res.status(500).json({
        status: 'ERROR',
        error: {
          message: 'Failed to create user profile',
          code: 'PROFILE_CREATION_FAILED'
        }
      });
    }

    res.status(201).json({
      status: 'OK',
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name,
          last_name,
          role
        },
        message: 'User registered successfully'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: {
        message: 'Registration failed',
        code: 'REGISTRATION_ERROR'
      }
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear tokens
 * @access  Private
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Get token from request
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Sign out from Supabase
      await supabase.auth.admin.signOut(token);
    }

    // Clear cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    res.json({
      status: 'OK',
      data: {
        message: 'Logged out successfully'
      }
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: {
        message: 'Logout failed',
        code: 'LOGOUT_FAILED'
      }
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({
        status: 'ERROR',
        error: {
          message: 'Refresh token required',
          code: 'NO_REFRESH_TOKEN'
        }
      });
    }

    // Refresh session with Supabase
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error || !data.session) {
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      return res.status(401).json({
        status: 'ERROR',
        error: {
          message: 'Invalid or expired refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        }
      });
    }

    const { session } = data;

    // Set new cookies
    res.cookie('access_token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    });

    res.cookie('refresh_token', session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 604800000 // 7 days
    });

    res.json({
      status: 'OK',
      data: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: {
        message: 'Token refresh failed',
        code: 'REFRESH_FAILED'
      }
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, department_id, employee_id, created_at')
      .eq('id', req.userId)
      .single();

    if (error) {
      return res.status(404).json({
        status: 'ERROR',
        error: {
          message: 'User profile not found',
          code: 'PROFILE_NOT_FOUND'
        }
      });
    }

    res.json({
      status: 'OK',
      data: {
        user: profile
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: {
        message: 'Failed to fetch user profile',
        code: 'PROFILE_FETCH_FAILED'
      }
    });
  }
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        status: 'ERROR',
        error: {
          message: 'Current password and new password are required',
          code: 'MISSING_PASSWORDS'
        }
      });
    }

    if (new_password.length < 8) {
      return res.status(400).json({
        status: 'ERROR',
        error: {
          message: 'New password must be at least 8 characters',
          code: 'WEAK_PASSWORD'
        }
      });
    }

    // Update password in Supabase
    const { error } = await supabase.auth.admin.updateUserById(
      req.userId,
      { password: new_password }
    );

    if (error) {
      return res.status(400).json({
        status: 'ERROR',
        error: {
          message: 'Failed to change password',
          code: 'PASSWORD_CHANGE_FAILED'
        }
      });
    }

    res.json({
      status: 'OK',
      data: {
        message: 'Password changed successfully'
      }
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: {
        message: 'Password change failed',
        code: 'PASSWORD_CHANGE_ERROR'
      }
    });
  }
});

module.exports = router;
