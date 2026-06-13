/**
 * Chat Controller
 */
const catchAsync = require('../../shared/catchAsync');
const AppError = require('../../shared/AppError');
const { sendSuccess } = require('../../utils/response');
const chatService = require('./chat.service');

const sendMessage = catchAsync(async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    throw new AppError('message is required and must be a non-empty string', 400);
  }

  const reply = await chatService.ask(req.user.id, message);

  if (!reply) {
    throw new AppError('AI service returned no response', 502);
  }

  sendSuccess(res, { reply }, 'Chat response generated', 200);
});

module.exports = { sendMessage };
