import asyncHandler from '../middleware/asyncHandler.js';
import Exam from '../models/Exam.js';
import Candidate from '../models/Candidate.js';
import Violation from '../models/Violation.js';
import xlsx from 'xlsx';
import fs from 'fs';
import pdfParse from 'pdf-parse-fork';

// @desc    Get dashboard stats
// @route   GET /api/exams/dashboard/stats
// @access  Private (Examiner)
export const getDashboardStats = asyncHandler(async (req, res) => {
    const examinerId = req.user.id === 'demo-user-id' ? '507f1f77bcf86cd799439011' : req.user.id;

    const totalExams = await Exam.countDocuments({ examiner: examinerId });
    const activeExams = await Exam.countDocuments({ examiner: examinerId, status: 'published' });
    const recentExams = await Exam.find({ examiner: examinerId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('title startDate startTime endDate endTime status createdAt')
        .lean();

    // Get student count for each exam
    const examsWithStudents = await Promise.all(
        recentExams.map(async (exam) => {
            const studentCount = await Candidate.countDocuments({ examId: exam._id });
            return {
                _id: exam._id,
                name: exam.title,
                date: exam.startDate || new Date(exam.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                students: studentCount,
                startDate: exam.startDate,
                startTime: exam.startTime,
                endDate: exam.endDate,
                endTime: exam.endTime,
                status: exam.status
            };
        })
    );

    res.status(200).json({
        success: true,
        data: {
            totalExams,
            activeExams,
            recentExams: examsWithStudents
        }
    });
});

// @desc    Create new exam
// @route   POST /api/exams
// @access  Private (Examiner)
export const createExam = asyncHandler(async (req, res) => {
    if (req.user.id === 'demo-user-id') {
        req.body.examiner = '507f1f77bcf86cd799439011';
    } else {
        req.body.examiner = req.user.id;
    }

    // Ensure violationLimits are properly formatted
    if (req.body.violationLimits) {
        req.body.violationLimits = {
            faceLimit: parseInt(req.body.violationLimits.faceLimit, 10) || 5,
            soundLimit: parseInt(req.body.violationLimits.soundLimit, 10) || 5,
            fullscreenLimit: parseInt(req.body.violationLimits.fullscreenLimit, 10) || 5
        };
    }

    const exam = await Exam.create(req.body);

    res.status(201).json({
        success: true,
        data: exam
    });
});

// @desc    Get all exams for logged in examiner
// @route   GET /api/exams
// @access  Private (Examiner)
export const getExams = asyncHandler(async (req, res) => {
    const examinerId = req.user.id === 'demo-user-id' ? '507f1f77bcf86cd799439011' : req.user.id;
    const exams = await Exam.find({ examiner: examinerId }).lean();

    res.status(200).json({
        success: true,
        count: exams.length,
        data: exams
    });
});

// @desc    Get single exam (public - for students)
// @route   GET /api/exams/public/:id
// @access  Public
export const getPublicExam = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id).select('title description duration violationLimits questions sections').lean();

    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    // Build per-section question counts
    const sections = exam.sections || [];
    const sectionBreakdown = sections.map(section => {
        const sectionQuestions = exam.questions.filter(q => q.sectionId === section.id);
        const totalMarks = sectionQuestions.reduce((acc, q) => acc + (q.marks || 0), 0);
        return {
            id: section.id,
            name: section.name,
            questionCount: sectionQuestions.length,
            totalMarks
        };
    });

    // Questions not assigned to any named section (sectionId = 0 or no match)
    const namedSectionIds = sections.map(s => s.id);
    const unsectionedQuestions = exam.questions.filter(
        q => !namedSectionIds.includes(q.sectionId) || q.sectionId === 0
    );

    res.status(200).json({
        success: true,
        data: {
            examId: exam._id,
            title: exam.title,
            description: exam.description,
            duration: exam.duration,
            violationLimits: exam.violationLimits,
            totalQuestions: exam.questions?.length || 0,
            sections: sectionBreakdown,
            unsectionedCount: unsectionedQuestions.length
        }
    });
});

// @desc    Get single exam
// @route   GET /api/exams/:id
// @access  Private (Examiner)
export const getExam = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    // Make sure user is exam owner
    if (exam.examiner.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized to access this exam');
    }

    res.status(200).json({
        success: true,
        data: exam
    });
});

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private (Examiner)
export const updateExam = asyncHandler(async (req, res) => {
    let exam = await Exam.findById(req.params.id);

    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    const examinerId = req.user.id === 'demo-user-id' ? '507f1f77bcf86cd799439011' : req.user.id;
    if (exam.examiner.toString() !== examinerId) {
        res.status(401);
        throw new Error('Not authorized to update this exam');
    }

    // Check if exam is being published
    const isPublishing = req.body.status === 'published' && exam.status !== 'published';

    // Server-side validation for publishing
    if (isPublishing) {
        // 1. Check for required basic details
        const title = req.body.title || exam.title;
        const startDate = req.body.startDate || exam.startDate;
        const startTime = req.body.startTime || exam.startTime;
        const endTime = req.body.endTime || exam.endTime;

        if (!title || !startDate || !startTime || !endTime) {
            res.status(400);
            throw new Error('Exam title, date, start time, and end time are required for publishing');
        }

        // 2. Check for questions (either in update body or existing)
        const questions = req.body.questions || exam.questions;
        if (!questions || questions.length === 0) {
            res.status(400);
            throw new Error('Cannot publish an exam without questions');
        }

        // 3. Check for candidates
        const candidateCount = await Candidate.countDocuments({ examId: req.params.id });
        if (candidateCount === 0) {
            res.status(400);
            throw new Error('Cannot publish an exam without candidates. Please add candidates first.');
        }
    }

    // Ensure violationLimits are preserved and properly formatted
    if (req.body.violationLimits) {
        req.body.violationLimits = {
            faceLimit: parseInt(req.body.violationLimits.faceLimit, 10) || 5,
            soundLimit: parseInt(req.body.violationLimits.soundLimit, 10) || 5,
            fullscreenLimit: parseInt(req.body.violationLimits.fullscreenLimit, 10) || 5
        };
    }

    exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    // Send email notifications to candidates when publishing
    if (isPublishing) {
        try {
            console.log(`📧 Publishing exam ${req.params.id}, checking for candidates...`);
            const candidates = await Candidate.find({ examId: req.params.id });
            console.log(`Found ${candidates.length} candidates`);

            if (candidates.length > 0) {
                const examDetails = {
                    title: exam.title,
                    startDate: exam.startDate || 'TBD',
                    startTime: exam.startTime || 'TBD',
                    duration: exam.duration || 0
                };

                const candidatesWithEmail = candidates.filter(candidate => candidate.email);
                console.log(`Sending emails to ${candidatesWithEmail.length} candidates`);

                for (const candidate of candidatesWithEmail) {
                    try {
                        await sendExamInvitation(candidate.email, examDetails);
                        console.log(`✅ Sent to ${candidate.email}`);
                    } catch (err) {
                        console.error(`❌ Failed to send to ${candidate.email}:`, err.message);
                    }
                }
            } else {
                console.log('⚠️ No candidates found for this exam');
            }
        } catch (emailError) {
            console.error('❌ Error sending exam invitations:', emailError);
        }
    }

    res.status(200).json({
        success: true,
        data: exam
    });
});

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private (Examiner)
export const deleteExam = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    // Make sure user is exam owner
    if (exam.examiner.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized to delete this exam');
    }

    await Exam.deleteOne({ _id: req.params.id });

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Import questions from Excel or PDF
// @route   POST /api/exams/import-questions
// @access  Private (Examiner)
export const importQuestions = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file');
    }

    const fileType = req.file.mimetype;
    let questions = [];

    if (fileType === 'application/pdf') {
        try {
            const pdfData = await pdfParse(req.file.buffer, { max: 0 });
            const text = pdfData.text;

            console.log('PDF Text:', text);

            // Try multiple patterns to split questions
            let questionBlocks = text.split(/(?=Q\d+\.)/).filter(block => block.trim() && block.match(/^Q\d+\./));

            // If no matches, try alternative patterns
            if (questionBlocks.length === 0) {
                questionBlocks = text.split(/(?=\d+\.)/).filter(block => block.trim() && block.match(/^\d+\./));
            }

            if (questionBlocks.length === 0) {
                questionBlocks = text.split(/(?=Question\s*\d+)/i).filter(block => block.trim() && block.match(/Question\s*\d+/i));
            }

            console.log('Question blocks found:', questionBlocks.length);

            questions = questionBlocks.map((block, index) => {
                const lines = block.split('\n').filter(l => l.trim());
                const firstLine = lines[0] || '';
                const questionText = firstLine.replace(/^(Q\d+\.|\d+\.|Question\s*\d+:?)\s*/i, '').trim() || lines[1]?.trim() || 'Question';

                const options = [];
                let correctAnswer = 1;
                let marks = 2;

                lines.forEach(line => {
                    const optionMatch = line.match(/^([1-4]|[A-D])[\).\)]\s*(.+)/);
                    if (optionMatch) {
                        options.push(optionMatch[2]?.trim());
                    }

                    const answerMatch = line.match(/Answer:\s*([1-4A-D])/i);
                    if (answerMatch) {
                        const ans = answerMatch[1];
                        correctAnswer = isNaN(ans) ? ans.charCodeAt(0) - 64 : parseInt(ans);
                    }

                    const marksMatch = line.match(/Marks:\s*(\d+)/i);
                    if (marksMatch) {
                        marks = parseInt(marksMatch[1]);
                    }
                });

                return {
                    id: Date.now() + index,
                    sectionId: 0,
                    type: 'MCQ',
                    text: questionText,
                    options: options.length === 4 ? options : ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
                    correct: correctAnswer - 1,
                    marks: marks,
                    difficulty: 'Medium',
                    tags: []
                };
            });
        } catch (pdfError) {
            console.error('PDF parsing error:', pdfError.message);
            res.status(400);
            throw new Error('Failed to parse PDF. Please ensure the PDF is not corrupted or password protected.');
        }
    } else {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        questions = data.map((row, index) => {
            // Skip empty rows
            if (!row['Question'] || row['Question'].trim() === '') {
                console.warn(`Row ${index + 1}: Skipping empty question`);
                return null;
            }

            const options = [
                row['Option 1'] || row['1'] || '',
                row['Option 2'] || row['2'] || '',
                row['Option 3'] || row['3'] || '',
                row['Option 4'] || row['4'] || ''
            ];

            // Validate all options are present
            if (options.some(opt => !opt || opt.trim() === '')) {
                console.warn(`Row ${index + 1}: Missing or empty options`);
            }

            let correctIdx = 0;
            const correctVal = row['Answer'] || row['Correct'];

            // Parse correct answer (1-based from Excel → 0-based for storage)
            if (typeof correctVal === 'number') {
                correctIdx = correctVal - 1; // Convert 1,2,3,4 → 0,1,2,3
            } else if (typeof correctVal === 'string') {
                const trimmed = correctVal.trim();
                const num = parseInt(trimmed);

                // Check if it's a number (1-4)
                if (!isNaN(num) && num >= 1 && num <= 4) {
                    correctIdx = num - 1; // Convert 1,2,3,4 → 0,1,2,3
                } else {
                    // It's text - match against options
                    const matchIndex = options.findIndex(opt =>
                        opt && opt.trim().toLowerCase() === trimmed.toLowerCase()
                    );

                    if (matchIndex !== -1) {
                        correctIdx = matchIndex;
                        console.log(`Row ${index + 1}: Matched answer text '${trimmed}' to option ${matchIndex + 1}`);
                    } else {
                        console.warn(`Row ${index + 1}: Could not match answer '${correctVal}' to any option, defaulting to 1`);
                    }
                }
            }

            // Ensure correctIdx is within valid range [0-3]
            if (correctIdx < 0) correctIdx = 0;
            if (correctIdx > 3) correctIdx = 3;

            const marks = parseInt(row['Marks'] || 2);
            if (marks <= 0) {
                console.warn(`Row ${index + 1}: Invalid marks value, defaulting to 2`);
            }

            console.log(`Q${index + 1}: Answer=${correctVal} → Index=${correctIdx}, Marks=${marks}`);

            return {
                id: index + 1, // Use sequential ID starting from 1
                sectionId: 0,
                type: 'MCQ',
                text: row['Question'] || 'New Question',
                options,
                correct: correctIdx, // 0-based index (0,1,2,3)
                marks: marks > 0 ? marks : 2,
                difficulty: 'Medium',
                tags: []
            };
        }).filter(q => q !== null); // Remove null entries from skipped rows
    }

    res.status(200).json({
        success: true,
        count: questions.length,
        data: questions
    });
});

// @desc    Get exams for results publishing
// @route   GET /api/exams/results/publishing
// @access  Private (Examiner)
export const getExamsForResults = asyncHandler(async (req, res) => {
    const examinerId = req.user.id === 'demo-user-id' ? '507f1f77bcf86cd799439011' : req.user.id;

    const exams = await Exam.find({ examiner: examinerId, status: 'published' })
        .sort({ createdAt: -1 })
        .select('title startDate endDate endTime status createdAt totalMarks resultsSent');

    const now = new Date();

    const examsWithStats = await Promise.all(
        exams.map(async (exam) => {
            const studentCount = await Candidate.countDocuments({ examId: exam._id });

            // Check if exam has ended
            let isExamEnded = false;
            if (exam.endDate && exam.endTime) {
                const examEndDateTime = new Date(`${exam.endDate}T${exam.endTime}`);
                isExamEnded = now >= examEndDateTime;
            }
            // If no end time set, check if exam has any submissions
            else {
                const Submission = (await import('../models/Submission.js')).default;
                const submissionCount = await Submission.countDocuments({ examId: exam._id });
                isExamEnded = submissionCount > 0;
            }

            return {
                id: exam._id,
                name: exam.title,
                date: exam.startDate || new Date(exam.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                endDate: exam.endDate,
                endTime: exam.endTime,
                participants: studentCount,
                avgScore: '75%',
                status: exam.resultsSent ? 'Results Sent' : 'Draft',
                isCalculated: isExamEnded,
                isExamEnded,
                hasEndTime: !!(exam.endDate && exam.endTime)
            };
        })
    );

    res.status(200).json({
        success: true,
        data: examsWithStats
    });
});

// @desc    Get exam questions for candidate
// @route   GET /api/exams/public/:id/questions
// @access  Public
export const getExamQuestions = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id).select('title duration questions sections violationLimits').lean();

    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    if (!exam.questions || exam.questions.length === 0) {
        res.status(200).json({
            success: true,
            data: {
                title: exam.title,
                duration: exam.duration,
                questions: [],
                sections: exam.sections || []
            }
        });
        return;
    }

    const formattedQuestions = exam.questions.map((q, index) => ({
        id: index + 1,
        questionNumber: index + 1,
        sectionId: q.sectionId || 0,
        type: 'mcq',
        question: q.text || q.question || '',
        options: q.options || [],
        marks: q.marks || 1
    }));

    res.status(200).json({
        success: true,
        data: {
            title: exam.title,
            duration: exam.duration,
            questions: formattedQuestions,
            sections: exam.sections || [],
            violationLimits: exam.violationLimits
        }
    });
});

// @desc    Get exam results details
// @route   GET /api/exams/:id/results
// @access  Private (Examiner)
export const getExamResults = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    const examinerId = req.user.id === 'demo-user-id' ? '507f1f77bcf86cd799439011' : req.user.id;
    if (exam.examiner.toString() !== examinerId) {
        res.status(401);
        throw new Error('Not authorized to access this exam');
    }

    const Submission = (await import('../models/Submission.js')).default;
    const submissions = await Submission.find({ examId: req.params.id })
        .populate('candidateId', 'name email candidateId')
        .sort({ score: -1 });

    // Fetch all violations for this exam at once
    const allViolations = await Violation.find({ examId: req.params.id }).lean();

    const students = submissions.map(sub => {
        const candidateIdStr = sub.candidateId?._id?.toString() || '';
        const violation = allViolations.find(v => v.candidateId === candidateIdStr);
        const violationLevel = violation ? violation.severity : 'None';
        const violationCounts = violation ? violation.violationCount : null;
        const screenshotUrl = violation ? violation.screenshotUrl : null;

        return {
            id: sub._id,
            name: sub.candidateId?.name || 'Unknown',
            roll: sub.candidateId?.candidateId || 'N/A',
            email: sub.candidateId?.email || '',
            marks: sub.score,
            total: sub.totalMarks,
            percentage: sub.percentage,
            timeTaken: (() => {
                const timeInSeconds = sub.timeTaken || 0;
                const minutes = Math.floor(timeInSeconds / 60);
                const seconds = timeInSeconds % 60;
                return minutes > 0 ? `${minutes} min ${seconds} sec` : `${seconds} sec`;
            })(),
            status: violationLevel === 'High' ? 'Cheating' : (sub.percentage >= 40 ? 'Pass' : 'Fail'),
            violationLevel,
            violationCounts,
            screenshotUrl
        };
    });

    const totalCandidates = students.length;
    const passedStudents = students.filter(s => s.violationLevel !== 'High' && s.percentage >= 40).length;
    const failedStudents = totalCandidates - passedStudents;
    const avgScore = totalCandidates > 0
        ? Math.round(students.reduce((acc, s) => acc + s.marks, 0) / totalCandidates)
        : 0;
    const highestScore = totalCandidates > 0
        ? Math.max(...students.map(s => s.marks))
        : 0;

    res.status(200).json({
        success: true,
        data: {
            examDetails: {
                name: exam.title,
                date: exam.startDate || new Date(exam.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                startDate: exam.startDate,
                startTime: exam.startTime,
                endDate: exam.endDate,
                endTime: exam.endTime,
                totalCandidates,
                passed: passedStudents,
                failed: failedStudents,
                avgScore,
                highestScore,
                status: 'Completed'
            },
            students
        }
    });
});


// @desc    Export exam results to Excel
// @route   GET /api/exams/:id/results/export
// @access  Private (Examiner)
export const exportExamResults = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    const examinerId = req.user.id === 'demo-user-id' ? '507f1f77bcf86cd799439011' : req.user.id;
    if (exam.examiner.toString() !== examinerId) {
        res.status(401);
        throw new Error('Not authorized to access this exam');
    }

    const Submission = (await import('../models/Submission.js')).default;
    const submissions = await Submission.find({ examId: req.params.id })
        .populate('candidateId', 'name email candidateId')
        .sort({ score: -1 });

    // Fetch all violations for this exam
    const allViolations = await Violation.find({ examId: req.params.id }).lean();

    const excelData = submissions.map((sub, index) => {
        const timeInSeconds = sub.timeTaken || 0;
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        const timeDisplay = minutes > 0 ? `${minutes} min ${seconds} sec` : `${seconds} sec`;

        const candidateIdStr = sub.candidateId?._id?.toString() || '';
        const violation = allViolations.find(v => v.candidateId === candidateIdStr);
        const violationLevel = violation ? violation.severity : 'None';

        let status;
        if (violationLevel === 'High') status = 'Cheating';
        else status = sub.percentage >= 40 ? 'Pass' : 'Fail';

        return {
            'S.No': index + 1,
            'Student Name': sub.candidateId?.name || 'Unknown',
            'Roll Number': sub.candidateId?.candidateId || 'N/A',
            'Email': sub.candidateId?.email || '',
            'Marks Obtained': sub.score,
            'Total Marks': sub.totalMarks,
            'Percentage': sub.percentage + '%',
            'Violation Level': violationLevel,
            'Time Taken': timeDisplay,
            'Status': status
        };
    });

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(excelData);

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Results');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename="${exam.title}_Results.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
});
