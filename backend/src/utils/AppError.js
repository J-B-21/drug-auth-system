// Custom error types used by the application to differentiate operational errors
// (expected, user-facing) from programmer errors. These carry an HTTP status code
// and optional `details` payload for client consumption.
class AppError extends Error {
  constructor(message, statusCode = 500, details = undefined) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = undefined) {
    super(message, 400, details);
  }
}

module.exports = {
  AppError,
  ValidationError,
};
