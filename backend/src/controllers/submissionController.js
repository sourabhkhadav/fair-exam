import asyncHandler from '../middleware/asyncHandler.js';
import Submission from '../models/Submission.js';
import Exam from '../models/Exam.js';
import Candidate from '../models/Candidate.js';
import Violation from '../models/Violation.js';
import { sendDetailedExamResult } from '../utils/emailService.js';
import mongoose from 'mongoose';

// @desc    Submit exam and auto-grade
// @route   POST /api/submissions
// @access  Public (with candidate token)
export const submitExam = asyncHandler(async (req, res) => {
    const { examId, candidateId, answers, timeTaken } = req.body;

    if (!examId || !candidateId || !answers) {
        res.status(400);
        throw new Error('Missing required fields: examId, candidateId, or answers');
    }

    // Validate MongoDB ObjectId format before querying
    if (!mongoose.isValidObjectId(examId)) {
        res.status(400);
        throw new Error(`Invalid examId format: "${examId}". Please ensure you are using a valid exam.`);
    }
    if (!mongoose.isValidObjectId(candidateId)) {
        res.status(400);
        throw new Error(`Invalid candidateId format: "${candidateId}". Please log in again.`);
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
        res.status(404);
        throw new Error('Candidate not found');
    }

    // Check if a submission already exists for this candidate and exam
    const existingSubmission = await Submission.findOne({ examId, candidateId });
    if (existingSubmission) {
        console.log(`Duplicate submission prevented for candidate ${candidateId} on exam ${examId}`);
        return res.status(200).json({
            success: true,
            data: {
                submissionId: existingSubmission._id,
                score: existingSubmission.score,
                totalMarks: existingSubmission.totalMarks,
                percentage: existingSubmission.percentage
            }
        });
    }

    // Auto-grade the exam
    let score = 0;
    const gradedAnswers = answers.map(answer => {
        // Frontend sends questionId as 1-based (1, 2, 3...)
        // We need to find the actual question in the array
        const questionId = parseInt(answer.questionId);

        // Find question by its ID property, not array index
        const question = exam.questions.find(q => q.id === questionId || parseInt(q.id) === questionId);

        if (!question) {
            // Fallback: try array index (questionId - 1)
            const questionIndex = questionId - 1;
            const questionByIndex = exam.questions[questionIndex];

            if (questionByIndex) {
                console.warn(`Q${questionId}: Found by index ${questionIndex} instead of ID`);
                const isCorrect = answer.selectedOption === questionByIndex.correct;
                if (isCorrect) score += questionByIndex.marks || 0;
                return { questionId: answer.questionId, selectedOption: answer.selectedOption, isCorrect };
            }

            console.error(`Q${questionId}: NOT FOUND in exam (Total questions: ${exam.questions.length})`);
            return { questionId: answer.questionId, selectedOption: answer.selectedOption, isCorrect: false };
        }

        const isCorrect = answer.selectedOption === question.correct;
        if (isCorrect) score += question.marks || 0;

        return { questionId: answer.questionId, selectedOption: answer.selectedOption, isCorrect };
    });

    const submission = await Submission.create({
        examId,
        candidateId,
        answers: gradedAnswers,
        score,
        totalMarks: exam.totalMarks,
        timeTaken: timeTaken || 0
    });

    res.status(201).json({
        success: true,
        data: {
            submissionId: submission._id,
            score,
            totalMarks: exam.totalMarks,
            percentage: submission.percentage
        }
    });
});

// @desc    Check if candidate has already submitted
// @route   GET /api/submissions/check/:examId/:candidateId
// @access  Public
export const checkSubmission = asyncHandler(async (req, res) => {
    const { examId, candidateId } = req.params;

    const submission = await Submission.findOne({ examId, candidateId }).lean();

    res.status(200).json({
        success: true,
        hasSubmitted: !!submission
    });
});

// @desc    Send detailed results to candidates
// @route   POST /api/submissions/send-results/:examId
// @access  Private
export const sendExamResults = asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const { passingPercentage = 40 } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    if (exam.resultsSent) {
        res.status(400);
        throw new Error('Results have already been sent for this exam');
    }

    const now = new Date();
    const examEndDateTime = new Date(`${exam.endDate}T${exam.endTime}`);

    if (now < examEndDateTime) {
        res.status(400);
        throw new Error('Cannot send results before exam end time');
    }

    const submissions = await Submission.find({ examId }).populate('candidateId');
    if (submissions.length === 0) {
        res.status(404);
        throw new Error('No submissions found for this exam');
    }

    const results = { sent: 0, failed: 0, details: [] };

    for (const submission of submissions) {
        const candidate = submission.candidateId;
        if (!candidate || !candidate.email) {
            results.failed++;
            results.details.push({ candidate: candidate?.name || 'Unknown', status: 'No email' });
            continue;
        }

        try {
            // Get violation data for this candidate
            const violation = await Violation.findOne({
                candidateId: candidate._id.toString(),
                examId: examId
            });

            const violationLevel = violation ? violation.severity : 'None';
            const screenshotUrl = violation ? violation.screenshotUrl : null;
            const violationCounts = violation ? violation.violationCount : null;

            // Determine pass/fail based on violation level
            let isPassed;
            let failReason = '';

            if (violationLevel === 'High') {
                // High violation = automatic fail due to cheating
                isPassed = false;
                failReason = 'cheating';
            } else {
                // Low/Medium/None: pass/fail based on cutoff
                isPassed = submission.percentage >= passingPercentage;
                if (!isPassed) {
                    failReason = 'marks_insufficient';
                }
            }

            const resultDetails = {
                examTitle: exam.title,
                candidateName: candidate.name,
                candidateId: candidate.candidateId,
                score: submission.score,
                totalMarks: submission.totalMarks,
                percentage: submission.percentage,
                timeTaken: submission.timeTaken,
                isPassed,
                failReason,
                passingPercentage,
                violationLevel,
                violationCounts,
                screenshotUrl,
                submittedAt: submission.submittedAt
            };

            await sendDetailedExamResult(candidate.email, resultDetails);
            results.sent++;
            results.details.push({ candidate: candidate.name, status: 'Sent successfully' });

        } catch (error) {
            console.error(`Failed to send result to ${candidate.email}:`, error.message);
            results.failed++;
            results.details.push({ candidate: candidate.name, status: `Failed: ${error.message}` });
        }
    }

    exam.resultsSent = true;
    await exam.save();

    res.status(200).json({
        success: true,
        message: `Results sent to ${results.sent} candidates, ${results.failed} failed`,
        results
    });
});
