import { supabase } from '../lib/supabase.js';

/**
 * Departments Routes
 * GET /api/departments - List all departments
 */

async function departmentsRoutes(fastify) {
  // GET /api/departments - List all departments
  fastify.get('/departments', async (request, reply) => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('department_id, department_name, department_code')
        .order('department_name', { ascending: true });

      if (error) {
        fastify.log.error('Supabase error fetching departments:', error);
        return reply.code(500).send({ error: error.message });
      }

      // Transform to match frontend expectations (id, name)
      const transformed = (data || []).map(d => ({
        id: d.department_id,
        name: d.department_name,
        code: d.department_code
      }));

      return transformed;
    } catch (err) {
      fastify.log.error('Error in GET /api/departments:', err);
      return reply.code(500).send({ error: err.message });
    }
  });

  // GET /api/departments/:id -Get single department
  fastify.get('/departments/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return reply.code(404).send({ error: 'Department not found' });
        }
        fastify.log.error('Supabase error:', error);
        return reply.code(500).send({ error: error.message });
      }

      return data;
    } catch (err) {
      fastify.log.error('Error in GET /api/departments/:id:', err);
      return reply.code(500).send({ error: err.message });
    }
  });
}

export default departmentsRoutes;
