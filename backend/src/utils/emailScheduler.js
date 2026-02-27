import Exam from '../models/Exam.js';
import Candidate from '../models/Candidate.js';
import { sendExamNotification, sendExamStartEmail } from './emailService.js';

// Check and send scheduled emails every minute
let isRunning = false;

export const startEmailScheduler = () => {
    // Silently start scheduler without logs
    setInterval(async () => {
        if (isRunning) {
            return;
        }

        isRunning = true;
        try {
            const now = new Date();
            // Convert to IST (+5:30) securely
            const istOffset = 5.5 * 60 * 60 * 1000;
            const istTime = new Date(now.getTime() + istOffset);

            const year = istTime.getUTCFullYear();
            const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
            const day = String(istTime.getUTCDate()).padStart(2, '0');
            const hours = String(istTime.getUTCHours()).padStart(2, '0');
            const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');

            const currentDate = `${year}-${month}-${day}`;
            const currentTime = `${hours}:${minutes}`;

            const scheduledExams = await Exam.find({
                status: 'published',
                scheduleEmailDate: currentDate,
                scheduleEmailTime: { $lte: currentTime },
                emailSent: false
            });

            for (const exam of scheduledExams) {
                const candidates = await Candidate.find({ examId: exam._id });

                if (candidates.length === 0) continue;

                const examDetails = {
                    title: exam.title,
                    startDate: exam.startDate || 'TBD',
                    startTime: exam.startTime || 'TBD',
                    endTime: exam.endTime || 'TBD',
                    duration: exam.duration || 0
                };

                for (const candidate of candidates) {
                    if (candidate.email) {
                        try {
                            await sendExamNotification(candidate.email, examDetails);
                        } catch (error) {
                            console.error(`Failed to send to ${candidate.email}`);
                        }
                    }
                }

                exam.emailSent = true;
                await exam.save();
            }

            const startingExams = await Exam.find({
                status: 'published',
                startDate: currentDate,
                startTime: { $lte: currentTime },
                examStartEmailSent: false
            });

            console.log(`[EmailScheduler] Found ${startingExams.length} starting exams for ${currentDate} <= ${currentTime}`);

            for (const exam of startingExams) {
                console.log(`[EmailScheduler] Processing exam: ${exam.title} (${exam._id})`);
                const candidates = await Candidate.find({ examId: exam._id });

                if (candidates.length === 0) continue;

                const examDetails = {
                    examId: exam._id,
                    title: exam.title,
                    startDate: exam.startDate || 'TBD',
                    startTime: exam.startTime || 'TBD',
                    duration: exam.duration || 0
                };

                for (const candidate of candidates) {
                    if (candidate.email) {
                        if (!candidate.candidateId || !candidate.password) {
                            const candidateId = `CAND${exam._id.toString().slice(-4)}${String(candidates.indexOf(candidate) + 1).padStart(4, '0')}`;
                            const password = Math.random().toString(36).slice(-8).toUpperCase();
                            candidate.candidateId = candidateId;
                            candidate.password = password;
                            await candidate.save();
                        }

                        try {
                            const candidateDetails = {
                                name: candidate.name,
                                candidateId: candidate.candidateId,
                                password: candidate.password
                            };
                            await sendExamStartEmail(candidate.email, examDetails, candidateDetails);
                            console.log(`[EmailScheduler] Successfully sent start email to ${candidate.email}`);
                        } catch (error) {
                            console.error(`[EmailScheduler] Failed to send start email to ${candidate.email}:`, error);
                        }
                    }
                }

                exam.examStartEmailSent = true;
                await exam.save();
            }
        } catch (error) {
            console.error('[EmailScheduler] Error in scheduler:', error);
        } finally {
            isRunning = false;
        }
    }, 60000);
};
