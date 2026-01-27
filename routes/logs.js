import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { supabase } from '../lib/supabaseClient.js';
import { mapAttendanceLogs } from '../services/setlog.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export default async function (fastify, opts) {
  fastify.get('/logs', async (request, reply) => {
    try {
      const { employee_id, start_date, end_date } = request.query;

      // 1. ดึงข้อมูล master_times จาก database
      const { data: masterTimes, error: masterError } = await supabase
        .from('master_times')
        .select('*')
        .eq('is_active', true)
        .order('start_time', { ascending: true });

      if (masterError) {
        fastify.log.error('Error fetching master_times:', masterError);
        throw masterError;
      }

      // 2. ดึงข้อมูล attendance_logs
      let query = supabase.from('attendance_logs').select('*');

      if (employee_id) {
        query = query.eq('employee_id', employee_id);
      }

      if (start_date) {
        const start = dayjs.tz(start_date, "Asia/Bangkok").startOf('day').toISOString();
        query = query.gte('timestamp', start);
      }

      if (end_date) {
        const end = dayjs.tz(end_date, "Asia/Bangkok").endOf('day').toISOString();
        query = query.lte('timestamp', end);
      }

      const { data, error } = await query;
      if (error) throw error;

      // 3. ประมวลผลผ่าน setlog.js โดยส่ง masterTimes ไปด้วย
      const processedData = mapAttendanceLogs(data || [], masterTimes || []);

      return {
        status: 'OK',
        data: processedData,
        count: processedData.length
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { status: 'ERROR', message: error.message };
    }
  });

  fastify.post('/logs', async (request, reply) => {
    return { status: 'OK', message: 'Log created' };
  });
}
