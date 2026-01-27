import leaveService from '../services/leaveService.js';

/**
 * Leave Routes - RESTful API Endpoints
 * Handles HTTP requests and responses for leave management
 */
async function leaveRoutes(fastify, options) {

  /**
   * GET /api/leaves
   * Get all leaves with optional filters
   * Query params: employee_id, status, start_date, end_date
   */
  fastify.get('/leaves', async (request, reply) => {
    try {
      const filters = {
        employee_id: request.query.employee_id,
        status: request.query.status,
        start_date: request.query.start_date,
        end_date: request.query.end_date
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key =>
        filters[key] === undefined && delete filters[key]
      );

      const result = await leaveService.getAllLeaves(filters);

      return reply.code(200).send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });

  /**
   * GET /api/leaves/:id
   * Get leave by ID
   */
  fastify.get('/leaves/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      if (!id) {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Leave ID is required'
        });
      }

      const result = await leaveService.getLeaveById(id);

      return reply.code(200).send(result);
    } catch (error) {
      fastify.log.error(error);

      if (error.message.includes('not found')) {
        return reply.code(404).send({
          success: false,
          error: 'Not Found',
          message: error.message
        });
      }

      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });

  /**
   * POST /api/leaves
   * Create new leave request
   * Body: { employee_id, leave_type, start_date, end_date, reason }
   */
  fastify.post('/leaves', async (request, reply) => {
    try {
      const leaveData = request.body;

      // Validate required fields
      const requiredFields = ['employee_id', 'leave_type', 'start_date', 'end_date'];
      const missingFields = requiredFields.filter(field => !leaveData[field]);

      if (missingFields.length > 0) {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }

      const result = await leaveService.createLeave(leaveData);

      return reply.code(201).send(result);
    } catch (error) {
      fastify.log.error(error);

      if (error.message.includes('Missing required field') ||
          error.message.includes('End date must be after')) {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: error.message
        });
      }

      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });

  /**
   * PUT /api/leaves/:id
   * Update leave request
   * Body: { leave_type, start_date, end_date, reason, status }
   */
  fastify.put('/leaves/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;

      if (!id) {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Leave ID is required'
        });
      }

      if (Object.keys(updateData).length === 0) {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: 'No update data provided'
        });
      }

      const result = await leaveService.updateLeave(id, updateData);

      return reply.code(200).send(result);
    } catch (error) {
      fastify.log.error(error);

      if (error.message.includes('not found')) {
        return reply.code(404).send({
          success: false,
          error: 'Not Found',
          message: error.message
        });
      }

      if (error.message.includes('End date must be after')) {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: error.message
        });
      }

      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });

  /**
   * PATCH /api/leaves/:id/approve
   * Approve or reject leave request
   * Body: { status: 'approved' | 'rejected', approved_by, remarks }
   */
  fastify.patch('/leaves/:id/approve', async (request, reply) => {
    try {
      const { id } = request.params;
      const approvalData = request.body;

      if (!id) {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Leave ID is required'
        });
      }

      if (!approvalData.status || !approvalData.approved_by) {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Status and approved_by are required'
        });
      }

      const result = await leaveService.approveLeave(id, approvalData);

      return reply.code(200).send(result);
    } catch (error) {
      fastify.log.error(error);

      if (error.message.includes('not found')) {
        return reply.code(404).send({
          success: false,
          error: 'Not Found',
          message: error.message
        });
      }

      if (error.message.includes('Invalid status')) {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: error.message
        });
      }

      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });

  /**
   * DELETE /api/leaves/:id
   * Delete leave request
   */
  fastify.delete('/leaves/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      if (!id) {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Leave ID is required'
        });
      }

      const result = await leaveService.deleteLeave(id);

      return reply.code(200).send(result);
    } catch (error) {
      fastify.log.error(error);

      if (error.message.includes('not found')) {
        return reply.code(404).send({
          success: false,
          error: 'Not Found',
          message: error.message
        });
      }

      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });

  /**
   * GET /api/leaves/statistics/:employeeId
   * Get leave statistics for an employee
   * Query params: year (optional, defaults to current year)
   */
  fastify.get('/leaves/statistics/:employeeId', async (request, reply) => {
    try {
      const { employeeId } = request.params;
      const year = request.query.year ? parseInt(request.query.year) : new Date().getFullYear();

      if (!employeeId) {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Employee ID is required'
        });
      }

      const result = await leaveService.getLeaveStatistics(employeeId, year);

      return reply.code(200).send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });
}

export default leaveRoutes;
