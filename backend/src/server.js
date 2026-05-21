// Entry point for the backend server.
// Loads environment variables, starts the Express app, and ensures the database pool shuts down cleanly.
require('dotenv').config();

const app = require('./app');
const db = require('./config/database');

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Drug Authentication API listening on port ${port}`);
});

const shutdown = (signal) => {
  console.log(`${signal} received. Closing HTTP server and database pool.`);

  server.close(async () => {
    await db.destroy();
    process.exit(0);
  });

  setTimeout(() => {
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
