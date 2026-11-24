import Goal from '../models/Goal.js';
import Notification from '../models/Notification.js';
import { AppError } from '../utils/AppError.js';

function checkMilestones(goal) {
  const progress = Math.min(100, Math.floor((goal.saved / goal.target) * 100));
  const thresholds = [25, 50, 75, 100];
  const newMilestones = [];

  for (const t of thresholds) {
    if (progress >= t) {
      const alreadyAwarded = goal.milestones.some(m => m.percent === t);
      if (!alreadyAwarded) {
        goal.milestones.push({ percent: t, achievedAt: new Date() });
        newMilestones.push(t);
      }
    }
  }

  return newMilestones;
}

// 1. CREATE GOAL
export async function createGoal(req, res, next) {
  try {
    const { name, target, saved, deadline } = req.validated;

    const goal = new Goal({
      user: req.user._id,
      name,
      target,
      saved: saved || 0,
      deadline,
    });

    checkMilestones(goal);
    await goal.save();

    res.status(201).json({ message: 'Goal created successfully', goal });
  } catch (err) {
    next(err);
  }
}

// 2. GET ALL GOALS (Scoped by req.user._id)
export async function getGoals(req, res, next) {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ deadline: 1 });
    res.json({ goals });
  } catch (err) {
    next(err);
  }
}

// 3. GET SINGLE GOAL (Ownership enforced)
export async function getGoalById(req, res, next) {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      throw new AppError('Goal not found', 404);
    }
    res.json({ goal });
  } catch (err) {
    next(err);
  }
}

// 4. ADD SAVINGS TO GOAL
export async function addSavings(req, res, next) {
  try {
    const { amount } = req.validated;
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });

    if (!goal) {
      throw new AppError('Goal not found', 404);
    }

    goal.saved += amount;
    const newMilestones = checkMilestones(goal);
    await goal.save();

    // Create notifications for newly earned milestone badges
    for (const milestone of newMilestones) {
      await Notification.create({
        user: req.user._id,
        type: 'goal_milestone',
        message: `🎉 Milestone Achieved! You reached ${milestone}% of your goal "${goal.name}"!`,
      });
    }

    res.json({ message: 'Savings added successfully', goal, newMilestones });
  } catch (err) {
    next(err);
  }
}

// 5. UPDATE GOAL (Ownership enforced)
export async function updateGoal(req, res, next) {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      throw new AppError('Goal not found', 404);
    }

    const updates = req.validated;
    if (updates.name !== undefined) goal.name = updates.name;
    if (updates.target !== undefined) goal.target = updates.target;
    if (updates.deadline !== undefined) goal.deadline = updates.deadline;
    if (updates.saved !== undefined) {
      goal.saved = updates.saved;
      checkMilestones(goal);
    }

    await goal.save();
    res.json({ message: 'Goal updated successfully', goal });
  } catch (err) {
    next(err);
  }
}

// 6. DELETE GOAL (Ownership enforced)
export async function deleteGoal(req, res, next) {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      throw new AppError('Goal not found', 404);
    }
    res.json({ message: 'Goal deleted successfully' });
  } catch (err) {
    next(err);
  }
}
