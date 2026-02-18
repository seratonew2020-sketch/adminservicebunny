/**
 * JWT Authentication Middleware
 * Handles token verification and user authentication
 */

const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Verify JWT token from Authorization header or cookies
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header or cookies
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    const cookieToken = req.cookies?.access_token;

    const finalToken = token || cookieToken;

    if (!finalToken) {
      return res.status(401).json({
        status: 'ERROR',
        error: {
          message: 'Access token required',
          code: 'NO_TOKEN'
        }
      });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(finalToken);

    if (error || !user) {
      return res.status(403).json({
        status: 'ERROR',
        error: {
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        }
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = user.id;
    req.userEmail = user.email;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({
      status: 'ERROR',
      error: {
        message: 'Token verification failed',
        code: 'AUTH_FAILED'
      }
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for endpoints that work differently for authenticated users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const cookieToken = req.cookies?.access_token;

    const finalToken = token || cookieToken;

    if (finalToken) {
      const { data: { user }, error } = await supabase.auth.getUser(finalToken);

      if (!error && user) {
        req.user = user;
        req.userId = user.id;
        req.userEmail = user.email;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Role-based authorization middleware
 * @param {Array<string>} allowedRoles - Array of allowed roles
 */
const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'ERROR',
          error: {
            message: 'Authentication required',
            code: 'AUTH_REQUIRED'
          }
        });
      }

      // Get user metadata from Supabase
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', req.userId)
        .single();

      if (error || !userData) {
        return res.status(403).json({
          status: 'ERROR',
          error: {
            message: 'User role not found',
            code: 'ROLE_NOT_FOUND'
          }
        });
      }

      const userRole = userData.role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          status: 'ERROR',
          error: {
            message: 'Insufficient permissions',
            code: 'FORBIDDEN',
            required: allowedRoles,
            current: userRole
          }
        });
      }

      req.userRole = userRole;
      next();
    } catch (error) {
      console.error('Role verification error:', error);
      return res.status(500).json({
        status: 'ERROR',
        error: {
          message: 'Authorization check failed',
          code: 'AUTH_CHECK_FAILED'
        }
      });
    }
  };
};

/**
 * Check if user owns the resource
 * @param {Function} getResourceOwnerId - Function to get owner ID from request
 */
const requireOwnership = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'ERROR',
          error: {
            message: 'Authentication required',
            code: 'AUTH_REQUIRED'
          }
        });
      }

      const resourceOwnerId = await getResourceOwnerId(req);

      if (resourceOwnerId !== req.userId) {
        return res.status(403).json({
          status: 'ERROR',
          error: {
            message: 'You do not have permission to access this resource',
            code: 'NOT_OWNER'
          }
        });
      }

      next();
    } catch (error) {
      console.error('Ownership verification error:', error);
      return res.status(500).json({
        status: 'ERROR',
        error: {
          message: 'Ownership check failed',
          code: 'OWNERSHIP_CHECK_FAILED'
        }
      });
    }
  };
};

/**
 * Refresh token middleware
 * Automatically refreshes expired tokens
 */
const refreshTokenIfNeeded = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      return next();
    }

    // Check if access token is expired
    const accessToken = req.cookies?.access_token;

    if (accessToken) {
      try {
        jwt.decode(accessToken);
        // Token is valid, continue
        return next();
      } catch (error) {
        // Token is expired, try to refresh
      }
    }

    // Refresh the session
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error || !data.session) {
      // Clear invalid cookies
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      return next();
    }

    // Set new tokens
    res.cookie('access_token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    });

    res.cookie('refresh_token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 604800000 // 7 days
    });

    next();
  } catch (error) {
    console.error('Token refresh error:', error);
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireOwnership,
  refreshTokenIfNeeded
};
