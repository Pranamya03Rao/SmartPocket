import { Router } from 'express';
import {
  getSummary,
  getCategorySplit,
  getMonthlyTrend,
  getInsights,
  getForecast,
  getFinancialHealthScore,
  simulateWhatIf,
} from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/summary', getSummary);
router.get('/category-split', getCategorySplit);
router.get('/monthly-trend', getMonthlyTrend);
router.get('/insights', getInsights);
router.get('/forecast', getForecast);
router.get('/health-score', getFinancialHealthScore);
router.get('/simulate', simulateWhatIf);

export default router;
