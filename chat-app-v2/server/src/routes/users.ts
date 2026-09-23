import { Router, Response } from 'express';
import User from '../models/User';
import { AuthRequest, protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find({ _id: { $ne: req.user?.userId } }).select('-password');
    res.json(users);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: `Server error fetching users: ${error.message}` });
    } else {
      res.status(500).json({ error: 'An unknown server error occurred while fetching users' });
    }
  }
});

export default router;
