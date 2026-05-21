// Express application setup and route registration.
// This file configures middleware, health checks, and verification endpoints.
const express = require('express');
const cors = require('cors');

const verificationRoutes = require('./routes/verification.routes');
const { errorHandler } = require('./middleware/errorHandler');
const { notFoundHandler } = require('./middleware/notFoundHandler');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1/verify', verificationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
