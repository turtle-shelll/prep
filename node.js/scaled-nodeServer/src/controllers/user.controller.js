// Mock in-memory database
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Doe', email: 'jane@example.com' },
];

/**
 * @desc   Get all users
 * @route  GET /api/v1/users
 */
const getUsers = (req, res) => {
  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
};

/**
 * @desc   Get user by ID
 * @route  GET /api/v1/users/:id
 */
const getUserById = (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const user = users.find((item) => item.id === userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: `User with id ${req.params.id} does not exist.`,
    });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
};

/**
 * @desc   Create new user
 * @route  POST /api/v1/users
 */
const createUser = (req, res) => {
  const { name, email } = req.body;

  const newUser = {
    id: users.length ? users[users.length - 1].id + 1 : 1,
    name: name.trim(),
    email: email.trim().toLowerCase(),
  };

  users.push(newUser);

  res.status(201).json({
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
