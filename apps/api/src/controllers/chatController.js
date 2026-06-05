/**
 * Chat Controller
 */
const chatService = require('../services/chatService');
const { sendSuccess, sendError } = require('../utils/response');

const sendChatMessage = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return sendError(res, 'Message is required', 400);
    }

    const reply = await chatService.ask(req.user.id, message);

    if (!reply) {
      return sendError(res, 'No response from Gemini', 502);
    }

    return sendSuccess(res, { reply }, 'Chat response generated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendChatMessage,
};
