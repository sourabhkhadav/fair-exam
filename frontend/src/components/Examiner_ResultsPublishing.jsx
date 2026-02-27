import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { Send, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Examiner_ResultsPublishing = () => {
    const navigate = useNavigate();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sendingExamId, setSendingExamId] = useState(null);

    const formatDateTime = (date, time) => {
        if (!date || !time) return null;

        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        const formattedTime = `${hour12}:${minutes} ${ampm}`;

        return `${formattedDate}, ${formattedTime}`;
    };

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/exams/results/publishing`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setExams(data.data);
            }
        } catch (error) {
            console.error('Error fetching exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async (id) => {
        setSendingExamId(id);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/submissions/send-results/${id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ passingPercentage: 40 })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`Results sent successfully! ${data.results.sent} emails sent, ${data.results.failed} failed.`);
                fetchExams();
            } else {
                toast.error('Failed to send results: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error sending results:', error);
            toast.error('Failed to send results. Please try again.');
        } finally {
            setSendingExamId(null);
        }
    };

    return (
        <div className="p-10">
            <div className="max-w-6xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-[32px] font-medium text-[#0F172A] tracking-tight">Results & Publishing</h1>
                    <p className="text-[#0F172A]/70 text-[16px] font-medium mt-1">Review student performance and release results to public profiles.</p>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                    <div className="mb-8">
                        <h2 className="text-xl font-medium text-[#0F172A]">Detailed Overview</h2>
                        <p className="text-[#0F172A]/50 text-sm mt-0.5">Showing all participants sorted by performance.</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F172A]"></div>
                        </div>
                    ) : exams.length === 0 ? (
                        <div className="text-center py-12 text-[#64748B]">No published exams found.</div>
                    ) : (
                        <div className="overflow-x-auto -mx-6 sm:mx-0 px-6 sm:px-0">
                            <table className="w-full min-w-[800px]">
                                <thead>
                                    <tr className="text-left text-[#0F172A] text-[13px] font-medium uppercase tracking-wider border-b border-[#F1F5F9]">
                                        <th className="pb-6">Exam Name</th>
                                        <th className="pb-6">Date Conducted</th>
                                        <th className="pb-6">End Date & Time</th>
                                        <th className="pb-6 text-center">Participants</th>
                                        <th className="pb-6 text-center">Result Status</th>
                                        <th className="pb-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F1F5F9]">
                                    {exams.map((exam) => (
                                        <tr key={exam.id} className="group hover:bg-[#F8FAFC]/50 transition-all duration-300">
                                            <td className="py-6 font-medium text-[#0F172A] whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/exam-results/${exam.id}`)}
                                                        className="font-medium text-[#0F172A] hover:text-[#0F172A] hover:underline transition-colors text-left"
                                                    >
                                                        {exam.name}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-6 text-[#0F172A]/70 font-medium whitespace-nowrap">{exam.date}</td>
                                            <td className="py-6 text-[#0F172A]/70 font-medium whitespace-nowrap">
                                                {exam.hasEndTime ? (
                                                    <span>{formatDateTime(exam.endDate, exam.endTime)}</span>
                                                ) : (
                                                    <span className="text-amber-600 font-semibold">Not Set</span>
                                                )}
                                            </td>
                                            <td className="py-6 text-center text-[#0F172A]/70 font-medium whitespace-nowrap">{exam.participants}</td>
                                            <td className="py-6 text-center whitespace-nowrap">
                                                <span className={`px-4 py-1.5 rounded-full text-[11px] sm:text-[12px] font-bold flex items-center gap-1.5 justify-center w-fit mx-auto ${exam.isCalculated ? 'bg-slate-50 text-slate-800 border border-slate-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                                                    }`}>
                                                    {exam.isCalculated ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                    {exam.isCalculated ? 'Exam Ended' : 'In Progress'}
                                                </span>
                                            </td>
                                            <td className="py-6 text-right whitespace-nowrap">
                                                {exam.status !== 'Results Sent' ? (
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <button
                                                            onClick={() => navigate(`/exam-results/${exam.id}`)}
                                                            className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#0F172A] font-medium text-[11px] rounded-lg hover:bg-[#F8FAFC] transition-all flex items-center gap-2 cursor-pointer"
                                                        >
                                                            View Details
                                                        </button>
                                                        <button
                                                            onClick={() => handlePublish(exam.id)}
                                                            disabled={!exam.isCalculated || sendingExamId === exam.id}
                                                            className={`px-6 py-2 font-medium text-[11px] rounded-lg transition-all shadow-sm flex items-center gap-2 cursor-pointer ${sendingExamId === exam.id
                                                                ? 'bg-slate-400 text-white cursor-not-allowed'
                                                                : exam.isCalculated
                                                                    ? 'bg-[#0F172A] text-white hover:bg-[#1E293B]'
                                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            {sendingExamId === exam.id ? (
                                                                <>
                                                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                    Sending...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Send className="w-3 h-3" /> Send Results
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <button
                                                            onClick={() => navigate(`/exam-results/${exam.id}`)}
                                                            className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#0F172A] font-medium text-[11px] rounded-lg hover:bg-[#F8FAFC] transition-all flex items-center gap-2 cursor-pointer"
                                                        >
                                                            View Details
                                                        </button>
                                                        <button className="px-6 py-2 bg-white border border-[#E2E8F0] text-[#0F172A] font-medium text-[11px] rounded-lg hover:bg-[#F8FAFC] transition-all flex items-center gap-2 ml-auto cursor-pointer">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Results Sent
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Examiner_ResultsPublishing;
