import { Router, Response } from 'express';
import User from '../models/User';
import { AuthRequest, protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find({ _id: { $ne: req.user?.userId } }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

export default router;
