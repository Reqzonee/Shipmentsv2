import { Router } from 'express';
import {
  listEntities,
  listEntityRecords,
  seedEntity,
  seedAllEntities,
} from '../controllers/EntityController.js';

const router = Router();

router.get('/', listEntities);
router.post('/seed-all', seedAllEntities);
router.get('/:entityType', listEntityRecords);
router.post('/:entityType/seed', seedEntity);

export default router;
