/**
 * Fastify lifecycle hook for request logging:
 * - Uses Fastify's built-in high-precision reply.elapsedTime
 * - Outputs structured JSON in production, clean text in development
 * - Skips logging 200 health checks in production to minimize event-loop overhead
 */
const registerLoggerHook = (fastify) => {
  fastify.addHook('onResponse', async (request, reply) => {
    const isHealthCheck = request.url.endsWith('/health');

    // Skip successful health checks in production
    if (isHealthCheck && reply.statusCode < 400 && process.env.NODE_ENV === 'production') {
      return;
    }

    const duration = Math.round(reply.elapsedTime);

    if (process.env.NODE_ENV === 'production') {
      process.stdout.write(
        JSON.stringify({
          level: reply.statusCode >= 500 ? 'error' : reply.statusCode >= 400 ? 'warn' : 'info',
          time: new Date().toISOString(),
          method: request.method,
          url: request.url,
          status: reply.statusCode,
          durationMs: duration,
          ip: request.ip,
        }) + '\n'
      );
    } else {
      console.log(
        `[${new Date().toISOString()}] ${request.method} ${request.url} ${reply.statusCode} - ${duration}ms`
      );
    }
  });
};

module.exports = registerLoggerHook;
