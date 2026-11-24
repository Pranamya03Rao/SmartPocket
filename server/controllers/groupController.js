import Group from '../models/Group.js';
import GroupExpense from '../models/GroupExpense.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { emitGroupUpdate, sendNotificationToUser } from '../socket/socketServer.js';

// helper: ensure user is a member
async function requireMembership(groupId, userId) {
  const group = await Group.findById(groupId).populate('members', 'name email');
  if (!group) throw new AppError('Group not found', 404);
  const isMember = group.members.some(m => m._id.toString() === userId.toString());
  if (!isMember) throw new AppError('You are not a member of this group', 403);
  return group;
}

// CREATE GROUP
export async function createGroup(req, res, next) {
  try {
    const { name, description } = req.validated;
    const group = await Group.create({
      name,
      description,
      createdBy: req.user._id,
      members: [req.user._id],
    });
    res.status(201).json({ message: 'Group created', group });
  } catch (err) {
    next(err);
  }
}

// LIST MY GROUPS
export async function getGroups(req, res, next) {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('members', 'name email')
      .populate('createdBy', 'name')
      .sort({ updatedAt: -1 });
    res.json({ groups });
  } catch (err) {
    next(err);
  }
}

// GET GROUP DETAIL + balances
export async function getGroupDetail(req, res, next) {
  try {
    const group = await requireMembership(req.params.id, req.user._id);
    const expenses = await GroupExpense.find({ group: group._id })
      .populate('paidBy', 'name email')
      .sort({ createdAt: -1 });

    // Compute balances: positive = owed money, negative = owes money
    const balanceMap = {};
    group.members.forEach(m => { balanceMap[m._id.toString()] = 0; });

    expenses.forEach(exp => {
      const paidById = exp.paidBy._id.toString();
      if (exp.isSettlement) {
        // settlement: paidBy pays TO the other person
        const toUser = exp.shares[0]?.user?.toString();
        if (toUser) {
          balanceMap[paidById] = (balanceMap[paidById] || 0) + exp.amount;
          balanceMap[toUser] = (balanceMap[toUser] || 0) - exp.amount;
        }
      } else {
        // normal expense: paidBy paid, so others owe
        balanceMap[paidById] = (balanceMap[paidById] || 0) + exp.amount;
        exp.shares.forEach(s => {
          const uid = s.user.toString();
          balanceMap[uid] = (balanceMap[uid] || 0) - s.value;
        });
      }
    });

    const balances = group.members.map(m => ({
      user: { _id: m._id, name: m.name, email: m.email },
      balance: Math.round((balanceMap[m._id.toString()] || 0) * 100) / 100,
    }));

    res.json({ group, expenses, balances });
  } catch (err) {
    next(err);
  }
}

// INVITE MEMBER BY EMAIL
export async function inviteMember(req, res, next) {
  try {
    const group = await requireMembership(req.params.id, req.user._id);
    const { email } = req.validated;

    const invitee = await User.findOne({ email: email.toLowerCase() });
    if (!invitee) throw new AppError('No user found with that email', 404);

    const already = group.members.some(m => m._id.toString() === invitee._id.toString());
    if (already) throw new AppError('User is already a member', 400);

    group.members.push(invitee._id);
    await group.save();

    sendNotificationToUser(invitee._id, {
      type: 'group_invite',
      message: `You were added to group "${group.name}"`,
      createdAt: new Date(),
    });

    res.json({ message: `${invitee.name} added to group`, group });
  } catch (err) {
    next(err);
  }
}

// ADD GROUP EXPENSE
export async function addGroupExpense(req, res, next) {
  try {
    const group = await requireMembership(req.params.id, req.user._id);
    const { description, amount, splitType, shares: inputShares } = req.validated;

    let computedShares = [];

    if (splitType === 'equal') {
      const perPerson = Math.round((amount / group.members.length) * 100) / 100;
      computedShares = group.members.map(m => ({
        user: m._id,
        value: perPerson,
      }));
    } else if (splitType === 'percent') {
      if (!inputShares || inputShares.length === 0) throw new AppError('Shares required for percent split', 400);
      const totalPct = inputShares.reduce((s, sh) => s + sh.value, 0);
      if (Math.abs(totalPct - 100) > 0.01) throw new AppError('Percent shares must add to 100', 400);
      computedShares = inputShares.map(s => ({
        user: s.user,
        value: Math.round((amount * s.value / 100) * 100) / 100,
      }));
    } else {
      // custom
      if (!inputShares || inputShares.length === 0) throw new AppError('Shares required for custom split', 400);
      const totalCustom = inputShares.reduce((s, sh) => s + sh.value, 0);
      if (Math.abs(totalCustom - amount) > 0.01) throw new AppError(`Custom shares must add to ${amount}`, 400);
      computedShares = inputShares;
    }

    const expense = await GroupExpense.create({
      group: group._id,
      description,
      amount,
      paidBy: req.user._id,
      splitType,
      shares: computedShares,
    });

    emitGroupUpdate(group._id, 'group_expense_added', {
      groupId: group._id,
      expense: await expense.populate('paidBy', 'name email'),
    });

    res.status(201).json({ message: 'Expense added', expense });
  } catch (err) {
    next(err);
  }
}

// SETTLE UP
export async function settleUp(req, res, next) {
  try {
    const group = await requireMembership(req.params.id, req.user._id);
    const { to, amount } = req.validated;

    // Verify 'to' is a member
    const toMember = group.members.some(m => m._id.toString() === to);
    if (!toMember) throw new AppError('Target user is not a member of this group', 400);

    const settlement = await GroupExpense.create({
      group: group._id,
      description: 'Settlement',
      amount,
      paidBy: req.user._id,
      splitType: 'custom',
      shares: [{ user: to, value: amount }],
      isSettlement: true,
    });

    emitGroupUpdate(group._id, 'group_settled', {
      groupId: group._id,
      settlement: await settlement.populate('paidBy', 'name email'),
    });

    res.status(201).json({ message: 'Settlement recorded', settlement });
  } catch (err) {
    next(err);
  }
}

// DELETE GROUP (creator only)
export async function deleteGroup(req, res, next) {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) throw new AppError('Group not found', 404);
    if (group.createdBy.toString() !== req.user._id.toString()) {
      throw new AppError('Only the group creator can delete this group', 403);
    }

    await GroupExpense.deleteMany({ group: group._id });
    await Group.findByIdAndDelete(group._id);
    res.json({ message: 'Group deleted' });
  } catch (err) {
    next(err);
  }
}
