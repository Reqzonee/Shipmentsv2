import { Router } from 'express';
import healthRoutes from './health.routes.js';
import bulkActionsRoutes from './bulkActions.routes.js';
import contactsRoutes from './contacts.routes.js';
import entitiesRoutes from './entities.routes.js';

const router = Router();

router.use(healthRoutes);
router.use('/bulk-actions', bulkActionsRoutes);
router.use('/contacts', contactsRoutes);
router.use('/entities', entitiesRoutes);

export default router;
