import { Router } from 'express';
import {
  listBulkActions,
  createBulkAction,
  getBulkAction,
  getBulkActionStats,
  getBulkActionLogs,
} from '../controllers/BulkActionController.js';
import { runQueueCascadeDemo } from '../controllers/QueueCascadeDemoController.js';
import { rateLimitMiddleware } from '../middleware/rateLimit.js';

const router = Router();

router.get('/', listBulkActions);
router.post('/', rateLimitMiddleware, createBulkAction);
// Live Loom demo — must be registered before /:actionId
router.post('/demo/queue-cascade', runQueueCascadeDemo);
router.get('/:actionId', getBulkAction);
router.get('/:actionId/stats', getBulkActionStats);
router.get('/:actionId/logs', getBulkActionLogs);

export default router;
