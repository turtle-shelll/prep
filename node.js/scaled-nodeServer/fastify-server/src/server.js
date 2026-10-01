const buildApp = require('./app');
const config = require('./config');

const app = buildApp();

const start = async () => {
  try {
    await app.listen({ port: config.port, host: config.host });
    console.log(`===============================================`);
    console.log(` ⚡ Fastify Server is running in [${config.nodeEnv}] mode`);
    console.log(` Local URL: http://localhost:${config.port}`);
    console.log(` Health:    http://localhost:${config.port}/api/v1/health`);
    console.log(` Users API: http://localhost:${config.port}/api/v1/users`);
    console.log(`===============================================`);
  } catch (err) {
    console.error('Error starting Fastify server:', err);
    process.exit(1);
  }
};

// Graceful shutdown handling
const shutdown = async (signal) => {
  console.log(`\n[${signal}] signal received. Closing Fastify server gracefully...`);
  try {
    await app.close();
    console.log('Fastify HTTP server closed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
