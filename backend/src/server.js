// Entry point for the backend server.
// Loads environment variables, starts the Express app, and ensures the database pool shuts down cleanly.
const app = require('./app');
const config = require('./config/env');
const db = require('./config/database');
const logger = require('./utils/logger');

const server = app.listen(config.server.port, () => {
  logger.info('server_started', {
    port: config.server.port,
    environment: config.app.env,
  });
});

server.requestTimeout = config.server.requestTimeoutMs;
server.keepAliveTimeout = config.server.keepAliveTimeoutMs;
server.headersTimeout = config.server.keepAliveTimeoutMs + 5000;

const shutdown = (signal) => {
  logger.warn('shutdown_started', { signal });

  server.close(async (error) => {
    if (error) {
      logger.error('http_server_close_failed', {
        message: error.message,
      });
      process.exit(1);
    }

    try {
      await db.destroy();
      logger.info('shutdown_completed');
      process.exit(0);
    } catch (dbError) {
      logger.error('database_pool_close_failed', {
        message: dbError.message,
      });
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('shutdown_forced_timeout');
    process.exit(1);
  }, config.server.shutdownTimeoutMs).unref();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.on('unhandledRejection', (error) => {
  logger.error('unhandled_rejection', {
    message: error && error.message ? error.message : String(error),
    stack: config.app.isProduction ? undefined : error && error.stack,
  });
});

process.on('uncaughtException', (error) => {
  logger.error('uncaught_exception', {
    message: error.message,
    stack: config.app.isProduction ? undefined : error.stack,
  });
  shutdown('uncaughtException');
});
