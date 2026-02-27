import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import {
    LayoutDashboard, PlusCircle, BookOpen, Database, Monitor,
    AlertCircle, FileCheck, BarChart3, UserCircle, Shield,
    Clock, Users, CheckCircle, ChevronRight, Search, Bell,
    FileText, UserPlus, ClipboardCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const getExamStatus = (exam) => {
    const now = new Date();
    const startDateTime = new Date(`${exam.startDate}T${exam.startTime}`);
    const endDateTime = new Date(`${exam.endDate}T${exam.endTime}`);

    if (now < startDateTime) return 'Scheduled';
    if (now >= startDateTime && now <= endDateTime) return 'Live';
    if (now > endDateTime) return 'Completed';
    return exam.status === 'published' ? 'Scheduled' : 'Draft';
};

const StatCard = ({ icon: Icon, label, value, iconColor }) => (
    <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center gap-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconColor}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <div className="text-[#64748B] text-sm font-medium mb-0.5">{label}</div>
            <div className="text-[#0F172A] text-2xl font-medium">{value}</div>
        </div>
    </div>
);

const Examiner_Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalExams: 0,
        activeExams: 0
    });
    const [recentExams, setRecentExams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchDashboardData();
    }, [navigate]);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/exams/dashboard/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                localStorage.clear();
                navigate('/login');
                return;
            }

            const data = await response.json();

            if (data.success) {
                setStats({
                    totalExams: data.data.totalExams,
                    activeExams: data.data.activeExams
                });
                setRecentExams(data.data.recentExams);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            localStorage.clear();
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F172A]"></div>
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        <StatCard icon={FileText} label="Total Exams Created" value={stats.totalExams} iconColor="bg-[#0F172A]" />
                        <StatCard icon={Clock} label="Active Exams" value={stats.activeExams} iconColor="bg-[#334155]" />
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white p-8 rounded-3xl border border-[#E2E8F0] shadow-sm mb-10">
                        <h2 className="text-xl font-medium text-[#0F172A] mb-6">Quick Actions</h2>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={() => {
                                    localStorage.removeItem('examDraft');
                                    navigate('/create-exam');
                                }}
                                className="px-8 py-3.5 bg-[#0F172A] text-white font-medium text-[15px] rounded-xl hover:bg-[#1E293B] transition-all shadow-sm cursor-pointer"
                            >
                                Create New Exam
                            </button>
                            <button
                                onClick={() => navigate('/violation-reports')}
                                className="px-8 py-3.5 bg-white border border-[#E2E8F0] text-[#0F172A] font-semibold text-[15px] rounded-xl hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                            >
                                View Violation Reports
                            </button>
                            <button
                                onClick={() => navigate('/results-publishing')}
                                className="px-8 py-3.5 bg-white border border-[#E2E8F0] text-[#0F172A] font-semibold text-[15px] rounded-xl hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                            >
                                Publish Results
                            </button>
                        </div>
                    </div>

                    {/* Recent Exams Section */}
                    <div className="bg-white p-4 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm">
                        <h2 className="text-xl font-medium text-[#0F172A] mb-8">Recent Exams</h2>
                        {recentExams.length === 0 ? (
                            <div className="text-center py-12 text-[#64748B]">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No exams created yet. Create your first exam to get started!</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left text-[#0F172A] text-[13px] font-medium border-b border-[#F1F5F9]">
                                                <th className="pb-4 font-medium whitespace-nowrap uppercase tracking-wider">Exam Name</th>
                                                <th className="pb-4 font-medium whitespace-nowrap uppercase tracking-wider">Date</th>
                                                <th className="pb-4 font-medium text-center whitespace-nowrap uppercase tracking-wider">Students</th>
                                                <th className="pb-4 font-medium text-center whitespace-nowrap uppercase tracking-wider">Status</th>
                                                <th className="pb-4 font-medium text-right whitespace-nowrap uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#F1F5F9]">
                                            {recentExams.map((exam, i) => {
                                                const status = getExamStatus(exam);
                                                return (
                                                    <tr key={exam._id || i} className="group">
                                                        <td className="py-5 font-medium text-[#0F172A] whitespace-nowrap">{exam.name}</td>
                                                        <td className="py-5 text-[#64748B] whitespace-nowrap">{exam.date}</td>
                                                        <td className="py-5 text-[#64748B] text-center whitespace-nowrap">{exam.students}</td>
                                                        <td className="py-5 text-center whitespace-nowrap">
                                                            <span className={`px-4 py-1.5 rounded-full text-[12px] font-semibold ${status === 'Live'
                                                                    ? 'bg-[#FEF3C7] text-[#F59E0B]'
                                                                    : status === 'Scheduled'
                                                                        ? 'bg-[#F1F5F9] text-[#334155]'
                                                                        : status === 'Completed'
                                                                            ? 'bg-[#F0FDF4] text-[#22C55E]'
                                                                            : 'bg-[#F8FAFC] text-[#64748B]'
                                                                }`}>
                                                                {status}
                                                            </span>
                                                        </td>
                                                        <td className="py-5 text-right whitespace-nowrap">
                                                            <button
                                                                onClick={() => navigate(`/exam-results/${exam._id}`)}
                                                                className="text-[#0F172A] font-semibold text-[14px] hover:underline cursor-pointer"
                                                            >
                                                                View Details
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Examiner_Dashboard;
