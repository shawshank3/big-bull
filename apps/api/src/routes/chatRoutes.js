/**
 * Chat Routes
 * Routes for AI chat
 */
const express = require('express');
const { sendChatMessage } = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, sendChatMessage);

module.exports = router;
