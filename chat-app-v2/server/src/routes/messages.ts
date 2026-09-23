import { Router, Response } from 'express';
import Message from '../models/Message';
import { AuthRequest, protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/:room', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const messages = await Message.find({ room: req.params.room }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: `Server error fetching messages: ${error.message}` });
    } else {
      res.status(500).json({ error: 'An unknown server error occurred while fetching messages' });
    }
  }
});

export default router;
