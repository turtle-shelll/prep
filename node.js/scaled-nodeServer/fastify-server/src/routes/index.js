const userRoutes = require('./user.routes');

/**
 * Root API v1 router plugin
 */
async function rootRouter(fastify, options) {
  // Health check API
  fastify.get('/health', async (request, reply) => {
    return {
      success: true,
      status: 'healthy',
      framework: 'Fastify',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // Resource routes
  fastify.register(userRoutes, { prefix: '/users' });
}

module.exports = rootRouter;
