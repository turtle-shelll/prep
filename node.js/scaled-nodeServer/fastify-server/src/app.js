const Fastify = require('fastify');
const cors = require('@fastify/cors');
const registerLoggerHook = require('./hooks/logger.hook');
const apiRoutes = require('./routes');

function buildApp(options = {}) {
  const app = Fastify({
    logger: false,
    ...options,
  });

  // Global plugins
  app.register(cors);

  // Register request logging hook
  registerLoggerHook(app);

  // Root welcome route
  app.get('/', async (request, reply) => {
    return {
      name: 'Production-Ready Fastify API',
      version: '1.0.0',
      framework: 'Fastify',
      endpoints: {
        health: 'GET /api/v1/health',
        getUsers: 'GET /api/v1/users',
        getUserById: 'GET /api/v1/users/:id',
        createUser: 'POST /api/v1/users',
      },
    };
  });

  // API Versioning
  app.register(apiRoutes, { prefix: '/api/v1' });

  // Custom 404 handler
  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      success: false,
      error: 'Not Found',
      message: `Cannot ${request.method} ${request.url}`,
    });
  });

  // Custom global error handler
  app.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode || 500;
    const isDevelopment = process.env.NODE_ENV === 'development';

    reply.code(statusCode).send({
      success: false,
      error: error.name || 'InternalServerError',
      message: error.message || 'An unexpected error occurred.',
      ...(isDevelopment && { stack: error.stack }),
    });
  });

  return app;
}

module.exports = buildApp;
