import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase Client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Leave Service - Business Logic Layer
 * Handles all leave-related operations with proper error handling
 */
class LeaveService {
  /**
   * Get all leaves with optional filters
   * @param {Object} filters - Filter options (employee_id, status, date_range)
   * @returns {Promise<Array>} List of leaves
   */
  async getAllLeaves(filters = {}) {
    try {
      let query = supabase
        .from('leaves')
        .select(`
          *,
          employees:employee_id (
            id,
            name,
            department,
            position
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.employee_id) {
        query = query.eq('employee_id', filters.employee_id);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.start_date && filters.end_date) {
        query = query
          .gte('start_date', filters.start_date)
          .lte('end_date', filters.end_date);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        count: data?.length || 0
      };
    } catch (error) {
      console.error('Error fetching leaves:', error);
      throw new Error(`Failed to fetch leaves: ${error.message}`);
    }
  }

  /**
   * Get leave by ID
   * @param {string} id - Leave ID
   * @returns {Promise<Object>} Leave details
   */
  async getLeaveById(id) {
    try {
      const { data, error } = await supabase
        .from('leaves')
        .select(`
          *,
          employees:employee_id (
            id,
            name,
            department,
            position,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error('Leave not found');
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error fetching leave:', error);
      throw new Error(`Failed to fetch leave: ${error.message}`);
    }
  }

  /**
   * Create new leave request
   * @param {Object} leaveData - Leave information
   * @returns {Promise<Object>} Created leave
   */
  async createLeave(leaveData) {
    try {
      // Validate required fields
      const requiredFields = ['employee_id', 'leave_type', 'start_date', 'end_date'];
      for (const field of requiredFields) {
        if (!leaveData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate date range
      const startDate = new Date(leaveData.start_date);
      const endDate = new Date(leaveData.end_date);

      if (endDate < startDate) {
        throw new Error('End date must be after start date');
      }

      // Calculate leave days
      const leaveDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      const newLeave = {
        employee_id: leaveData.employee_id,
        leave_type: leaveData.leave_type,
        start_date: leaveData.start_date,
        end_date: leaveData.end_date,
        days: leaveDays,
        reason: leaveData.reason || '',
        status: leaveData.status || 'pending',
        approved_by: leaveData.approved_by || null,
        approved_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('leaves')
        .insert([newLeave])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Leave request created successfully'
      };
    } catch (error) {
      console.error('Error creating leave:', error);
      throw new Error(`Failed to create leave: ${error.message}`);
    }
  }

  /**
   * Update leave request
   * @param {string} id - Leave ID
   * @param {Object} updateData - Updated leave information
   * @returns {Promise<Object>} Updated leave
   */
  async updateLeave(id, updateData) {
    try {
      // Validate date range if dates are being updated
      if (updateData.start_date && updateData.end_date) {
        const startDate = new Date(updateData.start_date);
        const endDate = new Date(updateData.end_date);

        if (endDate < startDate) {
          throw new Error('End date must be after start date');
        }

        // Recalculate leave days
        const leaveDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        updateData.days = leaveDays;
      }

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('leaves')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error('Leave not found');
      }

      return {
        success: true,
        data,
        message: 'Leave updated successfully'
      };
    } catch (error) {
      console.error('Error updating leave:', error);
      throw new Error(`Failed to update leave: ${error.message}`);
    }
  }

  /**
   * Approve or reject leave request
   * @param {string} id - Leave ID
   * @param {Object} approvalData - Approval information (status, approved_by)
   * @returns {Promise<Object>} Updated leave
   */
  async approveLeave(id, approvalData) {
    try {
      const { status, approved_by, remarks } = approvalData;

      if (!['approved', 'rejected'].includes(status)) {
        throw new Error('Invalid status. Must be "approved" or "rejected"');
      }

      if (!approved_by) {
        throw new Error('Approver ID is required');
      }

      const updateData = {
        status,
        approved_by,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (remarks) {
        updateData.remarks = remarks;
      }

      const { data, error } = await supabase
        .from('leaves')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error('Leave not found');
      }

      return {
        success: true,
        data,
        message: `Leave ${status} successfully`
      };
    } catch (error) {
      console.error('Error approving leave:', error);
      throw new Error(`Failed to approve leave: ${error.message}`);
    }
  }

  /**
   * Delete leave request
   * @param {string} id - Leave ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteLeave(id) {
    try {
      const { data, error } = await supabase
        .from('leaves')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error('Leave not found');
      }

      return {
        success: true,
        message: 'Leave deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting leave:', error);
      throw new Error(`Failed to delete leave: ${error.message}`);
    }
  }

  /**
   * Get leave statistics for an employee
   * @param {string} employeeId - Employee ID
   * @param {number} year - Year for statistics
   * @returns {Promise<Object>} Leave statistics
   */
  async getLeaveStatistics(employeeId, year = new Date().getFullYear()) {
    try {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const { data, error } = await supabase
        .from('leaves')
        .select('leave_type, days, status')
        .eq('employee_id', employeeId)
        .gte('start_date', startDate)
        .lte('end_date', endDate);

      if (error) throw error;

      // Calculate statistics
      const stats = {
        total_leaves: data?.length || 0,
        approved_leaves: data?.filter(l => l.status === 'approved').length || 0,
        pending_leaves: data?.filter(l => l.status === 'pending').length || 0,
        rejected_leaves: data?.filter(l => l.status === 'rejected').length || 0,
        total_days: data?.reduce((sum, l) => sum + (l.days || 0), 0) || 0,
        by_type: {}
      };

      // Group by leave type
      data?.forEach(leave => {
        if (!stats.by_type[leave.leave_type]) {
          stats.by_type[leave.leave_type] = {
            count: 0,
            days: 0
          };
        }
        stats.by_type[leave.leave_type].count++;
        stats.by_type[leave.leave_type].days += leave.days || 0;
      });

      return {
        success: true,
        data: stats,
        year
      };
    } catch (error) {
      console.error('Error fetching leave statistics:', error);
      throw new Error(`Failed to fetch leave statistics: ${error.message}`);
    }
  }
}

export default new LeaveService();
