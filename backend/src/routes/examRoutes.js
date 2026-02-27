import express from 'express';
import multer from 'multer';
import {
    createExam,
    getExams,
    getExam,
    updateExam,
    deleteExam,
    importQuestions,
    getPublicExam,
    getDashboardStats,
    getExamsForResults,
    getExamResults,
    getExamQuestions,
    exportExamResults
} from '../controllers/examController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Memory storage for file upload (buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Public route for students taking exam
router.get('/public/:id', getPublicExam);
router.get('/public/:id/questions', getExamQuestions);

// All routes below are protected
router.use(protect);
router.use(authorize('examiner'));

router.get('/dashboard/stats', getDashboardStats);
router.get('/results/publishing', getExamsForResults);

router
    .route('/')
    .get(getExams)
    .post(createExam);

router
    .route('/import-questions')
    .post(upload.single('file'), importQuestions);

router
    .route('/:id')
    .get(getExam)
    .put(updateExam)
    .delete(deleteExam);

router.get('/:id/results', getExamResults);
router.get('/:id/results/export', exportExamResults);

export default router;
