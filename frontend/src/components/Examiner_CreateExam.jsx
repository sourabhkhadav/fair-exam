import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, PlusCircle, BookOpen, Database, Monitor,
    AlertCircle, FileCheck, BarChart3, UserCircle, Shield,
    ArrowLeft, Calendar, Clock, Globe, Settings, Eye,
    ShieldCheck, Target, Play, Save, ChevronRight,
    Bold as BoldIcon, Italic, List, ListOrdered, LinkIcon, Info, Users,
    Lock, Scissors, ClipboardX
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
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

const Examiner_CreateExam = () => {
    const navigate = useNavigate();

    // Form State
    const [examData, setExamData] = useState({
        title: '',
        category: '',
        status: 'Draft'
    });

    useEffect(() => {
        try {
            const draft = localStorage.getItem('examDraft');
            if (draft) {
                setExamData(prev => ({ ...prev, ...JSON.parse(draft) }));
            }
        } catch (e) {
            console.error("Failed to load exam draft", e);
        }
    }, []);

    const updateField = (field, value) => {
        setExamData(prev => ({ ...prev, [field]: value }));
    };

    const handleContinue = () => {
        if (!examData.title) {
            toast.error("Please enter an exam title");
            return;
        }
        localStorage.setItem('examDraft', JSON.stringify(examData));
        navigate('/add-questions');
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]/50 py-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-11 h-11 flex items-center justify-center bg-white border border-[#E2E8F0] rounded-xl shadow-sm hover:shadow-md hover:-translate-x-0.5 transition-all text-[#64748B] hover:text-[#0F172A] group"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-medium text-[#0F172A] tracking-tight">Exam Configuration</h1>
                            <p className="text-[#64748B] text-[15px] font-medium mt-1">Set up your exam details and security rules.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left Panel: Primary Details */}
                    <div className="lg:col-span-8 space-y-10">
                        <FormSection title="Exam Details" icon={PlusCircle}>
                            <div className="grid grid-cols-1 gap-8">
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

                        {/* Status Bar / Step Indicator */}
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

                    {/* Right Panel: Security Sidebar */}
                    <div className="lg:col-span-4 h-fit">
                        <FormSection title="Security" icon={Shield}>
                            <div className="flex flex-col gap-4">
                                {[
                                    { icon: Eye, label: "AI Proctoring" },
                                    { icon: Lock, label: "Browser Lock" },
                                    { icon: Monitor, label: "Full Screen" },
                                    { icon: Scissors, label: "Anti-Copy" }
                                ].map((feature, i) => (
                                    <div
                                        key={i}
                                        className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-4 group/item hover:bg-white hover:border-[#0F172A]/20 transition-all"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center group-hover/item:border-[#0F172A]/20 transition-colors">
                                            <feature.icon className="w-4.5 h-4.5 text-[#64748B] group-hover/item:text-[#0F172A]" />
                                        </div>
                                        <div className="text-[13px] font-bold text-[#0F172A]">{feature.label}</div>
                                    </div>
                                ))}
                            </div>
                        </FormSection>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="mt-16 pt-10 border-t border-[#E2E8F0] flex justify-end">
                    <button
                        onClick={handleContinue}
                        className="group px-10 py-3.5 bg-[#0F172A] text-white font-medium rounded-xl hover:bg-[#1E293B] transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center gap-3"
                    >
                        Continue to Questions
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Examiner_CreateExam;
