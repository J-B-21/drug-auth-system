// Handler for unmatched routes that returns a 404 AppError to the error middleware.
const { AppError } = require('../utils/AppError');

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

module.exports = {
  notFoundHandler,
};
