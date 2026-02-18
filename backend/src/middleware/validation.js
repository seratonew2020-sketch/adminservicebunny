/**
 * Input Validation Middleware
 * Uses express-validator for robust input validation
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'ERROR',
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value
        }))
      }
    });
  }

  next();
};

/**
 * Login validation rules
 */
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

/**
 * Registration validation rules
 */
const validateRegistration = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 100 })
    .withMessage('First name too long'),
  body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 100 })
    .withMessage('Last name too long'),
  handleValidationErrors
];

/**
 * Employee creation validation
 */
const validateEmployee = [
  body('employee_code')
    .trim()
    .notEmpty()
    .withMessage('Employee code is required')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Employee code must contain only uppercase letters, numbers, and hyphens'),
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9-+() ]+$/)
    .withMessage('Invalid phone number format'),
  body('department_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid department ID'),
  body('position')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Position too long'),
  handleValidationErrors
];

/**
 * Leave request validation
 */
const validateLeaveRequest = [
  body('leave_type')
    .isIn(['sick', 'annual', 'personal', 'unpaid', 'other'])
    .withMessage('Invalid leave type'),
  body('start_date')
    .isISO8601()
    .withMessage('Invalid start date format (use ISO 8601)'),
  body('end_date')
    .isISO8601()
    .withMessage('Invalid end date format (use ISO 8601)')
    .custom((endDate, { req }) => {
      if (new Date(endDate) < new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ max: 500 })
    .withMessage('Reason too long (max 500 characters)'),
  handleValidationErrors
];

/**
 * Attendance log validation
 */
const validateAttendanceLog = [
  body('employee_id')
    .isInt({ min: 1 })
    .withMessage('Valid employee ID is required'),
  body('log_time')
    .isISO8601()
    .withMessage('Invalid log time format (use ISO 8601)'),
  body('log_type')
    .isIn(['IN', 'OUT'])
    .withMessage('Log type must be IN or OUT'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location too long'),
  handleValidationErrors
];

/**
 * Date range validation
 */
const validateDateRange = [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((endDate, { req }) => {
      if (req.query.start_date && new Date(endDate) < new Date(req.query.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  handleValidationErrors
];

/**
 * Pagination validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  handleValidationErrors
];

/**
 * ID parameter validation
 */
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid ID parameter')
    .toInt(),
  handleValidationErrors
];

/**
 * Shift time validation
 */
const validateShiftTime = [
  body('shift_name')
    .trim()
    .notEmpty()
    .withMessage('Shift name is required')
    .isLength({ max: 100 })
    .withMessage('Shift name too long'),
  body('start_time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid start time format (use HH:MM)'),
  body('end_time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid end time format (use HH:MM)'),
  body('is_overnight')
    .optional()
    .isBoolean()
    .withMessage('is_overnight must be boolean')
    .toBoolean(),
  handleValidationErrors
];

/**
 * Department validation
 */
const validateDepartment = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Department name is required')
    .isLength({ max: 100 })
    .withMessage('Department name too long'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description too long'),
  body('parent_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid parent department ID'),
  handleValidationErrors
];

/**
 * Holiday validation
 */
const validateHoliday = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Holiday name is required')
    .isLength({ max: 200 })
    .withMessage('Holiday name too long'),
  body('date')
    .isISO8601()
    .withMessage('Invalid date format (use ISO 8601)'),
  body('type')
    .isIn(['public', 'company', 'special'])
    .withMessage('Invalid holiday type'),
  body('is_recurring')
    .optional()
    .isBoolean()
    .withMessage('is_recurring must be boolean')
    .toBoolean(),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateLogin,
  validateRegistration,
  validateEmployee,
  validateLeaveRequest,
  validateAttendanceLog,
  validateDateRange,
  validatePagination,
  validateId,
  validateShiftTime,
  validateDepartment,
  validateHoliday
};
