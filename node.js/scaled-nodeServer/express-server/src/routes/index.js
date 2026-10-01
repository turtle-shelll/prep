const express = require('express');
const router = express.Router();
const userRoutes = require('./user.routes');

// Health Check API
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Resource routes
router.use('/users', userRoutes);

module.exports = router;
