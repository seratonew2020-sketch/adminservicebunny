import { supabase } from '../lib/supabaseClient.js';

export default async function employeeShiftRoutes(fastify, options) {
  // Get employee shifts by employee_id
  fastify.get('/:employee_id', async (request, reply) => {
    try {
      const { employee_id } = request.params;

      const { data, error } = await supabase
        .from('employee_shifts')
        .select('*')
        .eq('employee_id', employee_id)
        .order('day_of_week', { ascending: true });

      if (error) throw error;

      return { status: 'OK', data: data || [] };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { status: 'ERROR', message: error.message };
    }
  });

  // Create new employee shift
  fastify.post('/', async (request, reply) => {
    try {
      const { employee_id, day_of_week, shift_name, start_time, end_time, is_active } = request.body;

      // Check if shift already exists for this day
      const { data: existing } = await supabase
        .from('employee_shifts')
        .select('id')
        .eq('employee_id', employee_id)
        .eq('day_of_week', day_of_week)
        .maybeSingle();

      if (existing) {
        reply.status(400);
        return {
          status: 'ERROR',
          message: 'มีกะทำงานสำหรับวันนี้อยู่แล้ว'
        };
      }

      const { data, error } = await supabase
        .from('employee_shifts')
        .insert([{
          employee_id,
          day_of_week,
          shift_name,
          start_time,
          end_time,
          is_active: is_active !== false
        }])
        .select()
        .single();

      if (error) throw error;

      return { status: 'OK', data };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { status: 'ERROR', message: error.message };
    }
  });

  // Update employee shift
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { day_of_week, shift_name, start_time, end_time, is_active } = request.body;

      const updateData = {};
      if (day_of_week !== undefined) updateData.day_of_week = day_of_week;
      if (shift_name !== undefined) updateData.shift_name = shift_name;
      if (start_time !== undefined) updateData.start_time = start_time;
      if (end_time !== undefined) updateData.end_time = end_time;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data, error } = await supabase
        .from('employee_shifts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { status: 'OK', data };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { status: 'ERROR', message: error.message };
    }
  });

  // Delete employee shift
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      const { error } = await supabase
        .from('employee_shifts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { status: 'OK', message: 'Deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { status: 'ERROR', message: error.message };
    }
  });
}
