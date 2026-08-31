import { processAdminAIChat } from '../services/adminOpenRouterService.js';

// @desc    Process Admin AI Chat
// @route   POST /api/admin/ai/chat
// @access  Private/Admin
export const handleAdminAIChat = async (req, res, next) => {
  try {
    const { messages, confirmedAction } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      res.status(400);
      throw new Error('Messages array is required');
    }

    const adminId = req.user._id;

    const result = await processAdminAIChat(messages, confirmedAction, adminId);

    res.json(result);
  } catch (error) {
    console.error('Admin AI Controller Error:', error);
    res.status(500).json({ message: 'Internal Server Error while processing Admin AI chat' });
  }
};
