import { Router } from 'express';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  exportTransactionsCsv,
} from '../controllers/transactionController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { verifyCsrf } from '../middleware/csrf.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
} from '../validations/schemas.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(transactionQuerySchema, 'query'), getTransactions);
router.get('/export/csv', exportTransactionsCsv);
router.get('/:id', getTransactionById);
router.post('/', verifyCsrf, validate(createTransactionSchema), createTransaction);
router.patch('/:id', verifyCsrf, validate(updateTransactionSchema), updateTransaction);
router.delete('/:id', verifyCsrf, deleteTransaction);

export default router;
