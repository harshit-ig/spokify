import express from 'express';
import {
  getUserProgress,
  updateWeeklyGoal,
  recordDailyPractice,
  getUserAchievements
} from '../../controllers/progressController';
import { protect } from '../../middleware/auth';

const router = express.Router();

// User progress routes
router.get('/', protect, getUserProgress);
router.put('/weekly-goal', protect, updateWeeklyGoal);
router.post('/record-practice', protect, recordDailyPractice);
router.get('/achievements', protect, getUserAchievements);

export default router; 