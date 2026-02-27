import express from 'express';
import { uploadViolationScreenshot, getViolationsByExam, getViolationsByCandidate, getAllViolations, recordViolation } from '../controllers/violationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/record', recordViolation);
router.post('/upload-screenshot', uploadViolationScreenshot);
router.get('/exam/:examId', getViolationsByExam);
router.get('/candidate/:candidateId', getViolationsByCandidate);

router.get('/all', protect, authorize('examiner'), getAllViolations);

export default router;
