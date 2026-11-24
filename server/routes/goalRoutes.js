import { Router } from 'express';
import {
  createGoal,
  getGoals,
  getGoalById,
  addSavings,
  updateGoal,
  deleteGoal,
} from '../controllers/goalController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { verifyCsrf } from '../middleware/csrf.js';
import {
  createGoalSchema,
  updateGoalSchema,
  addSavingsSchema,
} from '../validations/schemas.js';

const router = Router();

router.use(authenticate);

router.get('/', getGoals);
router.get('/:id', getGoalById);
router.post('/', verifyCsrf, validate(createGoalSchema), createGoal);
router.post('/:id/savings', verifyCsrf, validate(addSavingsSchema), addSavings);
router.patch('/:id', verifyCsrf, validate(updateGoalSchema), updateGoal);
router.delete('/:id', verifyCsrf, deleteGoal);

export default router;
