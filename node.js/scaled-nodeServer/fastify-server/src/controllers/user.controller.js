// In-memory mock database (identical to Express implementation)
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Doe', email: 'jane@example.com' },
];

/**
 * @desc   Get all users
 * @route  GET /api/v1/users
 */
const getUsers = async (request, reply) => {
  return reply.code(200).send({
    success: true,
    count: users.length,
    data: users,
  });
};

/**
 * @desc   Get user by ID
 * @route  GET /api/v1/users/:id
 */
const getUserById = async (request, reply) => {
  const userId = parseInt(request.params.id, 10);
  const user = users.find((item) => item.id === userId);

  if (!user) {
    return reply.code(404).send({
      success: false,
      error: 'Not Found',
      message: `User with id ${request.params.id} does not exist.`,
    });
  }

  return reply.code(200).send({
    success: true,
    data: user,
  });
};

/**
 * @desc   Create new user
 * @route  POST /api/v1/users
 */
const createUser = async (request, reply) => {
  const { name, email } = request.body;

  const newUser = {
    id: users.length ? users[users.length - 1].id + 1 : 1,
    name: name.trim(),
    email: email.trim().toLowerCase(),
  };

  users.push(newUser);

  return reply.code(201).send({
    success: true,
    message: 'User created successfully',
    data: newUser,
  });
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
};
