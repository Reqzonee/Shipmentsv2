import { Router } from 'express';
import {
  listContacts,
  seedContacts,
} from '../controllers/ContactController.js';

const router = Router();

router.get('/', listContacts);
router.post('/seed', seedContacts);

export default router;
