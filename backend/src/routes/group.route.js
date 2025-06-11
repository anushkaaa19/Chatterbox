import express from 'express';
import {
  createGroup,
  getUserGroups,
  sendGroupMessage,
  getGroupMessages,
} from '../controllers/group.controller.js';
import protectRoute from '../middlewares/auth.middlewares.js';

const router = express.Router();

router.use(protectRoute);

router.post('/', createGroup); // Create group
router.get('/', getUserGroups); // Fetch all groups the user is in
router.post('/:groupId/messages', sendGroupMessage); // Send group message
router.get('/:groupId/messages', getGroupMessages); // Get messages

export default router;
