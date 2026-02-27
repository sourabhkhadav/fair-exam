import express from 'express';
import { bulkUploadCandidates, getCandidatesByExam, uploadExcelFile, upload, testEndpoint, addManualCandidate, updateCandidate, deleteCandidate } from '../controllers/candidateController.js';

const router = express.Router();

router.get('/test', testEndpoint);
router.post('/upload', upload.single('file'), uploadExcelFile);
router.post('/bulk', bulkUploadCandidates);
router.post('/manual', addManualCandidate);
router.get('/exam/:examId', getCandidatesByExam);
router.put('/:id', updateCandidate);
router.delete('/:id', deleteCandidate);

export default router;
