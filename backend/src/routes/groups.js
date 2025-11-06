/**
 * Group Routes
 * /api/groups endpoints
 */

const express = require('express');
const router = express.Router();
const GroupController = require('../controllers/groupController');
const { authenticate } = require('../middleware/auth');
const { requireFields, sanitizeBody } = require('../middleware/validator');
const { asyncHandler } = require('../middleware/errorHandler');

// All group routes require authentication
router.use(authenticate);

// Group management
router.post(
  '/',
  sanitizeBody,
  requireFields(['name']),
  asyncHandler(GroupController.create)
);

router.get('/my/groups', asyncHandler(GroupController.getMyGroups));

router.get('/search', asyncHandler(GroupController.search));

router.get('/:id', asyncHandler(GroupController.getById));

router.patch('/:id', sanitizeBody, asyncHandler(GroupController.update));

router.delete('/:id', asyncHandler(GroupController.delete));

// Group membership
router.post('/:id/join', asyncHandler(GroupController.join));

router.post('/:id/leave', asyncHandler(GroupController.leave));

router.get('/:id/members', asyncHandler(GroupController.getMembers));

router.patch(
  '/:id/members/:userId',
  requireFields(['role']),
  asyncHandler(GroupController.updateMemberRole)
);

router.delete('/:id/members/:userId', asyncHandler(GroupController.removeMember));

// Group messages
router.post(
  '/:id/messages',
  sanitizeBody,
  requireFields(['content']),
  asyncHandler(GroupController.sendMessage)
);

router.get('/:id/messages', asyncHandler(GroupController.getMessages));

router.get('/:id/messages/search', asyncHandler(GroupController.searchMessages));

router.patch(
  '/:groupId/messages/:messageId',
  sanitizeBody,
  requireFields(['content']),
  asyncHandler(GroupController.updateMessage)
);

router.delete('/:groupId/messages/:messageId', asyncHandler(GroupController.deleteMessage));

module.exports = router;
