/**
 * Production-ready request logger middleware:
 * - Emits structured JSON in production for log forwarders (Datadog, CloudWatch, ELK)
 * - Human-readable formatted string in development
 * - Skips logging high-frequency health checks (/health) by default to prevent log pollution and event-loop lag
 */
const requestLogger = (req, res, next) => {
  // In production, skip logging 200 OK health checks to prevent log bloat
  const isHealthCheck = req.path.endsWith('/health');

  const start = Date.now();

  res.on('finish', () => {
    // Only skip if it was a successful health check; log if health check fails (status >= 400)
    if (isHealthCheck && res.statusCode < 400 && process.env.NODE_ENV === 'production') {
      return;
    }

    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'production') {
      // Structured JSON logging for production observability
      process.stdout.write(
        JSON.stringify({
          level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
          time: new Date().toISOString(),
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          durationMs: duration,
          ip: req.ip || req.socket.remoteAddress,
        }) + '\n'
      );
    } else {
      // Clean readable format for local development
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
      );
    }
  });

  next();
};

module.exports = requestLogger;
