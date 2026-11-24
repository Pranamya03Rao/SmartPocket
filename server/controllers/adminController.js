import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import Group from '../models/Group.js';
import Announcement from '../models/Announcement.js';
import { AppError } from '../utils/AppError.js';
import { broadcastAnnouncement } from '../socket/socketServer.js';

export async function getMetrics(req, res, next) {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalStudents,
      totalAdmins,
      totalTransactions,
      dailyTransactions,
      totalGoals,
      totalBudgets,
      totalGroups,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'admin' }),
      Transaction.countDocuments(),
      Transaction.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      Goal.countDocuments(),
      Budget.countDocuments(),
      Group.countDocuments(),
    ]);

    res.json({
      totalUsers,
      totalStudents,
      totalAdmins,
      totalTransactions,
      dailyTransactions,
      totalGoals,
      totalBudgets,
      totalGroups,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const search = req.query.search ? req.query.search.trim() : '';

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('_id name email role isVerified lockUntil loginAttempts createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['student', 'admin'].includes(role)) {
      throw new AppError('Invalid role specified', 400);
    }

    // Prevent revoking last admin
    if (role === 'student' && id === req.user._id.toString()) {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        throw new AppError('Cannot demote the only remaining admin', 400);
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('_id name email role');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({ message: 'User role updated successfully', user });
  } catch (err) {
    next(err);
  }
}

export async function unlockUser(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(
      id,
      { $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } },
      { new: true }
    ).select('_id name email role loginAttempts lockUntil');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({ message: 'Account unlocked successfully', user });
  } catch (err) {
    next(err);
  }
}

export async function getServerHealth(req, res, next) {
  try {
    const memUsage = process.memoryUsage();
    res.json({
      uptime: process.uptime(),
      memory: {
        rssMB: Math.round(memUsage.rss / 1024 / 1024),
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
      },
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function getAnnouncements(req, res, next) {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.json(announcements);
  } catch (err) {
    next(err);
  }
}

export async function createAnnouncement(req, res, next) {
  try {
    const announcement = await Announcement.create({
      ...req.body,
      createdBy: req.user._id,
    });
    broadcastAnnouncement(announcement);
    res.status(201).json(announcement);
  } catch (err) {
    next(err);
  }
}

export async function deleteAnnouncement(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await Announcement.findByIdAndDelete(id);
    if (!deleted) {
      throw new AppError('Announcement not found', 404);
    }
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    next(err);
  }
}
