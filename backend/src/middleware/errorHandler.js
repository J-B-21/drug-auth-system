// Global Express error handler.
// Normalizes errors into a consistent JSON shape and hides stack traces in production.
const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const message = statusCode >= 500 && isProduction
    ? 'Internal server error.'
    : error.message || 'Internal server error.';

  const payload = {
    error: {
      message,
    },
  };

  if (error.details) {
    payload.error.details = error.details;
  }

  if (statusCode >= 500 && !isProduction) {
    payload.error.stack = error.stack;
  }

  res.status(statusCode).json(payload);
};

module.exports = {
  errorHandler,
};
