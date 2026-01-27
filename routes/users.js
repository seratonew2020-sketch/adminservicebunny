import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from '../services/userService.js';

export default async function (fastify, opts) {
  // GET /users
  fastify.get('/users', async (request, reply) => {
    try {
      const users = await getAllUsers();
      return { status: 'OK', data: users };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ status: 'ERROR', message: error.message });
    }
  });

  // GET /users/:id
  fastify.get('/users/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const user = await getUserById(id);
      return { status: 'OK', data: user };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ status: 'ERROR', message: error.message });
    }
  });

  // POST /users
  fastify.post('/users', async (request, reply) => {
    try {
      const newUser = await createUser(request.body);
      reply.status(201).send({ status: 'OK', data: newUser });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ status: 'ERROR', message: error.message });
    }
  });

  // PUT /users/:id
  fastify.put('/users/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const updatedUser = await updateUser(id, request.body);
      return { status: 'OK', data: updatedUser };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ status: 'ERROR', message: error.message });
    }
  });

  // DELETE /users/:id
  fastify.delete('/users/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      await deleteUser(id);
      return { status: 'OK', message: 'User deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ status: 'ERROR', message: error.message });
    }
  });
}
