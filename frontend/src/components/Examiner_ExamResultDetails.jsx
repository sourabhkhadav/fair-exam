import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import {
    ChevronLeft, Search, Filter, ArrowUpDown, MoreHorizontal,
    UserCheck, UserX, BarChart3, PieChart, TrendingUp, CheckCircle,
    XCircle, Clock, AlertCircle, FileText, Download, User, Send, AlertTriangle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const Examiner_ExamResultDetails = () => {
    const navigate = useNavigate();
    const { id: examId } = useParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [cutoff, setCutoff] = useState(40);
    const [examDetails, setExamDetails] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [sending, setSending] = useState(false);
    const [examStatus, setExamStatus] = useState('Completed');

    const getExamStatus = (exam) => {
        if (!exam.startDate || !exam.startTime || !exam.endDate || !exam.endTime) {
            return 'Completed';
        }
        const now = new Date();
        const startDateTime = new Date(`${exam.startDate}T${exam.startTime}`);
        const endDateTime = new Date(`${exam.endDate}T${exam.endTime}`);

        if (now < startDateTime) return 'Scheduled';
        if (now >= startDateTime && now <= endDateTime) return 'Live';
        return 'Completed';
    };

    useEffect(() => {
        fetchExamResults();
    }, [examId]);

    const fetchExamResults = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/exams/${examId}/results`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                const details = data.data.examDetails;
                setExamDetails(details);
                setStudents(data.data.students);
                setExamStatus(getExamStatus(details));
            }
        } catch (error) {
            console.error('Error fetching results:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.roll.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleExportReport = async () => {
        setExporting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/exams/${examId}/results/export`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${examDetails.name}_Results.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error exporting report:', error);
            toast.error('Failed to export report');
        } finally {
            setExporting(false);
        }
    };

    const handlePublishResults = async () => {
        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/submissions/send-results/${examId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ passingPercentage: cutoff })
            });

            const data = await response.json();

            if (data.success) {
                const storedStatuses = JSON.parse(localStorage.getItem('exam_statuses') || '{}');
                storedStatuses[examId] = "Results Sent";
                localStorage.setItem('exam_statuses', JSON.stringify(storedStatuses));

                toast.success(`Results sent successfully! ${data.results.sent} emails sent, ${data.results.failed} failed.`);
                navigate(-1);
            } else {
                toast.error('Failed to send results: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error sending results:', error);
            toast.error('Failed to send results. Please try again.');
        } finally {
            setSending(false);
        }
    };

    // Calculate dynamic stats based on cutoff (mock data is limited to 10 students)
    const passedCount = students.filter(s => s.violationLevel !== 'High' && s.percentage >= cutoff).length;
    const failedCount = students.length - passedCount;
    const totalStudents = students.length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F172A]"></div>
            </div>
        );
    }

    if (!examDetails) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg font-medium text-slate-600">Exam not found</div>
            </div>
        );
    }

    const StatCard = ({ icon: Icon, label, value, subtext }) => (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-slate-600" strokeWidth={2} />
                </div>
                {subtext && <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">{subtext}</span>}
            </div>
            <div>
                <div className="text-3xl font-bold text-slate-800 mb-1">{value}</div>
                <div className="text-sm font-medium text-slate-500">{label}</div>
            </div>
        </div>
    );

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-500 hover:text-[#0F172A] transition-colors text-sm font-medium group mb-2"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Results
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{examDetails.name}</h1>
                    <div className="flex items-center gap-4 text-slate-500 text-sm font-medium">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {examDetails.date}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${examStatus === 'Live' ? 'bg-amber-500 animate-pulse' :
                                examStatus === 'Completed' ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}></span>
                            {examStatus}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm mr-2">
                        <span className="text-sm font-medium text-slate-600">Pass Cutoff:</span>
                        <input
                            type="number"
                            value={cutoff}
                            onChange={(e) => setCutoff(Number(e.target.value))}
                            className="w-12 text-center font-bold text-slate-900 outline-none border-b border-slate-200 focus:border-[#0F172A] transition-colors"
                        />
                        <span className="text-sm font-medium text-slate-400">%</span>
                    </div>

                    <button onClick={handleExportReport} disabled={exporting} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                        <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
                        {exporting ? 'Exporting...' : 'Export Report'}
                    </button>
                    <button
                        onClick={handlePublishResults}
                        disabled={sending || examStatus === 'Live'}
                        className={`px-5 py-2.5 font-medium text-sm rounded-xl transition-colors shadow-lg shadow-slate-100 flex items-center gap-2 ${sending || examStatus === 'Live'
                            ? 'bg-slate-400 text-white cursor-not-allowed'
                            : 'bg-[#0F172A] text-white hover:bg-[#1E293B] cursor-pointer'
                            }`}
                    >
                        {sending ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Sending Results...
                            </>
                        ) : examStatus === 'Live' ? (
                            <>
                                <AlertCircle className="w-4 h-4" />
                                Exam is Live
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Send Results
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={User}
                    label="Total Candidates"
                    value={totalStudents}
                />
                <StatCard
                    icon={CheckCircle}
                    label="Passed Students"
                    value={passedCount}
                    subtext={`${((passedCount / totalStudents) * 100).toFixed(1)}%`}
                />
                <StatCard
                    icon={XCircle}
                    label="Failed Students"
                    value={failedCount}
                    subtext={`${((failedCount / totalStudents) * 100).toFixed(1)}%`}
                />
                <StatCard
                    icon={BarChart3}
                    label="Average Score"
                    value={`${examDetails.avgScore}/${examDetails.totalCandidates > 0 ? Math.round(students.reduce((acc, s) => acc + s.total, 0) / students.length) : 100}`}
                    subtext={`Highest: ${examDetails.highestScore}`}
                />
            </div>

            {/* Students List */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-slate-800">Student Results</h2>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name or roll number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200 text-left">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Roll Number</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Marks Obtained</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Percentage</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Violation</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Time Taken</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[#0F172A] font-bold text-sm">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-900">{student.name}</div>
                                                <div className="text-xs text-slate-500">{student.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-medium text-sm">{student.roll}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`font-bold text-base ${student.percentage < 40 ? 'text-rose-600' : 'text-slate-700'}`}>
                                            {student.marks}
                                            <span className="text-slate-400 text-xs font-normal ml-1">/ {student.total}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="w-full max-w-[100px] mx-auto h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${student.percentage < 40 ? 'bg-rose-500' :
                                                    student.percentage >= 80 ? 'bg-emerald-500' : 'bg-blue-500'
                                                    }`}
                                                style={{ width: `${student.percentage}%` }}
                                            />
                                        </div>
                                        <div className="text-xs font-semibold text-slate-500 mt-1.5">
                                            {student.percentage}%
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {(() => {
                                            const level = student.violationLevel || 'None';
                                            const styles = {
                                                'None': 'bg-slate-50 text-slate-500 border-slate-200',
                                                'Low': 'bg-yellow-50 text-yellow-700 border-yellow-200',
                                                'Medium': 'bg-orange-50 text-orange-700 border-orange-200',
                                                'High': 'bg-red-50 text-red-700 border-red-200'
                                            };
                                            return (
                                                <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border ${styles[level] || styles['None']}`}>
                                                    {level === 'High' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                                    {level}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {(() => {
                                            const isHighViolation = student.violationLevel === 'High';
                                            const passed = !isHighViolation && student.percentage >= cutoff;
                                            const statusText = isHighViolation ? 'Cheating' : (passed ? 'Pass' : 'Fail');
                                            const statusStyle = isHighViolation
                                                ? 'bg-red-100 text-red-800 border-red-300'
                                                : passed
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-rose-50 text-rose-700 border-rose-200';
                                            const StatusIcon = isHighViolation ? AlertTriangle : (passed ? CheckCircle : XCircle);
                                            return (
                                                <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border ${statusStyle}`}>
                                                    <StatusIcon className="w-3 h-3 mr-1.5" />
                                                    {statusText}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-500 text-sm font-medium">
                                        {student.timeTaken}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredStudents.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No students found</h3>
                        <p className="text-slate-500">Try adjusting your search query</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Examiner_ExamResultDetails;
