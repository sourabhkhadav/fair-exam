import transporter from '../config/email.js';

// Send exam notification email (without credentials)
export const sendExamNotification = async (to, examDetails) => {
    const formatDate = (dateStr) => {
        if (!dateStr || dateStr === 'TBD') return 'To Be Decided';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatTime = (timeStr) => {
        if (!timeStr || timeStr === 'TBD') return 'To Be Decided';
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'FairExam <sourabhkhadav2@gmail.com>',
        to,
        subject: `Upcoming Exam: ${examDetails.title}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 15px">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
                    <tr>
                        <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:35px 30px;text-align:center">
                            <div style="background:#fff;width:64px;height:64px;border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center">
                                <span style="font-size:32px">📝</span>
                            </div>
                            <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700">FairExam</h1>
                            <p style="margin:6px 0 0;color:rgba(255,255,255,0.95);font-size:13px">Online Examination Platform</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:35px 30px">
                            <p style="margin:0 0 6px;color:#64748b;font-size:14px">Dear Student,</p>
                            <p style="margin:0 0 28px;color:#1e293b;font-size:15px;line-height:1.7">
                                You have been scheduled for an upcoming exam. Please mark your calendar and ensure you are available during the exam window.
                            </p>
                            
                            <h2 style="margin:0 0 20px;color:#1e293b;font-size:19px;font-weight:700">${examDetails.title}</h2>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:22px">
                                <tr>
                                    <td style="padding:22px">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="50%" style="padding:0 10px 18px 0;border-bottom:1px solid #e2e8f0">
                                                    <p style="margin:0 0 6px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600">📅 Exam Date</p>
                                                    <p style="margin:0;color:#1e293b;font-size:16px;font-weight:700">${formatDate(examDetails.startDate)}</p>
                                                </td>
                                                <td width="50%" style="padding:0 0 18px 10px;border-bottom:1px solid #e2e8f0">
                                                    <p style="margin:0 0 6px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600">🕐 Start Time</p>
                                                    <p style="margin:0;color:#1e293b;font-size:16px;font-weight:700">${formatTime(examDetails.startTime)}</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td width="50%" style="padding:18px 10px 0 0">
                                                    <p style="margin:0 0 6px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600">🕒 End Time</p>
                                                    <p style="margin:0;color:#1e293b;font-size:16px;font-weight:700">${formatTime(examDetails.endTime)}</p>
                                                </td>
                                                <td width="50%" style="padding:18px 0 0 10px">
                                                    <p style="margin:0 0 6px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600">⏱️ Duration</p>
                                                    <p style="margin:0;color:#1e293b;font-size:16px;font-weight:700">${examDetails.duration} minutes</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#dbeafe;border-left:4px solid #3b82f6;border-radius:8px;margin-bottom:28px">
                                <tr>
                                    <td style="padding:16px 18px">
                                        <p style="margin:0;color:#1e40af;font-size:14px;line-height:1.7">
                                            <strong>🔐 Login Credentials:</strong> You will receive your login credentials (Candidate ID and Password) via email at the exam start time.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f8fafc;padding:22px 30px;border-top:1px solid #e2e8f0;text-align:center">
                            <p style="margin:0 0 6px;color:#1e293b;font-size:14px;font-weight:600">Best regards,</p>
                            <p style="margin:0 0 14px;color:#64748b;font-size:13px">FairExam Team</p>
                            <p style="margin:0;color:#94a3b8;font-size:11px">This is an automated email. Please do not reply.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    };

    return await transporter.sendMail(mailOptions);
};

// Send exam invitation email
export const sendExamInvitation = async (to, examDetails) => {
    const formatDate = (dateStr) => {
        if (!dateStr || dateStr === 'TBD') return 'To Be Decided';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatTime = (timeStr) => {
        if (!timeStr || timeStr === 'TBD') return 'To Be Decided';
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getEndDateTime = () => {
        if (!examDetails.startDate || !examDetails.startTime || !examDetails.duration) {
            return 'To Be Decided';
        }
        const startDateTime = new Date(`${examDetails.startDate}T${examDetails.startTime}`);
        const endDateTime = new Date(startDateTime.getTime() + examDetails.duration * 60000);
        return `${formatDate(endDateTime.toISOString().split('T')[0])} at ${formatTime(endDateTime.toTimeString().slice(0, 5))}`;
    };

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'FairExam <sourabhkhadav2@gmail.com>',
        to,
        subject: `Exam Invitation: ${examDetails.title}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
                    <tr>
                        <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="text-align:center">
                                        <div style="display:inline-block;background:#ffffff;width:56px;height:56px;border-radius:12px;line-height:56px;text-align:center;margin-bottom:16px">
                                            <span style="font-size:28px">📝</span>
                                        </div>
                                        <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:600;letter-spacing:-0.5px">FairExam</h1>
                                        <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.9);font-size:14px;font-weight:500">Online Examination Platform</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:40px 30px">
                            <p style="margin:0 0 8px 0;color:#6c757d;font-size:14px">Dear Student,</p>
                            <p style="margin:0 0 32px 0;color:#212529;font-size:15px;line-height:1.6">
                                You have been invited to take the following exam. Please ensure you are available during the scheduled time window.
                            </p>
                            
                            <h2 style="margin:0 0 24px 0;color:#212529;font-size:20px;font-weight:600">${examDetails.title}</h2>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;margin-bottom:24px">
                                <tr>
                                    <td style="padding:24px">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding:0 0 16px 0;border-bottom:1px solid #dee2e6">
                                                    <table width="100%" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td width="50%" style="padding:0 12px 0 0">
                                                                <p style="margin:0 0 4px 0;color:#6c757d;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Start Date</p>
                                                                <p style="margin:0;color:#212529;font-size:15px;font-weight:600">${formatDate(examDetails.startDate)}</p>
                                                            </td>
                                                            <td width="50%" style="padding:0 0 0 12px">
                                                                <p style="margin:0 0 4px 0;color:#6c757d;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Start Time</p>
                                                                <p style="margin:0;color:#212529;font-size:15px;font-weight:600">${formatTime(examDetails.startTime)}</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding:16px 0 0 0">
                                                    <table width="100%" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td width="50%" style="padding:0 12px 0 0">
                                                                <p style="margin:0 0 4px 0;color:#6c757d;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Duration</p>
                                                                <p style="margin:0;color:#212529;font-size:15px;font-weight:600">${examDetails.duration} minutes</p>
                                                            </td>
                                                            <td width="50%" style="padding:0 0 0 12px">
                                                                <p style="margin:0 0 4px 0;color:#6c757d;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">End Time</p>
                                                                <p style="margin:0;color:#212529;font-size:15px;font-weight:600">${getEndDateTime()}</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff3cd;border-left:4px solid #ffc107;border-radius:4px;margin-bottom:32px">
                                <tr>
                                    <td style="padding:16px 20px">
                                        <p style="margin:0;color:#856404;font-size:14px;line-height:1.6">
                                            <strong>Important:</strong> You must complete the exam within the ${examDetails.duration}-minute time window starting from ${formatTime(examDetails.startTime)}.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f8f9fa;padding:24px 30px;border-top:1px solid #dee2e6">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="text-align:center">
                                        <p style="margin:0 0 8px 0;color:#212529;font-size:14px;font-weight:500">Best regards,</p>
                                        <p style="margin:0 0 16px 0;color:#6c757d;font-size:14px">FairExam Team</p>
                                        <p style="margin:0;color:#adb5bd;font-size:11px">This is an automated email. Please do not reply.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    };

    return await transporter.sendMail(mailOptions);
};

// Send violation alert email
export const sendViolationAlert = async (to, violationDetails) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM || 'FairExam <sourabhkhadav2@gmail.com>',
        to,
        subject: `Violation Alert: ${violationDetails.examName}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 15px">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
                    <tr>
                        <td style="background:#dc2626;padding:35px 30px;text-align:center">
                            <div style="background:#fff;width:64px;height:64px;border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center">
                                <span style="font-size:32px">⚠️</span>
                            </div>
                            <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700">Violation Alert</h1>
                            <p style="margin:6px 0 0;color:rgba(255,255,255,0.95);font-size:13px">FairExam Proctoring System</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:35px 30px">
                            <p style="margin:0 0 28px;color:#1e293b;font-size:15px;line-height:1.7">
                                A violation has been detected during the exam:
                            </p>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:2px solid #ef4444;border-radius:10px;margin-bottom:22px">
                                <tr>
                                    <td style="padding:22px">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding:0 0 14px;border-bottom:1px solid #fecaca">
                                                    <p style="margin:0 0 4px;color:#991b1b;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600">Candidate</p>
                                                    <p style="margin:0;color:#7f1d1d;font-size:16px;font-weight:700">${violationDetails.candidateName}</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding:14px 0;border-bottom:1px solid #fecaca">
                                                    <p style="margin:0 0 4px;color:#991b1b;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600">Exam</p>
                                                    <p style="margin:0;color:#7f1d1d;font-size:16px;font-weight:700">${violationDetails.examName}</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding:14px 0;border-bottom:1px solid #fecaca">
                                                    <p style="margin:0 0 4px;color:#991b1b;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600">Violation Count</p>
                                                    <p style="margin:0;color:#7f1d1d;font-size:16px;font-weight:700">${violationDetails.violationCount}</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding:14px 0 0">
                                                    <p style="margin:0 0 4px;color:#991b1b;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600">Time</p>
                                                    <p style="margin:0;color:#7f1d1d;font-size:16px;font-weight:700">${new Date(violationDetails.timestamp).toLocaleString()}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:8px;margin-bottom:28px">
                                <tr>
                                    <td style="padding:16px 18px">
                                        <p style="margin:0;color:#92400e;font-size:14px;line-height:1.7">
                                            <strong>Action Required:</strong> Please review the violation report in the FairExam dashboard.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f8fafc;padding:22px 30px;border-top:1px solid #e2e8f0;text-align:center">
                            <p style="margin:0 0 6px;color:#1e293b;font-size:14px;font-weight:600">FairExam Team</p>
                            <p style="margin:0;color:#94a3b8;font-size:11px">This is an automated alert. Please do not reply.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    };

    return await transporter.sendMail(mailOptions);
};

// Send exam result email
export const sendExamResult = async (to, resultDetails) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM || 'FairExam <sourabhkhadav2@gmail.com>',
        to,
        subject: `Exam Results: ${resultDetails.examTitle}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 15px">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
                    <tr>
                        <td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:35px 30px;text-align:center">
                            <div style="background:#fff;width:64px;height:64px;border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center">
                                <span style="font-size:32px">🎓</span>
                            </div>
                            <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700">Exam Results</h1>
                            <p style="margin:6px 0 0;color:rgba(255,255,255,0.95);font-size:13px">FairExam Platform</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:35px 30px">
                            <p style="margin:0 0 28px;color:#1e293b;font-size:15px;line-height:1.7">
                                Your exam results are now available:
                            </p>
                            
                            <h2 style="margin:0 0 20px;color:#1e293b;font-size:19px;font-weight:700">${resultDetails.examTitle}</h2>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:2px solid #10b981;border-radius:10px;margin-bottom:22px">
                                <tr>
                                    <td style="padding:22px">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="50%" style="padding:0 10px 18px 0;border-bottom:1px solid #bbf7d0">
                                                    <p style="margin:0 0 6px;color:#065f46;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600">🎯 Score</p>
                                                    <p style="margin:0;color:#064e3b;font-size:20px;font-weight:700">${resultDetails.score}/${resultDetails.totalMarks}</p>
                                                </td>
                                                <td width="50%" style="padding:0 0 18px 10px;border-bottom:1px solid #bbf7d0">
                                                    <p style="margin:0 0 6px;color:#065f46;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600">📊 Percentage</p>
                                                    <p style="margin:0;color:#064e3b;font-size:20px;font-weight:700">${resultDetails.percentage}%</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="2" style="padding:18px 0 0">
                                                    <p style="margin:0 0 6px;color:#065f46;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600">✅ Status</p>
                                                    <p style="margin:0;color:#064e3b;font-size:18px;font-weight:700">${resultDetails.status}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#dbeafe;border-left:4px solid #3b82f6;border-radius:8px;margin-bottom:28px">
                                <tr>
                                    <td style="padding:16px 18px">
                                        <p style="margin:0;color:#1e40af;font-size:14px;line-height:1.7">
                                            Login to FairExam to view detailed results and analysis.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f8fafc;padding:22px 30px;border-top:1px solid #e2e8f0;text-align:center">
                            <p style="margin:0 0 6px;color:#1e293b;font-size:14px;font-weight:600">Best regards,</p>
                            <p style="margin:0 0 14px;color:#64748b;font-size:13px">FairExam Team</p>
                            <p style="margin:0;color:#94a3b8;font-size:11px">This is an automated email. Please do not reply.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    };

    return await transporter.sendMail(mailOptions);
};

// Send detailed exam result with violations
export const sendDetailedExamResult = async (to, resultDetails) => {
    const {
        examTitle, candidateName, candidateId, score, totalMarks, percentage, timeTaken,
        isPassed, failReason, passingPercentage, violationLevel, violationCounts, screenshotUrl, submittedAt
    } = resultDetails;

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const isCheating = failReason === 'cheating';

    // Build email content based on outcome
    let subjectLine, bannerBg, bannerText, bodyContent;

    if (isPassed) {
        // ======== PASS EMAIL: No marks, just "Ready for next round" ========
        subjectLine = `✅ Exam Results: ${examTitle} — Ready for Next Round`;
        bannerBg = '#dcfce7';
        bannerText = 'Congratulations! You are ready for the Next Round 🎉';

        bodyContent = `
                            <!-- Student Info -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0">
                                <tr>
                                    <td style="font-size:12px;color:#64748b;padding:0 8px 0 0">
                                        <strong style="color:#0f172a">${candidateName}</strong>
                                    </td>
                                    <td style="font-size:12px;color:#64748b;padding:0 8px">
                                        ${examTitle}
                                    </td>
                                    <td style="font-size:12px;color:#64748b;padding:0 0 0 8px;text-align:right">
                                        ${formatDate(submittedAt)}
                                    </td>
                                </tr>
                            </table>
                            <!-- Candidate ID -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;margin:0 0 16px 0">
                                <tr>
                                    <td style="padding:14px;text-align:center;border-right:1px solid #bbf7d0">
                                        <div style="font-size:11px;color:#065f46;margin:0 0 4px 0">Candidate ID</div>
                                        <div style="font-size:16px;font-weight:700;color:#064e3b">${candidateId || 'N/A'}</div>
                                    </td>
                                    <td style="padding:14px;text-align:center;border-right:1px solid #bbf7d0">
                                        <div style="font-size:11px;color:#065f46;margin:0 0 4px 0">Exam</div>
                                        <div style="font-size:16px;font-weight:700;color:#064e3b">${examTitle}</div>
                                    </td>
                                    <td style="padding:14px;text-align:center">
                                        <div style="font-size:11px;color:#065f46;margin:0 0 4px 0">Status</div>
                                        <div style="font-size:16px;font-weight:700;color:#059669">✅ Qualified</div>
                                    </td>
                                </tr>
                            </table>
                            <!-- Message -->
                            <div style="background:#ecfdf5;border-left:3px solid #10b981;padding:14px;border-radius:6px;margin:0">
                                <div style="font-size:14px;color:#065f46;line-height:1.6;margin:0">
                                    🎉 <strong>Great work, ${candidateName}!</strong> You have successfully cleared this round. 
                                    Stay prepared for the next round — further details will be communicated soon.
                                </div>
                            </div>`;

    } else if (isCheating) {
        // ======== FAIL EMAIL (CHEATING): Show cheating reason + screenshot ========
        subjectLine = `🚫 Exam Results: ${examTitle} — Disqualified`;
        bannerBg = '#fecaca';
        bannerText = '⚠️ Disqualified — Cheating Detected';

        const violationBreakdown = violationCounts ? `
                            <div style="font-size:12px;color:#7f1d1d;background:#fef2f2;padding:10px 14px;border-radius:6px;margin:0 0 14px 0">
                                <strong>Violation Breakdown:</strong> Face: ${violationCounts.faceDetection || 0} | Sound: ${violationCounts.soundDetection || 0} | Fullscreen: ${violationCounts.fullscreenExit || 0} | Tab Switch: ${violationCounts.tabSwitch || 0}
                            </div>` : '';

        const screenshotSection = screenshotUrl ? `
                            <div style="margin:0 0 14px 0;text-align:center">
                                <div style="font-size:11px;color:#7f1d1d;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;margin:0 0 8px 0">📸 Violation Screenshot</div>
                                <img src="${screenshotUrl}" alt="Violation Screenshot" style="max-width:100%;border-radius:8px;border:2px solid #fecaca" />
                            </div>` : '';

        bodyContent = `
                            <!-- Student Info -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0">
                                <tr>
                                    <td style="font-size:12px;color:#64748b;padding:0 8px 0 0">
                                        <strong style="color:#0f172a">${candidateName}</strong>
                                    </td>
                                    <td style="font-size:12px;color:#64748b;padding:0 8px">
                                        ${examTitle}
                                    </td>
                                    <td style="font-size:12px;color:#64748b;padding:0 0 0 8px;text-align:right">
                                        ${formatDate(submittedAt)}
                                    </td>
                                </tr>
                            </table>
                            <!-- Disqualification Card -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:2px solid #ef4444;border-radius:8px;margin:0 0 14px 0">
                                <tr>
                                    <td style="padding:16px;text-align:center">
                                        <div style="font-size:11px;color:#7f1d1d;margin:0 0 4px 0">Result</div>
                                        <div style="font-size:20px;font-weight:700;color:#dc2626">DISQUALIFIED</div>
                                        <div style="font-size:13px;color:#991b1b;margin:6px 0 0 0">Reason: Cheating / High Violation Level</div>
                                    </td>
                                </tr>
                            </table>
                            ${violationBreakdown}
                            ${screenshotSection}
                            <!-- Message -->
                            <div style="background:#fef2f2;border-left:3px solid #ef4444;padding:14px;border-radius:6px;margin:0">
                                <div style="font-size:13px;color:#991b1b;line-height:1.6;margin:0">
                                    Your exam has been flagged for <strong>cheating</strong> due to high violation activity detected during proctoring. 
                                    This decision is final. If you believe this was an error, please contact the examiner.
                                </div>
                            </div>`;

    } else {
        // ======== FAIL EMAIL (MARKS NOT SUFFICIENT): Show marks info ========
        subjectLine = `📋 Exam Results: ${examTitle}`;
        bannerBg = '#fed7aa';
        bannerText = 'You did not pass this time';

        const requiredMarks = Math.ceil((passingPercentage / 100) * totalMarks);

        const violationSection = (violationLevel && violationLevel !== 'None' && violationCounts) ? `
                            <div style="font-size:12px;color:#7f1d1d;background:#fef2f2;padding:10px 14px;border-radius:6px;margin:0 0 14px 0">
                                <strong>Proctoring Flags (${violationLevel}):</strong> Face: ${violationCounts.faceDetection || 0} | Sound: ${violationCounts.soundDetection || 0} | Fullscreen: ${violationCounts.fullscreenExit || 0} | Tab Switch: ${violationCounts.tabSwitch || 0}
                            </div>` : '';

        bodyContent = `
                            <!-- Student Info -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0">
                                <tr>
                                    <td style="font-size:12px;color:#64748b;padding:0 8px 0 0">
                                        <strong style="color:#0f172a">${candidateName}</strong>
                                    </td>
                                    <td style="font-size:12px;color:#64748b;padding:0 8px">
                                        ${examTitle}
                                    </td>
                                    <td style="font-size:12px;color:#64748b;padding:0 0 0 8px;text-align:right">
                                        ${formatDate(submittedAt)}
                                    </td>
                                </tr>
                            </table>
                            <!-- Performance Card -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;margin:0 0 14px 0">
                                <tr>
                                    <td style="padding:14px;text-align:center;border-right:1px solid #e2e8f0">
                                        <div style="font-size:11px;color:#64748b;margin:0 0 4px 0">Score</div>
                                        <div style="font-size:18px;font-weight:700;color:#0f172a">${score}/${totalMarks}</div>
                                    </td>
                                    <td style="padding:14px;text-align:center;border-right:1px solid #e2e8f0">
                                        <div style="font-size:11px;color:#64748b;margin:0 0 4px 0">Percentage</div>
                                        <div style="font-size:18px;font-weight:700;color:#dc2626">${percentage}%</div>
                                    </td>
                                    <td style="padding:14px;text-align:center;border-right:1px solid #e2e8f0">
                                        <div style="font-size:11px;color:#64748b;margin:0 0 4px 0">Passing</div>
                                        <div style="font-size:18px;font-weight:700;color:#0f172a">${passingPercentage}%</div>
                                    </td>
                                    <td style="padding:14px;text-align:center">
                                        <div style="font-size:11px;color:#64748b;margin:0 0 4px 0">Required</div>
                                        <div style="font-size:18px;font-weight:700;color:#dc2626">${requiredMarks}</div>
                                    </td>
                                </tr>
                            </table>
                            ${violationSection}
                            <!-- Message -->
                            <div style="background:#fff7ed;border-left:3px solid #f97316;padding:14px;border-radius:6px;margin:0">
                                <div style="font-size:13px;color:#9a3412;line-height:1.6;margin:0">
                                    Don't worry — you can improve in the next attempt. Keep practicing and you'll do better next time!
                                </div>
                            </div>`;
    }

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'FairExam <sourabhkhadav2@gmail.com>',
        to,
        subject: subjectLine,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:20px 10px">
        <tr>
            <td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
                    <!-- Header -->
                    <tr>
                        <td style="background:#0f172a;padding:16px 20px;text-align:center">
                            <div style="font-size:20px;font-weight:700;color:#fff;margin:0">FairExam</div>
                            <div style="font-size:11px;color:#94a3b8;margin:2px 0 0 0">Online Examination Platform</div>
                        </td>
                    </tr>
                    <!-- Status Banner -->
                    <tr>
                        <td style="background:${bannerBg};padding:14px 20px;text-align:center">
                            <div style="font-size:15px;font-weight:600;color:${isPassed ? '#065f46' : isCheating ? '#7f1d1d' : '#9a3412'};margin:0">
                                ${bannerText}
                            </div>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding:20px">
                            ${bodyContent}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background:#f8fafc;padding:12px 20px;text-align:center;border-top:1px solid #e2e8f0">
                            <div style="font-size:10px;color:#94a3b8;margin:0">This is an automated email. Please do not reply.</div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    };

    return await transporter.sendMail(mailOptions);
};

// Send test email
export const sendTestEmail = async (to) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM || 'FairExam <sourabhkhadav2@gmail.com>',
        to,
        subject: 'FairExam - Email Configuration Test',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 15px">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
                    <tr>
                        <td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:35px 30px;text-align:center">
                            <div style="background:#fff;width:64px;height:64px;border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center">
                                <span style="font-size:32px">✅</span>
                            </div>
                            <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700">Email Test Successful</h1>
                            <p style="margin:6px 0 0;color:rgba(255,255,255,0.95);font-size:13px">FairExam Configuration</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:35px 30px">
                            <p style="margin:0 0 28px;color:#1e293b;font-size:15px;line-height:1.7">
                                This is a test email from FairExam. Your Nodemailer configuration is working correctly.
                            </p>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:2px solid #10b981;border-radius:10px;margin-bottom:22px">
                                <tr>
                                    <td style="padding:22px;text-align:center">
                                        <p style="margin:0 0 8px;color:#065f46;font-size:13px;font-weight:600">Configuration Status</p>
                                        <p style="margin:0;color:#064e3b;font-size:20px;font-weight:700">✅ Working Perfectly</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px">
                                <tr>
                                    <td style="padding:18px;text-align:center">
                                        <p style="margin:0;color:#64748b;font-size:12px">Sent at: ${new Date().toLocaleString()}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f8fafc;padding:22px 30px;border-top:1px solid #e2e8f0;text-align:center">
                            <p style="margin:0 0 6px;color:#1e293b;font-size:14px;font-weight:600">FairExam Team</p>
                            <p style="margin:0;color:#94a3b8;font-size:11px">This is an automated test email.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    };

    return await transporter.sendMail(mailOptions);
};

// Send exam cancellation email
export const sendExamCancellation = async (to, examDetails) => {
    const formatDate = (dateStr) => {
        if (!dateStr || dateStr === 'TBD') return 'To Be Decided';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatTime = (timeStr) => {
        if (!timeStr || timeStr === 'TBD') return 'To Be Decided';
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'FairExam <sourabhkhadav2@gmail.com>',
        to,
        subject: `Exam Cancelled: ${examDetails.title}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 15px">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
                    <tr>
                        <td style="background:#1e293b;padding:35px 30px;text-align:center">
                            <div style="background:#fff;width:64px;height:64px;border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center">
                                <span style="font-size:32px">📝</span>
                            </div>
                            <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700">FairExam</h1>
                            <p style="margin:6px 0 0;color:#94a3b8;font-size:13px">Online Examination Platform</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#fee;border-left:4px solid #ef4444;padding:18px 30px">
                            <p style="margin:0;color:#991b1b;font-size:16px;font-weight:700">⚠️ Exam Cancelled</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:35px 30px">
                            <p style="margin:0 0 6px;color:#64748b;font-size:14px">Dear Student,</p>
                            <p style="margin:0 0 28px;color:#1e293b;font-size:15px;line-height:1.7">
                                The following exam has been cancelled:
                            </p>
                            
                            <h2 style="margin:0 0 20px;color:#1e293b;font-size:19px;font-weight:700">${examDetails.title}</h2>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:22px">
                                <tr>
                                    <td style="padding:22px">
                                        <p style="margin:0 0 8px;color:#64748b;font-size:12px;font-weight:600">Originally Scheduled:</p>
                                        <p style="margin:0;color:#1e293b;font-size:16px;font-weight:700">${formatDate(examDetails.startDate)} at ${formatTime(examDetails.startTime)}</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:8px;margin-bottom:28px">
                                <tr>
                                    <td style="padding:16px 18px">
                                        <p style="margin:0;color:#92400e;font-size:14px;line-height:1.7">
                                            You will receive further communication regarding any rescheduling.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f8fafc;padding:22px 30px;border-top:1px solid #e2e8f0;text-align:center">
                            <p style="margin:0 0 6px;color:#1e293b;font-size:14px;font-weight:600">Best regards,</p>
                            <p style="margin:0 0 14px;color:#64748b;font-size:13px">FairExam Team</p>
                            <p style="margin:0;color:#94a3b8;font-size:11px">This is an automated email. Please do not reply.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    };

    return await transporter.sendMail(mailOptions);
};

// Send exam start email with credentials
export const sendExamStartEmail = async (to, examDetails, candidateDetails) => {
    const formatDate = (dateStr) => {
        if (!dateStr || dateStr === 'TBD') return 'To Be Decided';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatTime = (timeStr) => {
        if (!timeStr || timeStr === 'TBD') return 'To Be Decided';
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getEndDateTime = () => {
        if (!examDetails.startDate || !examDetails.startTime || !examDetails.duration) {
            return 'To Be Decided';
        }
        const startDateTime = new Date(`${examDetails.startDate}T${examDetails.startTime}`);
        const endDateTime = new Date(startDateTime.getTime() + examDetails.duration * 60000);
        return `${formatDate(endDateTime.toISOString().split('T')[0])} at ${formatTime(endDateTime.toTimeString().slice(0, 5))}`;
    };

    const examUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/candidate-login?examId=${examDetails.examId}&candidateId=${candidateDetails.candidateId}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'FairExam <sourabhkhadav2@gmail.com>',
        to,
        subject: `Exam Started: ${examDetails.title} - Login Credentials`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="text-align:center">
                                        <div style="display:inline-block;background:#ffffff;width:56px;height:56px;border-radius:12px;line-height:56px;text-align:center;margin-bottom:16px">
                                            <span style="font-size:28px">📝</span>
                                        </div>
                                        <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:600;letter-spacing:-0.5px">FairExam</h1>
                                        <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.9);font-size:14px;font-weight:500">Online Examination Platform</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Status Banner -->
                    <tr>
                        <td style="background:#d4edda;border-left:4px solid #28a745;padding:16px 30px">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="vertical-align:middle">
                                        <span style="display:inline-block;width:20px;height:20px;background:#28a745;border-radius:50%;margin-right:12px;vertical-align:middle"></span>
                                        <span style="color:#155724;font-size:15px;font-weight:600;vertical-align:middle">Your Exam is Now Active</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding:40px 30px">
                            <p style="margin:0 0 8px 0;color:#6c757d;font-size:14px">Dear ${candidateDetails.name},</p>
                            <p style="margin:0 0 32px 0;color:#212529;font-size:15px;line-height:1.6">
                                Your exam is now active and ready to begin.
                            </p>
                            
                            <h2 style="margin:0 0 24px 0;color:#212529;font-size:20px;font-weight:600">${examDetails.title}</h2>
                            
                            <!-- Exam Details Card -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;margin-bottom:24px">
                                <tr>
                                    <td style="padding:24px">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding:0 0 16px 0;border-bottom:1px solid #dee2e6">
                                                    <table width="100%" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td width="50%" style="padding:0 12px 0 0">
                                                                <p style="margin:0 0 4px 0;color:#6c757d;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Start Date</p>
                                                                <p style="margin:0;color:#212529;font-size:15px;font-weight:600">${formatDate(examDetails.startDate)}</p>
                                                            </td>
                                                            <td width="50%" style="padding:0 0 0 12px">
                                                                <p style="margin:0 0 4px 0;color:#6c757d;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Start Time</p>
                                                                <p style="margin:0;color:#212529;font-size:15px;font-weight:600">${formatTime(examDetails.startTime)}</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding:16px 0 0 0">
                                                    <table width="100%" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td width="50%" style="padding:0 12px 0 0">
                                                                <p style="margin:0 0 4px 0;color:#6c757d;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Duration</p>
                                                                <p style="margin:0;color:#212529;font-size:15px;font-weight:600">${examDetails.duration} minutes</p>
                                                            </td>
                                                            <td width="50%" style="padding:0 0 0 12px">
                                                                <p style="margin:0 0 4px 0;color:#6c757d;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">End Time</p>
                                                                <p style="margin:0;color:#212529;font-size:15px;font-weight:600">${getEndDateTime()}</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Important Notice -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff3cd;border-left:4px solid #ffc107;border-radius:4px;margin-bottom:32px">
                                <tr>
                                    <td style="padding:16px 20px">
                                        <p style="margin:0;color:#856404;font-size:14px;line-height:1.6">
                                            <strong>Time Window:</strong> You must login and complete the exam between ${formatTime(examDetails.startTime)} and the end time. The exam will auto-submit after ${examDetails.duration} minutes.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Login Credentials -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#e7f3ff;border:2px solid #0066cc;border-radius:8px;margin-bottom:32px">
                                <tr>
                                    <td style="padding:24px">
                                        <p style="margin:0 0 20px 0;color:#004085;font-size:16px;font-weight:600;text-align:center">Your Login Credentials</p>
                                        <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:6px;overflow:hidden">
                                            <tr>
                                                <td style="padding:16px 20px;border-bottom:1px solid #e7f3ff">
                                                    <p style="margin:0 0 6px 0;color:#6c757d;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">Candidate ID</p>
                                                    <p style="margin:0;color:#212529;font-size:18px;font-weight:700;font-family:'Courier New',monospace;letter-spacing:1px">${candidateDetails.candidateId}</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding:16px 20px">
                                                    <p style="margin:0 0 6px 0;color:#6c757d;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">Password</p>
                                                    <p style="margin:0;color:#212529;font-size:18px;font-weight:700;font-family:'Courier New',monospace;letter-spacing:1px">${candidateDetails.password}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
                                <tr>
                                    <td align="center">
                                        <a href="${examUrl}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;padding:16px 48px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 4px 12px rgba(102,126,234,0.4)">
                                            Login to Exam Portal
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Link -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="text-align:center">
                                        <p style="margin:0 0 8px 0;color:#6c757d;font-size:12px">Or copy this link:</p>
                                        <p style="margin:0;color:#0066cc;font-size:11px;word-break:break-all;background:#f8f9fa;padding:12px;border-radius:4px">${examUrl}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background:#f8f9fa;padding:24px 30px;border-top:1px solid #dee2e6">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="text-align:center">
                                        <p style="margin:0 0 8px 0;color:#212529;font-size:14px;font-weight:500">Best regards,</p>
                                        <p style="margin:0 0 16px 0;color:#6c757d;font-size:14px">FairExam Team</p>
                                        <p style="margin:0;color:#adb5bd;font-size:11px">This is an automated email. Please do not reply.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    };

    return await transporter.sendMail(mailOptions);
};

// Send OTP email for password reset
export const sendOtpEmail = async (to, otp, name) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM || 'FairExam <sourabhkhadav2@gmail.com>',
        to,
        subject: 'Password Reset OTP - FairExam',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 15px">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
                    <tr>
                        <td style="background:#1e293b;padding:35px 30px;text-align:center">
                            <div style="background:#fff;width:64px;height:64px;border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center">
                                <span style="font-size:32px">🔐</span>
                            </div>
                            <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700">Password Reset</h1>
                            <p style="margin:6px 0 0;color:#94a3b8;font-size:13px">FairExam Security</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:35px 30px">
                            <p style="margin:0 0 6px;color:#64748b;font-size:14px">Dear ${name},</p>
                            <p style="margin:0 0 28px;color:#1e293b;font-size:15px;line-height:1.7">
                                We received a request to reset your password. Use the OTP below to proceed:
                            </p>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#dbeafe;border:2px solid #3b82f6;border-radius:10px;margin-bottom:22px">
                                <tr>
                                    <td style="padding:28px;text-align:center">
                                        <p style="margin:0 0 12px;color:#1e40af;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Your OTP Code</p>
                                        <p style="margin:0;color:#1e3a8a;font-size:36px;font-weight:700;letter-spacing:10px;font-family:'Courier New',monospace">${otp}</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fee;border-left:4px solid #ef4444;border-radius:8px;margin-bottom:22px">
                                <tr>
                                    <td style="padding:16px 18px;text-align:center">
                                        <p style="margin:0;color:#991b1b;font-size:13px;font-weight:600">⏰ This OTP will expire in 10 minutes</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:8px;margin-bottom:28px">
                                <tr>
                                    <td style="padding:16px 18px">
                                        <p style="margin:0;color:#92400e;font-size:14px;line-height:1.7">
                                            If you didn't request this, please ignore this email and your password will remain unchanged.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f8fafc;padding:22px 30px;border-top:1px solid #e2e8f0;text-align:center">
                            <p style="margin:0 0 6px;color:#1e293b;font-size:14px;font-weight:600">FairExam Security Team</p>
                            <p style="margin:0;color:#94a3b8;font-size:11px">This is an automated email. Please do not reply.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    };

    return await transporter.sendMail(mailOptions);
};
