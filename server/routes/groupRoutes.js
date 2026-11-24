import { Router } from 'express';
import {
  createGroup,
  getGroups,
  getGroupDetail,
  inviteMember,
  addGroupExpense,
  settleUp,
  deleteGroup,
} from '../controllers/groupController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { verifyCsrf } from '../middleware/csrf.js';
import {
  createGroupSchema,
  inviteMemberSchema,
  createGroupExpenseSchema,
  settleSchema,
} from '../validations/schemas.js';

const router = Router();
router.use(authenticate);

router.get('/', getGroups);
router.post('/', verifyCsrf, validate(createGroupSchema), createGroup);
router.get('/:id', getGroupDetail);
router.post('/:id/invite', verifyCsrf, validate(inviteMemberSchema), inviteMember);
router.post('/:id/expenses', verifyCsrf, validate(createGroupExpenseSchema), addGroupExpense);
router.post('/:id/settle', verifyCsrf, validate(settleSchema), settleUp);
router.delete('/:id', verifyCsrf, deleteGroup);

export default router;
