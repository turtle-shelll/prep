const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log(`===============================================`);
  console.log(` Server is running in [${config.nodeEnv}] mode`);
  console.log(` Local URL: http://localhost:${config.port}`);
  console.log(` Health:    http://localhost:${config.port}/api/v1/health`);
  console.log(` Users API: http://localhost:${config.port}/api/v1/users`);
  console.log(`===============================================`);
});

// Graceful shutdown handling
const shutdown = (signal) => {
  console.log(`\n[${signal}] signal received. Closing HTTP server gracefully...`);
  server.close(() => {
    console.log('HTTP server closed successfully.');
    process.exit(0);
  });

  // Force close after 10s if connections linger
  setTimeout(() => {
    console.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
