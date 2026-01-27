import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase URL or Key missing. UserService will fail.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('employee_id', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};

export const getUserById = async (id) => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('employee_id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const createUser = async (userData) => {
  // Auto-generate employee_id if not provided
  if (!userData.employee_id) {
    const { data: existingEmployees } = await supabase
      .from('employees')
      .select('employee_id')
      .order('employee_id', { ascending: false })
      .limit(1);

    let nextId = '10001'; // Default starting ID
    if (existingEmployees && existingEmployees.length > 0) {
      const lastId = parseInt(existingEmployees[0].employee_id, 10);
      if (!isNaN(lastId)) {
        nextId = String(lastId + 1);
      }
    }
    userData.employee_id = nextId;
  }

  const { data, error } = await supabase
    .from('employees')
    .insert([userData])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const updateUser = async (id, userData) => {
  const { data, error } = await supabase
    .from('employees')
    .update(userData)
    .eq('employee_id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const deleteUser = async (id) => {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('employee_id', id);

  if (error) throw new Error(error.message);
  return true;
};
