import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';

let io = null;

export function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  // Authentication handshake middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.sub).select('_id name email role');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid or expired socket authentication token'));
    }
  });

  io.on('connection', socket => {
    const userId = socket.user._id.toString();
    // Join personal user room for private notifications and updates
    socket.join(`user:${userId}`);

    // If admin, join admins room for telemetry
    if (socket.user.role === 'admin') {
      socket.join('admins');
    }

    // Join / Leave Group Expense rooms
    socket.on('join_group', groupId => {
      if (groupId) {
        socket.join(`group:${groupId}`);
      }
    });

    socket.on('leave_group', groupId => {
      if (groupId) {
        socket.leave(`group:${groupId}`);
      }
    });

    socket.on('disconnect', () => {
      // Automatic cleanup handled by socket.io
    });
  });

  return io;
}

export function getIO() {
  return io;
}

/**
 * Emit a real-time notification to a specific user
 */
export function sendNotificationToUser(userId, notification) {
  if (io && userId) {
    io.to(`user:${userId.toString()}`).emit('new_notification', notification);
  }
}

/**
 * Emit real-time group expense updates (expense added, settled)
 */
export function emitGroupUpdate(groupId, eventName, payload) {
  if (io && groupId) {
    io.to(`group:${groupId.toString()}`).emit(eventName, payload);
  }
}

/**
 * Broadcast announcements to all connected users
 */
export function broadcastAnnouncement(announcement) {
  if (io) {
    io.emit('new_announcement', announcement);
  }
}

/**
 * Broadcast telemetry to admins
 */
export function emitAdminMetric(metricName, data) {
  if (io) {
    io.to('admins').emit('admin_metric_update', { metric: metricName, data, timestamp: new Date() });
  }
}
