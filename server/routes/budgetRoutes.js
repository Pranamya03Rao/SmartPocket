import { Router } from 'express';
import {
  setBudget,
  getCurrentBudget,
  getTemplates,
  get503020Suggestion,
  getBudgetVsActual,
} from '../controllers/budgetController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { verifyCsrf } from '../middleware/csrf.js';
import { createBudgetSchema } from '../validations/schemas.js';

const router = Router();

router.use(authenticate);

router.get('/current', getCurrentBudget);
router.get('/templates', getTemplates);
router.get('/50-30-20', get503020Suggestion);
router.get('/vs-actual', getBudgetVsActual);
router.post('/', verifyCsrf, validate(createBudgetSchema), setBudget);

export default router;
