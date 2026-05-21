// Small wrapper to catch rejected promises from async route handlers
// and forward errors to Express' `next()` so the global error handler can process them.
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

module.exports = asyncHandler;
