const { Router } = require('express');
const authMiddleware = require('../../middleware/authMiddleware');
const { sendMessage } = require('./chat.controller');

const router = Router();

router.post('/', authMiddleware, sendMessage);

module.exports = router;
