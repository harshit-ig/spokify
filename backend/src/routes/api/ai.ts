import express from 'express';
import { protect } from '../../middleware/auth';
import { createPrompt, streamResponse, getChatHistory } from '../../controllers/aiController';

const router = express.Router();

// Routes
router.post('/prompt', protect, createPrompt);
router.get('/stream/:promptId', protect, streamResponse);
router.get('/history', protect, getChatHistory);

export default router; 