import { processAIChat } from '../services/openRouterService.js';

// @desc    Process AI Chat
// @route   POST /api/ai/chat
// @access  Public
export const handleAIChat = async (req, res, next) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400);
      throw new Error('Messages array is required');
    }

    const result = await processAIChat(messages);

    res.json(result);
  } catch (error) {
    console.error('AI Controller Error:', error);
    res.status(500).json({ message: 'Internal Server Error while processing AI chat' });
  }
};
