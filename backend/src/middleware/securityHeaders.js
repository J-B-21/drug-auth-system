const securityHeaders = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
  ].join(', '));

  next();
};

module.exports = securityHeaders;
