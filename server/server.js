import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { initCronJobs } from './cron/cronJobs.js';
import { initSocketServer } from './socket/socketServer.js';

async function startServer() {
  await connectDB();
  initCronJobs();

  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  const server = httpServer.listen(env.PORT, () => {
    console.log(`🚀 Smart Budget Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    console.log(`🔗 Allowed Client: ${env.CLIENT_URL}`);
    console.log(`⚡ WebSocket Server initialized with Socket.IO`);
  });

  const shutdown = async signal => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
