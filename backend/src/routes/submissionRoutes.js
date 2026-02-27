import express from 'express';
import { submitExam, sendExamResults, checkSubmission } from '../controllers/submissionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', submitExam);
router.get('/check/:examId/:candidateId', checkSubmission);
router.post('/send-results/:examId', protect, sendExamResults);

export default router;
