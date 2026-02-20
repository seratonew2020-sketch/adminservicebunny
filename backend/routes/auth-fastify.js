import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or Service Key. Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const authRoutes = async (fastify, options) => {
  // Login Route
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.code(400).send({ message: 'Email and password are required' });
    }

    try {
      // Use Supabase Auth to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("Supabase login failed:", error.message);
        return reply.code(401).send({ message: error.message });
      }

      const { user, session } = data;

      // Get user profile/role from 'users' table if needed
      // Note: Supabase user.id is what we use
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.warn("Profile fetch error:", profileError.message);
      }

      return reply.send({
        token: session.access_token,
        user: {
          id: user.id,
          email: user.email,
          role: profile?.role || 'user'
        }
      });

    } catch (err) {
      console.error("LOGIN ERROR DETAILED:", err);
      fastify.log.error(err);
      return reply.code(500).send({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

  // Protected Route Example
  fastify.get('/me', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    return request.user;
  });
};

export default authRoutes;
