const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { validateCreateUser } = require('../middlewares/validate.middleware');

// API 1: GET /api/v1/users - List users
router.get('/', userController.getUsers);

// API 2: GET /api/v1/users/:id - Get user by ID
router.get('/:id', userController.getUserById);

// API 3: POST /api/v1/users - Create user (using validation middleware)
router.post('/', validateCreateUser, userController.createUser);

module.exports = router;
