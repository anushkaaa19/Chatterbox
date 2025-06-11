import express from 'express';
import { createGroup, getUserGroups, sendGroupMessage, getGroupMessages } from '../controllers/group.controller.js';
import  protectRoute  from '../middlewares/auth.middlewares.js';

const router = express.Router();

// All routes below are protected
router.use(protectRoute);

router.post('/', createGroup); // Create group
router.get('/', getUserGroups); // Get groups
router.post('/:groupId/messages', sendGroupMessage); // Send message
router.get('/:groupId/messages', getGroupMessages); // Get messages

export default router;
