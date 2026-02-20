import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';
import { createClient } from '@supabase/supabase-js';

// Mocking dependencies
vi.mock('@supabase/supabase-js', () => {
  const mSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'req_1', status: 'pending' }, error: null })
    }),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn().mockReturnThis()
  };
  return { createClient: vi.fn(() => mSupabase) };
});

vi.mock('../src/services/email.js', () => ({
  sendHRAttentionEmail: vi.fn().mockResolvedValue(true),
  sendEmployeeDecisionEmail: vi.fn().mockResolvedValue(true)
}));

describe('Time Corrections API', () => {
  let supabaseMock;

  beforeAll(async () => {
    await app.ready();
    supabaseMock = createClient();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe.skip('POST /api/time-corrections', () => {
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app.server)
        .post('/api/time-corrections')
        .send({ user_id: '123' }); // Missing date, reason, etc.

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/Missing required fields/);
    });

    it('should return 201 and send HR email on success', async () => {
      // Mock user email lookup
      supabaseMock.maybeSingle.mockResolvedValueOnce({ data: { email: 'emp@test.com' }, error: null });
      // Mock insert request
      supabaseMock.single.mockResolvedValueOnce({ data: { id: 'req_1', status: 'pending' }, error: null });
      // Mock HR lookup
      supabaseMock.in.mockResolvedValueOnce({ data: [{ email: 'hr@test.com' }], error: null });

      const response = await request(app.server)
        .post('/api/time-corrections')
        .send({
          user_id: 'emp_1',
          date: '2023-10-01',
          time_in: '09:00',
          reason: 'Forgot'
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe('req_1');

      expect(emailService.sendHRAttentionEmail).toHaveBeenCalledWith('hr@test.com', expect.any(Object));
    });
  });

  describe.skip('PUT /api/time-corrections/:id/status', () => {
    it('should return 400 for invalid status', async () => {
      const response = await request(app.server)
        .put('/api/time-corrections/req_1/status')
        .send({ status: 'unknown' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/Invalid status/);
    });

    it('should return 409 if request is already resolved', async () => {
      supabaseMock.single.mockResolvedValueOnce({
        data: { id: 'req_1', status: 'approved' },
        error: null
      });

      const response = await request(app.server)
        .put('/api/time-corrections/req_1/status')
        .send({ status: 'approved' });

      expect(response.status).toBe(409);
      expect(response.body.message).toMatch(/already resolved/);
    });

    it('should approve successfully and send employee email', async () => {
      // Mock fetch existing request
      supabaseMock.single.mockResolvedValueOnce({
        data: { id: 'req_1', status: 'pending', users: { email: 'emp@test.com' } },
        error: null
      });
      // Mock update
      supabaseMock.single.mockResolvedValueOnce({
        data: { id: 'req_1', status: 'approved' },
        error: null
      });

      const response = await request(app.server)
        .put('/api/time-corrections/req_1/status')
        .send({ status: 'approved', resolved_by: 'hr_1' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('approved');

      const emailService = await import('../src/services/email.js');
      // Takes time because it is async fire-and-forget in route, but Jest waits if properly configured
      // Given simple implementation, it might fire immediately
      await new Promise(r => setTimeout(r, 100)); // slight delay to allow async email to trigger

      expect(emailService.sendEmployeeDecisionEmail).toHaveBeenCalledWith(
        'emp@test.com',
        expect.any(Object),
        'approved',
        undefined
      );
    });
  });
});
