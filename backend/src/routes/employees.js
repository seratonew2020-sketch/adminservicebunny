import { supabase } from '../lib/supabase.js';

async function employeeRoutes(fastify, options) {
  // GET /api/employees - List employees
  fastify.get('/employees', async (request, reply) => {
    try {
      const { page = 1, limit = 10, search } = request.query;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('employees')
        .select('*', { count: 'exact' })
        .order('employee_id', { ascending: true })
        .range(from, to);

      if (search) {
        // Simple search on first name or last name or employee ID
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,employee_id.ilike.%${search}%`);
      }

      const { data, count, error } = await query;

      if (error) throw error;

      return { data, total: count };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // GET /api/employees/:id - Get single employee
  fastify.get('/employees/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Instead of 404, return null or a specific error object that frontend can handle gracefully
          // But for now, let's keep 404 but ensure it doesn't crash the server
          return reply.code(404).send({ error: 'Employee not found' });
        }
        throw error;
      }

      return data;
    } catch (error) {
      fastify.log.error(`[Employees] Error fetching user ${request.params.userId}:`, error);
      return reply.code(500).send({
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    }
  });

  // GET /api/employees/user/:userId - Get employee by User ID
  fastify.get('/employees/user/:userId', async (request, reply) => {
    try {
      const { userId } = request.params;
      const { data, error } = await supabase
        .from('employees')
        .select('*, departments:dept_id(*), positions:pos_id(*)')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
           return reply.code(404).send({ error: 'Employee not found' });
        }
        throw error;
      }

      return data;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // POST /api/employees - Create employee
  fastify.post('/employees', async (request, reply) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([request.body])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // PUT /api/employees/:id - Update employee
  fastify.put('/employees/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { data, error } = await supabase
        .from('employees')
        .update(request.body)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // POST /api/employees/by-codes - Get employees by codes
  fastify.post('/employees/by-codes', async (request, reply) => {
    try {
      const { codes } = request.body;

      if (!codes || !Array.isArray(codes) || codes.length === 0) {
        return reply.code(400).send({ error: 'codes array is required' });
      }

      // Try with department join first (using employee_id not employee_code)
      let query = supabase
        .from('employees')
        .select('id, employee_id, first_name, last_name, full_name, dept_id, departments:dept_id(department_name)')
        .in('employee_id', codes);

      let { data, error } = await query;

      // Fallback without join if error
      if (error) {
        fastify.log.warn('Department join failed, trying without join:', error.message);
        const fallbackQuery = supabase
          .from('employees')
          .select('id, employee_id, first_name, last_name, full_name, dept_id')
          .in('employee_id', codes);

        const fallbackResult = await fallbackQuery;
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) throw error;

      // Transform to match frontend expectations (employee_id -> employee_code)
      const transformed = (data || []).map(emp => ({
        ...emp,
        employee_code: emp.employee_id // Map employee_id to employee_code for frontend
      }));

      return transformed;
    } catch (error) {
      fastify.log.error('Error in POST /employees/by-codes:', error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // DELETE /api/employees/:id - Delete employee
  fastify.delete('/employees/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });
}

export default employeeRoutes;
