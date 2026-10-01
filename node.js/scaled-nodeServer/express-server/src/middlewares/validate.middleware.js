/**
 * Basic validation middleware for creating a user.
 */
const validateCreateUser = (req, res, next) => {
  const { name, email } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Field "name" is required and must be a non-empty string.',
    });
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Field "email" is required and must be a valid email address.',
    });
  }

  next();
};

module.exports = {
  validateCreateUser,
};
