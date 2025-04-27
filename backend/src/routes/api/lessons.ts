import express from 'express';
import {
  getAllLessons,
  getLesson,
  startLesson,
  submitResponse,
  completeLesson
} from '../../controllers/lessonController';
import { protect } from '../../middleware/auth';

const router = express.Router();

// Get all lessons and detailed lesson routes
router.get('/', protect, getAllLessons);
router.get('/:id', protect, getLesson);

// Lesson progress routes
router.post('/:id/start', protect, startLesson);
router.post('/:id/response', protect, submitResponse);
router.post('/:id/complete', protect, completeLesson);

export default router; 