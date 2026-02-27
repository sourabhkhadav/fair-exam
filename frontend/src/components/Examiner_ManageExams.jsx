import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import {
    LayoutDashboard, PlusCircle, BookOpen, Monitor,
    AlertCircle, FileCheck, BarChart3, UserCircle, Shield,
    Search, Calendar, Clock, Users, Edit3, Trash2, ChevronDown, Settings, Mail
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Examiner_ManageExams = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [exams, setExams] = useState([]);

    const fetchExams = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/exams`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                // Transform backend data to frontend structure
                const formattedExams = await Promise.all(data.data.map(async (e) => {
                    const now = new Date();
                    let status = "Draft";

                    if (e.status === 'published') {
                        const start = new Date(`${e.startDate}T${e.startTime || '00:00'}`);
                        const end = new Date(`${e.endDate}T${e.endTime || '23:59'}`);

                        if (now < start) {
                            status = 'Scheduled';
                        } else if (now >= start && now <= end) {
                            status = 'Live';
                        } else if (now > end) {
                            status = 'Finished';
                        } else {
                            status = 'Public';
                        }
                    } else if (e.status === 'draft') {
                        status = 'Draft';
                    }

                    // Fetch candidate count
                    let candidateCount = 0;
                    try {
                        const candidateResponse = await fetch(`${API_BASE_URL}/candidates/exam/${e._id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const candidateData = await candidateResponse.json();
                        if (candidateData.success) {
                            candidateCount = candidateData.data.length;
                        }
                    } catch (err) {
                        console.error('Failed to fetch candidates:', err);
                    }

                    return {
                        id: e._id,
                        title: e.title,
                        date: e.startDate || "TBD",
                        startTime: e.startTime || "TBD",
                        duration: `${e.duration || 0} min`,
                        students: candidateCount,
                        status: status,
                        examData: e
                    };
                }));
                setExams(formattedExams);
            }
        } catch (error) {
            console.error("Failed to fetch exams", error);
        }
    };

    useEffect(() => {
        fetchExams();
    }, []);

    // Scheduling Logic: Check every minute if an exam should go Public
    useEffect(() => {
        const checkScheduling = () => {
            const now = new Date();
            setExams(prev => prev.map(exam => {
                if (exam.status === 'Scheduled' && exam.examData?.startDate && exam.examData?.startTime) {
                    const examStart = new Date(`${exam.examData.startDate}T${exam.examData.startTime}`);
                    if (now >= examStart) {
                        return { ...exam, status: 'Public' };
                    }
                }
                return exam;
            }));
        };

        const interval = setInterval(checkScheduling, 60000); // Check every minute
        checkScheduling(); // Initial check
        return () => clearInterval(interval);
    }, []);

    const handleEdit = (exam) => {
        navigate(`/edit-exam/${exam.id}`);
    };

    const handleConfigure = (exam) => {
        localStorage.setItem('examDraft', JSON.stringify(exam.examData || exam));
        navigate(`/configure-exam/${exam.id}`);
    };

    const handleDelete = async (id) => {
        const exam = exams.find(e => e.id === id);
        const isPublishedOrScheduled = exam && (exam.status === 'Public' || exam.status === 'Scheduled');

        const confirmMessage = isPublishedOrScheduled
            ? "This exam is published/scheduled. Deleting will send cancellation emails to all candidates. Are you sure?"
            : "Are you sure you want to delete this exam?";

        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontWeight: 500 }}>{confirmMessage}</span>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        style={{ padding: '6px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#fff', color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
                    >Cancel</button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                const token = localStorage.getItem('token');
                                if (isPublishedOrScheduled) {
                                    try {
                                        await fetch(`${API_BASE_URL}/email/cancel-exam/${id}`, {
                                            method: 'POST',
                                            headers: { 'Authorization': `Bearer ${token}` }
                                        });
                                    } catch (emailError) {
                                        console.error('Failed to send cancellation emails:', emailError);
                                    }
                                }
                                const response = await fetch(`${API_BASE_URL}/exams/${id}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (response.ok) {
                                    setExams(prev => prev.filter(e => e.id !== id));
                                    if (isPublishedOrScheduled) {
                                        toast.success('Exam deleted and cancellation emails sent to candidates.');
                                    } else {
                                        toast.success('Exam deleted successfully.');
                                    }
                                } else {
                                    toast.error('Failed to delete exam');
                                }
                            } catch (error) {
                                console.error('Delete error:', error);
                            }
                        }}
                        style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: '#EF4444', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                    >Delete</button>
                </div>
            </div>
        ), { duration: Infinity, style: { maxWidth: '400px', background: '#fff', color: '#0F172A' } });
    };

    const filteredExams = exams.filter(exam => {
        const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = selectedStatus === 'All' || exam.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-4 sm:p-10">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 sm:mb-10">
                    <h1 className="text-2xl sm:text-[32px] font-bold text-[#0F172A] tracking-tight">Manage Exams</h1>
                    <p className="text-[#64748B] text-sm sm:text-[16px] font-medium mt-1">View, edit, and manage all your created exams.</p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8] group-focus-within:text-[#0F172A] transition-colors" />
                        <input
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-[#E2E8F0] focus:border-[#0F172A]/40 focus:bg-white outline-none text-[#0F172A] font-medium transition-all shadow-sm"
                            placeholder="Search exams..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                            className="px-6 py-4 bg-white border border-[#E2E8F0] rounded-2xl flex items-center justify-between sm:justify-center gap-6 text-[#0F172A] font-medium shadow-sm cursor-pointer hover:bg-[#F8FAFC] transition-colors min-w-[160px]"
                        >
                            {selectedStatus} Status
                            <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showStatusDropdown && (
                            <div className="absolute right-0 mt-2 w-full bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-10 overflow-hidden">
                                {['All', 'Draft', 'Scheduled', 'Live', 'Public', 'Finished'].map(status => (
                                    <button
                                        key={status}
                                        className="w-full px-6 py-3 text-left hover:bg-[#F8FAFC] text-[#0F172A] font-medium transition-colors"
                                        onClick={() => {
                                            setSelectedStatus(status);
                                            setShowStatusDropdown(false);
                                        }}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Exams List */}
                <div className="space-y-4">
                    {filteredExams.map((exam) => (
                        <div key={exam.id} className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-sm transition-all group">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-lg sm:text-[19px] font-medium text-[#0F172A]">{exam.title}</h3>
                                        <span className={`px-3 py-1 rounded-full text-[10px] sm:text-[12px] font-medium ${exam.status === 'Scheduled' ? 'bg-[#F0F9FF] text-[#0369A1] border border-[#BAE6FD]' :
                                            exam.status === 'Live' ? 'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]' :
                                                exam.status === 'Public' ? 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]' :
                                                    exam.status === 'Finished' ? 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]' :
                                                        'bg-orange-50 text-orange-700 border border-orange-200'
                                            }`}>
                                            {exam.status}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                                        <div className="flex items-center gap-2 text-[#475569]">
                                            <Calendar className="w-4 h-4 text-[#64748B]" />
                                            <span className="text-[13px] sm:text-[14px] font-medium text-[#0F172A]">{exam.date}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[#475569]">
                                            <Clock className="w-4 h-4 text-[#64748B]" />
                                            <span className="text-[13px] sm:text-[14px] font-medium text-[#0F172A]">{exam.duration}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[#475569]">
                                            <Users className="w-4 h-4 text-[#64748B]" />
                                            <span className="text-[13px] sm:text-[14px] font-medium text-[#0F172A]">{exam.students} candidates</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 border-t sm:border-t-0 pt-4 sm:pt-0">
                                    {exam.status === 'Draft' && (
                                        <button
                                            onClick={() => handleConfigure(exam)}
                                            className="flex-1 sm:flex-none p-3 text-[#0F172A] hover:bg-slate-50 rounded-xl transition-colors cursor-pointer flex justify-center items-center gap-2"
                                            title="Configure & Publish"
                                        >
                                            <Settings className="w-5 h-5" />
                                            <span className="text-xs font-bold uppercase sm:hidden">Configure</span>
                                        </button>
                                    )}
                                    {exam.status !== 'Live' && (
                                        <>
                                            <button
                                                onClick={() => handleEdit(exam)}
                                                className="flex-1 sm:flex-none p-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer flex justify-center"
                                                title="Edit Questions"
                                            >
                                                <Edit3 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(exam.id)}
                                                className="flex-1 sm:flex-none p-3 text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl transition-colors cursor-pointer flex justify-center"
                                                title="Delete Exam"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Examiner_ManageExams;
