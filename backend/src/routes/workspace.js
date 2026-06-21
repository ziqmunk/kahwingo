const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createWorkspace, createInvite, joinWorkspace, getMyWorkspace } = require('../controllers/workspaceController');

// All routes require authentication
router.get('/me', protect, getMyWorkspace);
router.post('/create', protect, createWorkspace);
router.post('/invite', protect, createInvite);
router.post('/join/:token', protect, joinWorkspace);

module.exports = router;
