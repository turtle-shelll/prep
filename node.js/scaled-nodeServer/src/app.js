const express = require('express');
const cors = require('cors');

const requestLogger = require('./middlewares/logger.middleware');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');
const apiRoutes = require('./routes');

const app = express();

// --- Global Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// --- Root Welcome Route ---
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Production-Ready Express API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/v1/health',
      getUsers: 'GET /api/v1/users',
      getUserById: 'GET /api/v1/users/:id',
      createUser: 'POST /api/v1/users',
    },
  });
});

// --- API Versioning ---
app.use('/api/v1', apiRoutes);

// --- Error Handling Middlewares ---
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
