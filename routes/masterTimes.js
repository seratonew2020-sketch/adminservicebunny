/**
 * =====================================================
 * Master Times API Routes
 * =====================================================
 */

import { supabase } from '../lib/supabaseClient.js';
import MasterTimesService from '../services/masterTimesService.js';

export default async function masterTimesRoutes(fastify, options) {

  // =====================================================
  // MASTER SHIFT TIMES ENDPOINTS
  // =====================================================

  /**
   * GET /api/master-times
   * ดึงรายการช่วงเวลาทำงานหลักทั้งหมด
   */
  fastify.get('/', async (request, reply) => {
    try {
      const { data, error } = await supabase
        .from('master_times')
        .select('*')
        .eq('is_active', true)
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Add alias 'name' for frontend compatibility (settingtime.vue uses .name)
      const mappedData = (data || []).map(item => ({
        ...item,
        name: item.shift_name || item.name // fallbacks
      }));

      return {
        status: 'OK',
        data: mappedData,
        count: mappedData.length
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        status: 'ERROR',
        message: error.message,
        error: 'Failed to fetch master shift times'
      };
    }
  });

  /**
   * GET /api/master-times/:id
   * ดึงข้อมูลช่วงเวลาทำงานหลักตาม ID
   */
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      const { data, error } = await supabase
        .from('master_times')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        reply.status(404);
        return {
          status: 'ERROR',
          message: 'Shift time not found'
        };
      }

      return { status: 'OK', data };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        status: 'ERROR',
        message: error.message
      };
    }
  });

  /**
   * POST /api/master-times
   * สร้างช่วงเวลาทำงานหลักใหม่
   */
  fastify.post('/', async (request, reply) => {
    try {
      const { shift_name, start_time, end_time, is_overnight } = request.body;

      // Validation
      if (!shift_name || !start_time || !end_time) {
        reply.status(400);
        return {
          status: 'ERROR',
          message: 'กรุณากรอกข้อมูลให้ครบถ้วน (shift_name, start_time, end_time)'
        };
      }

      const { data, error } = await supabase
        .from('master_times')
        .insert([{
          shift_name,
          start_time,
          end_time,
          is_overnight: is_overnight || false,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      reply.status(201);
      return {
        status: 'OK',
        data,
        message: 'สร้างช่วงเวลาทำงานสำเร็จ'
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        status: 'ERROR',
        message: error.message
      };
    }
  });

  /**
   * PUT /api/master-times/:id
   * อัพเดทช่วงเวลาทำงานหลัก
   */
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { shift_name, start_time, end_time, is_overnight, is_active } = request.body;

      const updateData = {};
      if (shift_name !== undefined) updateData.shift_name = shift_name;
      if (start_time !== undefined) updateData.start_time = start_time;
      if (end_time !== undefined) updateData.end_time = end_time;
      if (is_overnight !== undefined) updateData.is_overnight = is_overnight;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data, error } = await supabase
        .from('master_times')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        status: 'OK',
        data,
        message: 'อัพเดทข้อมูลสำเร็จ'
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        status: 'ERROR',
        message: error.message
      };
    }
  });

  /**
   * DELETE /api/master-times/:id
   * ลบช่วงเวลาทำงานหลัก (Soft Delete)
   */
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('master_times')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      return {
        status: 'OK',
        message: 'ลบข้อมูลสำเร็จ'
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        status: 'ERROR',
        message: error.message
      };
    }
  });

  // =====================================================
  // ATTENDANCE PROCESSING ENDPOINTS
  // =====================================================

  /**
   * POST /api/master-times/process-attendance
   * ประมวลผลบันทึกเวลาเข้า-ออกงาน
   *
   * Body: {
   *   employee_id: number,
   *   start_date: string (YYYY-MM-DD),
   *   end_date: string (YYYY-MM-DD)
   * }
   */
  fastify.post('/process-attendance', async (request, reply) => {
    try {
      const { employee_id, start_date, end_date } = request.body;

      if (!employee_id || !start_date || !end_date) {
        reply.status(400);
        return {
          status: 'ERROR',
          message: 'กรุณาระบุ employee_id, start_date และ end_date'
        };
      }

      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      // ประมวลผลข้อมูล
      const processedData = await MasterTimesService.processEmployeeAttendance(
        employee_id,
        startDate,
        endDate
      );

      // บันทึกลงฐานข้อมูล
      const result = await MasterTimesService.saveProcessedAttendance(processedData);

      return {
        status: 'OK',
        message: 'ประมวลผลข้อมูลสำเร็จ',
        data: result.data,
        processed_count: processedData.length
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        status: 'ERROR',
        message: error.message,
        error: 'Failed to process attendance'
      };
    }
  });

  /**
   * POST /api/master-times/batch-process
   * ประมวลผลบันทึกเวลาสำหรับพนักงานหลายคน
   *
   * Body: {
   *   employee_ids: number[],
   *   start_date: string,
   *   end_date: string
   * }
   */
  fastify.post('/batch-process', async (request, reply) => {
    try {
      const { employee_ids, start_date, end_date } = request.body;

      if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
        reply.status(400);
        return {
          status: 'ERROR',
          message: 'กรุณาระบุ employee_ids เป็น array'
        };
      }

      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      const results = [];
      const errors = [];

      for (const employeeId of employee_ids) {
        try {
          const processedData = await MasterTimesService.processEmployeeAttendance(
            employeeId,
            startDate,
            endDate
          );

          const result = await MasterTimesService.saveProcessedAttendance(processedData);

          results.push({
            employee_id: employeeId,
            success: true,
            processed_count: processedData.length
          });
        } catch (error) {
          errors.push({
            employee_id: employeeId,
            error: error.message
          });
        }
      }

      return {
        status: 'OK',
        message: `ประมวลผลสำเร็จ ${results.length}/${employee_ids.length} คน`,
        results,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        status: 'ERROR',
        message: error.message
      };
    }
  });

  // =====================================================
  // REPORTING ENDPOINTS
  // =====================================================

  /**
   * GET /api/master-times/report/:employee_id
   * สร้างรายงานสรุปการเข้างาน
   *
   * Query params:
   *   - start_date: YYYY-MM-DD
   *   - end_date: YYYY-MM-DD
   */
  fastify.get('/report/:employee_id', async (request, reply) => {
    try {
      const { employee_id } = request.params;
      const { start_date, end_date } = request.query;

      if (!start_date || !end_date) {
        reply.status(400);
        return {
          status: 'ERROR',
          message: 'กรุณาระบุ start_date และ end_date'
        };
      }

      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      const report = await MasterTimesService.generateAttendanceReport(
        parseInt(employee_id),
        startDate,
        endDate
      );

      return {
        status: 'OK',
        data: report
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        status: 'ERROR',
        message: error.message
      };
    }
  });

  /**
   * GET /api/master-times/processed-attendance
   * ดึงข้อมูลการเข้างานที่ประมวลผลแล้ว
   *
   * Query params:
   *   - employee_id: number (optional)
   *   - start_date: YYYY-MM-DD (optional)
   *   - end_date: YYYY-MM-DD (optional)
   *   - status: string (optional) - COMPLETE, MISSING_IN, MISSING_OUT
   */
  fastify.get('/processed-attendance', async (request, reply) => {
    try {
      const { employee_id, start_date, end_date, status } = request.query;

      // ถ้ามีการระบุ employee_id และช่วงเวลา ให้ทำการประมวลผลให้ใหม่ก่อนดึงข้อมูล (Automated Process)
      if (employee_id && start_date && end_date) {
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        try {
          const processedData = await MasterTimesService.processEmployeeAttendance(
            employee_id,
            startDate,
            endDate
          );
          await MasterTimesService.saveProcessedAttendance(processedData);
        } catch (procError) {
          fastify.log.error('Auto-processing failed:', procError);
          // ทำงานต่อด้วยข้อมูลที่มีอยู่เดิม (ถ้ามี)
        }
      }

      let query = supabase
        .from('attendance_summary')
        .select('*');

      if (employee_id) {
        query = query.eq('employee_id', employee_id);
      }

      if (start_date) {
        query = query.gte('work_date', start_date);
      }

      if (end_date) {
        query = query.lte('work_date', end_date);
      }

      if (status) {
        query = query.eq('status', status);
      }

      query = query.order('work_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return {
        status: 'OK',
        data: data || [],
        count: data?.length || 0
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        status: 'ERROR',
        message: error.message
      };
    }
  });

  /**
   * GET /api/master-times/statistics
   * สถิติการเข้างานโดยรวม
   *
   * Query params:
   *   - start_date: YYYY-MM-DD
   *   - end_date: YYYY-MM-DD
   */
  fastify.get('/statistics', async (request, reply) => {
    try {
      const { start_date, end_date } = request.query;

      if (!start_date || !end_date) {
        reply.status(400);
        return {
          status: 'ERROR',
          message: 'กรุณาระบุ start_date และ end_date'
        };
      }

      // Proactive: Auto-process for all employees in this range to ensure stats are fresh
      // (Simplified: Fetch employee list and process. In production, this might be triggered by a worker)
      try {
        const { data: employees } = await supabase.from('employees').select('employee_id');
        if (employees && employees.length > 0) {
          const startDate = new Date(start_date);
          const endDate = new Date(end_date);
          for (const emp of employees) {
            const processed = await MasterTimesService.processEmployeeAttendance(emp.employee_id, startDate, endDate);
            await MasterTimesService.saveProcessedAttendance(processed);
          }
        }
      } catch (procErr) {
        fastify.log.error('Stats auto-processing failed:', procErr);
      }

      const { data, error } = await supabase
        .from('attendance_summary')
        .select('*')
        .gte('work_date', start_date)
        .lte('work_date', end_date);

      if (error) throw error;

      // คำนวณสถิติ
      const totalRecords = data.length;
      const completeRecords = data.filter(d => d.status === 'COMPLETE').length;
      const missingInRecords = data.filter(d => d.status === 'MISSING_IN').length;
      const missingOutRecords = data.filter(d => d.status === 'MISSING_OUT').length;
      const totalHours = data.reduce((sum, d) => sum + (d.total_hours || 0), 0);

      // จำนวนพนักงานที่มีบันทึก
      const uniqueEmployees = new Set(data.map(d => d.employee_id)).size;

      return {
        status: 'OK',
        data: {
          period: { start_date, end_date },
          total_records: totalRecords,
          total_employees: uniqueEmployees,
          complete_records: completeRecords,
          missing_in_records: missingInRecords,
          missing_out_records: missingOutRecords,
          total_hours: Math.round(totalHours * 100) / 100,
          average_hours_per_record: totalRecords > 0
            ? Math.round((totalHours / totalRecords) * 100) / 100
            : 0,
          completion_rate: totalRecords > 0
            ? Math.round((completeRecords / totalRecords) * 100 * 100) / 100
            : 0
        }
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        status: 'ERROR',
        message: error.message
      };
    }
  });
}
