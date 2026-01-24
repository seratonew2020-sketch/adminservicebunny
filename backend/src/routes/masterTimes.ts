import { FastifyInstance } from "fastify";
import { supabase } from "../lib/supabase.js";

interface MasterTimeBody {
  name: string;
  start_time: string;
  end_time: string;
}

async function masterTimeRoutes(fastify: FastifyInstance) {
  // GET /api/master-times
  fastify.get("/master-times", async (request, reply) => {
    try {
      const { data, error } = await supabase
        .from("master_times")
        .select("*")
        .order("start_time", { ascending: true }); // Order by start time logic or ID

      if (error) throw error;
      return data;
    } catch (err: any) {
      fastify.log.error(err);
      return reply
        .code(500)
        .send({ error: "Failed to fetch master times", details: err.message });
    }
  });

  // POST /api/master-times
  fastify.post<{ Body: MasterTimeBody }>(
    "/master-times",
    async (request, reply) => {
      const { name, start_time, end_time } = request.body;

      // Basic validation
      if (!name || !start_time || !end_time) {
        return reply.code(400).send({
          error: "Missing required fields: name, start_time, end_time",
        });
      }

      try {
        const { data, error } = await supabase
          .from("master_times")
          .insert([{ name, start_time, end_time }])
          .select()
          .single();

        if (error) throw error;
        return reply.code(201).send(data);
      } catch (err: any) {
        fastify.log.error(err);
        return reply.code(500).send({
          error: "Failed to create master time",
          details: err.message,
        });
      }
    },
  );

  // PUT /api/master-times/:id
  fastify.put<{ Params: { id: string }; Body: Partial<MasterTimeBody> }>(
    "/master-times/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { name, start_time, end_time } = request.body;

      try {
        const { data, error } = await supabase
          .from("master_times")
          .update({ name, start_time, end_time, updated_at: new Date() })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        if (!data)
          return reply.code(404).send({ error: "Master time not found" });

        return data;
      } catch (err: any) {
        fastify.log.error(err);
        return reply.code(500).send({
          error: "Failed to update master time",
          details: err.message,
        });
      }
    },
  );

  // DELETE /api/master-times/:id
  fastify.delete<{ Params: { id: string } }>(
    "/master-times/:id",
    async (request, reply) => {
      const { id } = request.params;

      try {
        const { error } = await supabase
          .from("master_times")
          .delete()
          .eq("id", id);

        if (error) throw error;
        return reply.code(204).send();
      } catch (err: any) {
        fastify.log.error(err);
        return reply.code(500).send({
          error: "Failed to delete master time",
          details: err.message,
        });
      }
    },
  );
}

export default masterTimeRoutes;
