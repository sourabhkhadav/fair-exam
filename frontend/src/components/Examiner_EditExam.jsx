import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import {
    PlusCircle, ArrowLeft, Shield, Eye, Lock, Monitor, Scissors, ChevronRight, Trash2
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const FormSection = ({ title, icon: Icon, children }) => (
    <div className="bg-white p-5 sm:p-8 rounded-[32px] border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <Icon className="w-5 h-5 text-[#0F172A]" />
            </div>
            <h2 className="text-lg sm:text-xl font-medium text-[#0F172A] tracking-tight">{title}</h2>
        </div>
        <div className="relative z-10">
            {children}
        </div>
    </div>
);

const Examiner_EditExam = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [examData, setExamData] = useState({
        title: '',
        category: '',
        status: 'Draft'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExam = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/exams/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch exam');

                const data = await response.json();
                if (data.success) {
                    setExamData(data.data);
                }
            } catch (e) {
                console.error("Failed to load exam data", e);
                toast.error("Could not load exam details.");
                navigate('/manage-exams');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchExam();
        }
    }, [id, navigate]);

    const updateField = (field, value) => {
        setExamData(prev => ({ ...prev, [field]: value }));
    };

    const handleContinue = async () => {
        if (!examData.title) {
            toast.error("Please enter an exam title");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/exams/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: examData.title,
                    category: examData.category
                    // We typically only update metadata here. Questions are handled in the next step.
                    // However, we should pass the full current state to the draft so questions aren't lost if the user navigates forthwith.
                })
            });

            if (response.ok) {
                // Save to draft for the next step (AddQuestions)
                // We must ensure the draft has the ID so AddQuestions knows it's an update.
                localStorage.setItem('examDraft', JSON.stringify(examData));
                navigate('/add-questions');
            } else {
                throw new Error("Failed to update exam");
            }
        } catch (error) {
            console.error("Update error:", error);
            toast.error("Failed to save changes.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC]/50 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <PlusCircle className="w-6 h-6 text-[#0F172A] animate-spin" />
                    </div>
                    <span className="text-[#64748B] font-medium tracking-wide">Loading Exam Details...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]/50 py-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/manage-exams')}
                            className="w-11 h-11 flex items-center justify-center bg-white border border-[#E2E8F0] rounded-xl shadow-sm hover:shadow-md hover:-translate-x-0.5 transition-all text-[#64748B] hover:text-[#0F172A] group"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-medium text-[#0F172A] tracking-tight">Edit Exam</h1>
                            <p className="text-[#64748B] text-[15px] font-medium mt-1">Update labels and security for "{examData.title}"</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-10">
                    <FormSection title="Exam Details" icon={PlusCircle}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[13px] font-medium text-[#0F172A] ml-1 uppercase tracking-wider">Exam Title</label>
                                <input
                                    className="w-full px-5 py-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] focus:bg-white focus:border-[#0F172A]/40 transition-all outline-none text-[#0F172A] font-medium"
                                    placeholder="e.g., Advanced Database Systems 2026"
                                    value={examData.title}
                                    onChange={(e) => updateField('title', e.target.value)}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[13px] font-medium text-[#0F172A] ml-1 uppercase tracking-wider">Category / Subject</label>
                                <input
                                    className="w-full px-5 py-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] focus:bg-white focus:border-[#0F172A]/40 transition-all outline-none text-[#0F172A] font-medium"
                                    placeholder="e.g., Computer Science"
                                    value={examData.category}
                                    onChange={(e) => updateField('category', e.target.value)}
                                />
                            </div>
                        </div>
                    </FormSection>

                    <FormSection title="Questions & Sections" icon={Monitor}>
                        <div className="space-y-6">
                            {(examData.sections || [{ id: 0, name: 'General' }]).map((section) => {
                                const sectionQuestions = (examData.questions || []).filter(q => q.sectionId === section.id);
                                return (
                                    <div key={section.id} className="bg-[#F8FAFC]/50 rounded-2xl border border-[#E2E8F0] overflow-hidden">
                                        <div className="px-6 py-4 bg-white border-b border-[#E2E8F0] flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 bg-[#0F172A] rounded-full" />
                                                <span className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">{section.name}</span>
                                                <span className="text-[11px] font-medium text-[#64748B] px-2 py-0.5 bg-[#F1F5F9] rounded-md">
                                                    {sectionQuestions.length} Questions
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => navigate('/add-questions')}
                                                className="text-[11px] font-bold text-[#0F172A] hover:underline uppercase tracking-tight"
                                            >
                                                Edit in Navigator
                                            </button>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            {sectionQuestions.length > 0 ? (
                                                sectionQuestions.map((q, qIdx) => (
                                                    <div key={q.id} className="bg-white p-4 rounded-xl border border-[#E2E8F0] flex items-center justify-between group hover:border-[#0F172A]/20 transition-all">
                                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                                            <span className="text-xs font-bold text-[#94A3B8]">Q{qIdx + 1}</span>
                                                            <p className="text-sm font-medium text-[#0F172A] truncate pr-10">
                                                                {q.text || <span className="text-[#94A3B8] italic font-normal">Untitled Question</span>}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${q.difficulty === 'Hard' ? 'bg-rose-50 text-rose-600' :
                                                                q.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600' :
                                                                    'bg-emerald-50 text-emerald-600'
                                                                }`}>
                                                                {q.difficulty}
                                                            </span>
                                                            <button
                                                                onClick={() => {
                                                                    const nextQs = examData.questions.filter(item => item.id !== q.id);
                                                                    updateField('questions', nextQs);
                                                                }}
                                                                className="p-1.5 text-[#64748B] hover:text-[#EF4444] transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-8 text-center bg-white rounded-xl border border-dashed border-[#E2E8F0]">
                                                    <p className="text-xs font-medium text-[#94A3B8]">No questions in this section yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </FormSection>

                    <div className="bg-white p-5 sm:p-6 rounded-[32px] border border-[#E2E8F0] shadow-sm flex items-center justify-between sm:px-10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-lg">1</div>
                            <span className="text-[15px] font-bold text-[#0F172A]">Core Setup</span>
                        </div>
                        <div className="flex-1 mx-6 h-px bg-[#E2E8F0]" />
                        <div className="flex items-center gap-4 opacity-40">
                            <div className="w-10 h-10 rounded-full bg-white border-2 border-[#E2E8F0] text-[#64748B] flex items-center justify-center font-bold text-lg">2</div>
                            <span className="text-[15px] font-bold text-[#64748B]">Questions</span>
                        </div>
                    </div>
                </div>

                <div className="mt-16 pt-10 border-t border-[#E2E8F0] flex justify-end">
                    <button
                        onClick={handleContinue}
                        className="group px-10 py-3.5 bg-[#0F172A] text-white font-medium rounded-xl hover:bg-[#1E293B] transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center gap-3"
                    >
                        Save & Continue to Questions
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Examiner_EditExam;
