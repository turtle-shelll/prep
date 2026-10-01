const userController = require('../controllers/user.controller');
const {
  getUsersSchema,
  getUserByIdSchema,
  createUserSchema,
} = require('../schemas/user.schema');

/**
 * User routes plugin
 */
async function userRoutes(fastify, options) {
  // API 1: GET /api/v1/users
  fastify.get('/', { schema: getUsersSchema }, userController.getUsers);

  // API 2: GET /api/v1/users/:id
  fastify.get('/:id', { schema: getUserByIdSchema }, userController.getUserById);

  // API 3: POST /api/v1/users (Fastify validates schema automatically and rejects invalid with 400)
  fastify.post('/', { schema: createUserSchema }, userController.createUser);
}

module.exports = userRoutes;
