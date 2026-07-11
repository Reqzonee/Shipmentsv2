import { Router } from 'express';
import {
  listBulkActions,
  createBulkAction,
  getBulkAction,
  getBulkActionStats,
  getBulkActionLogs,
} from '../controllers/BulkActionController.js';
import { rateLimitMiddleware } from '../middleware/rateLimit.js';

const router = Router();

router.get('/', listBulkActions);
router.post('/', rateLimitMiddleware, createBulkAction);
router.get('/:actionId', getBulkAction);
router.get('/:actionId/stats', getBulkActionStats);
router.get('/:actionId/logs', getBulkActionLogs);

export default router;
