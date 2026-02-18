import { supabase } from '../lib/supabase.js';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { randomUUID } from 'crypto';

async function holidayRoutes(fastify, options) {
  const dataPath = resolve(process.cwd(), 'data');
  const fallbackFile = resolve(dataPath, 'holidays.json');

  async function ensureFallbackFile() {
    try {
      await fs.mkdir(dataPath, { recursive: true });
      await fs.access(fallbackFile).catch(async () => {
        await fs.writeFile(fallbackFile, '[]', 'utf-8');
      });
    } catch { }
  }

  async function readFallback() {
    await ensureFallbackFile();
    const raw = await fs.readFile(fallbackFile, 'utf-8');
    return JSON.parse(raw);
  }

  async function writeFallback(list) {
    await ensureFallbackFile();
    await fs.writeFile(fallbackFile, JSON.stringify(list), 'utf-8');
  }
  // GET /api/holidays - List all holidays
  fastify.get('/holidays', async (request, reply) => {
    try {
      const { start_date, end_date, type } = request.query;


      let query = supabase
        .from('holidays')
        .select('*')
        .order('start_date', { ascending: true });

      if (start_date) query = query.gte('start_date', start_date);
      if (end_date) query = query.lte('end_date', end_date);
      if (type) query = query.eq('type', type);

      const { data, error } = await query;

      if (error && error.code === '42703') {
        const list = await readFallback();
        let filtered = list;
        if (start_date) filtered = filtered.filter(h => h.start_date >= start_date);
        if (end_date) filtered = filtered.filter(h => h.end_date <= end_date);
        if (type) filtered = filtered.filter(h => h.type === type);
        return filtered.sort((a, b) => (a.start_date > b.start_date ? 1 : -1));
      }

      if (error) throw error;
      return data;
    } catch (error) {
      fastify.log.error('[Holidays] List Error:', error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // GET /api/holidays/:id - Get single holiday
  fastify.get('/holidays/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === '42703') {
          const list = await readFallback();
          const item = list.find(h => h.id === id);
          if (!item) return reply.code(404).send({ error: 'Not Found' });
          return item;
        }
        throw error;
      }
      return data;
    } catch (error) {
      fastify.log.error('[Holidays] Create Error:', error);
      if (error.code === '42703') {
        return reply.code(500).send({ error: 'Database schema mismatch: Missing columns in holidays table. Please run the fix_holidays_schema migration.' });
      }
      return reply.code(500).send({ error: error.message });
    }
  });

  // POST /api/holidays - Create holiday
  fastify.post('/holidays', async (request, reply) => {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .insert([request.body])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      fastify.log.error('[Holidays] Create Error:', error);
      if (error.code === '42703') { // Undefined column
        const body = request.body || {};
        const required = ['title', 'start_date', 'end_date', 'type'];
        for (const k of required) {
          if (!body[k]) return reply.code(400).send({ error: `Missing field: ${k}` });
        }
        const list = await readFallback();
        const item = {
          id: randomUUID(),
          title: body.title,
          start_date: body.start_date,
          end_date: body.end_date,
          type: body.type,
          employee_id: body.employee_id ?? null,
          requester_name: body.requester_name ?? null,
          description: body.description ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        list.push(item);
        await writeFallback(list);
        return item;
      }
      return reply.code(500).send({ error: error.message });
    }
  });

  // PUT /api/holidays/:id - Update holiday
  fastify.put('/holidays/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { data, error } = await supabase
        .from('holidays')
        .update(request.body)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '42703') {
          const list = await readFallback();
          const idx = list.findIndex(h => h.id === id);
          if (idx === -1) return reply.code(404).send({ error: 'Not Found' });
          const updated = { ...list[idx], ...request.body, updated_at: new Date().toISOString() };
          list[idx] = updated;
          await writeFallback(list);
          return updated;
        }
        throw error;
      }
      return data;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // DELETE /api/holidays/:id - Delete holiday
  fastify.delete('/holidays/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === '42703') {
          const list = await readFallback();
          const next = list.filter(h => h.id !== id);
          await writeFallback(next);
          return { success: true };
        }
        throw error;
      }
      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });
}

export default holidayRoutes;
