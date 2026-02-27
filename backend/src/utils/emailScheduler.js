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
            const currentDate = now.toISOString().split('T')[0];
            const currentTime = now.toTimeString().slice(0, 5);

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

            for (const exam of startingExams) {
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
                        } catch (error) {
                            console.error(`Failed to send start email to ${candidate.email}`);
                        }
                    }
                }

                exam.examStartEmailSent = true;
                await exam.save();
            }
        } catch (error) {
            // Silently handle errors
        } finally {
            isRunning = false;
        }
    }, 60000);
};
