import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/api';
import {
    ArrowLeft, Plus, Trash2, CheckCircle2, Save, Send,
    Settings2, HelpCircle, GripVertical, Sparkles,
    ChevronRight, ChevronDown, Layout, ListTodo, BrainCircuit,
    Search, Zap, MoreHorizontal, Copy, Eye,
    Target, Clock, BarChart, Info, AlertTriangle, Pencil
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Examiner_AddQuestions = () => {
    const navigate = useNavigate();
    const [metaData, setMetaData] = useState(null);
    const [focusedIndex, setFocusedIndex] = useState(0);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeSectionId, setActiveSectionId] = useState(0);
    const [sections, setSections] = useState([
        { id: 0, name: 'Section 1' }
    ]);
    const [questions, setQuestions] = useState([]);
    const [collapsedSections, setCollapsedSections] = useState({});
    const [editingSectionId, setEditingSectionId] = useState(null);

    useEffect(() => {
        const draftStr = localStorage.getItem('examDraft');
        if (draftStr) {
            const draft = JSON.parse(draftStr);
            setMetaData(draft);
            if (draft.sections && draft.sections.length > 0) {
                setSections(draft.sections);
            }
            if (draft.questions && draft.questions.length > 0) {
                setQuestions(draft.questions);
            }
        }
    }, []);

    // Helper: check if a question is completely empty (no text, all options blank)
    const isQuestionEmpty = (q) => {
        const hasText = q.text && q.text.trim().length > 0;
        const hasAnyOption = q.options && q.options.some(opt => opt && opt.trim().length > 0);
        return !hasText && !hasAnyOption;
    };

    // Helper: remove all empty questions and return cleaned list
    const removeEmptyQuestions = (qList) => {
        return qList.filter(q => !isQuestionEmpty(q));
    };

    const addSection = () => {
        const newSectionId = sections.length > 0 ? Math.max(...sections.map(s => s.id)) + 1 : 0;
        const newSection = {
            id: newSectionId,
            name: `Section ${sections.length + 1}`
        };
        // Remove empty questions before adding section
        const cleanedQuestions = removeEmptyQuestions(questions);
        setQuestions(cleanedQuestions);
        setSections([...sections, newSection]);
        setActiveSectionId(newSectionId);
        setFocusedIndex(Math.max(0, cleanedQuestions.length - 1));
    };

    const removeSection = (sectionId) => {
        if (sections.length === 1) return;
        setSections(sections.filter(s => s.id !== sectionId));
        setQuestions(questions.filter(q => q.sectionId !== sectionId));
        setFocusedIndex(0);
    };

    const updateSectionName = (sectionId, name) => {
        setSections(sections.map(s => s.id === sectionId ? { ...s, name } : s));
    };

    const addQuestion = (sectionId) => {
        const newQ = {
            id: Date.now(),
            sectionId: sectionId ?? (sections[0]?.id || 0),
            type: 'MCQ',
            text: '',
            options: ['', '', '', ''],
            correct: 0,
            marks: 2,
            difficulty: 'Medium',
            tags: []
        };

        // Remove empty questions before adding a new one
        const cleanedQuestions = removeEmptyQuestions(questions);

        // Find insert index: after the last question of this section
        const sectionQuestions = cleanedQuestions.filter(q => q.sectionId === sectionId);
        let insertIdx;
        if (sectionQuestions.length > 0) {
            const lastOfSection = sectionQuestions[sectionQuestions.length - 1];
            insertIdx = cleanedQuestions.findIndex(q => q.id === lastOfSection.id) + 1;
        } else {
            // Find insertion point based on section order
            const sectionIdx = sections.findIndex(s => s.id === sectionId);
            if (sectionIdx === 0) {
                insertIdx = 0;
            } else {
                const prevSectionsIds = sections.slice(0, sectionIdx).map(s => s.id);
                const prevQuestions = cleanedQuestions.filter(q => prevSectionsIds.includes(q.sectionId));
                insertIdx = prevQuestions.length;
            }
        }

        const nextQs = [...cleanedQuestions];
        nextQs.splice(insertIdx, 0, newQ);
        setQuestions(nextQs);
        setFocusedIndex(insertIdx);
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Not authorized, please login again');
            }

            const response = await fetch(`${API_BASE_URL}/exams/import-questions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Import failed');
            }

            if (data.data && Array.isArray(data.data)) {
                const importedQuestions = data.data.map(q => ({
                    ...q,
                    sectionId: activeSectionId
                }));

                // Remove empty questions before importing
                const cleanedQuestions = removeEmptyQuestions(questions);

                const sectionQuestions = cleanedQuestions.filter(q => q.sectionId === activeSectionId);
                let insertIdx;
                if (sectionQuestions.length > 0) {
                    const lastOfSection = sectionQuestions[sectionQuestions.length - 1];
                    insertIdx = cleanedQuestions.findIndex(q => q.id === lastOfSection.id) + 1;
                } else {
                    const sectionIdx = sections.findIndex(s => s.id === activeSectionId);
                    if (sectionIdx === 0) {
                        insertIdx = 0;
                    } else {
                        const prevSectionsIds = sections.slice(0, sectionIdx).map(s => s.id);
                        const prevQuestions = cleanedQuestions.filter(q => prevSectionsIds.includes(q.sectionId));
                        insertIdx = prevQuestions.length;
                    }
                }

                const nextQs = [...cleanedQuestions];
                nextQs.splice(insertIdx, 0, ...importedQuestions);
                setQuestions(nextQs);
                setFocusedIndex(insertIdx);
                toast.success(`Successfully imported ${data.count} questions to ${sections.find(s => s.id === activeSectionId)?.name || 'Section'}.`);
            }
        } catch (error) {
            console.error('Import error:', error);
            toast.error(`Error importing file: ${error.message}`);
        } finally {
            setIsLoading(false);
            e.target.value = null;
        }
    };

    const updateQuestion = (idx, field, value) => {
        setQuestions(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: value };
            return next;
        });
    };

    const updateOption = (qIdx, oIdx, value) => {
        setQuestions(prev => {
            const next = [...prev];
            const newOpts = [...next[qIdx].options];
            newOpts[oIdx] = value;
            next[qIdx] = { ...next[qIdx], options: newOpts };
            return next;
        });
    };

    const removeQuestion = (idx) => {
        if (questions.length === 1) return;
        const next = questions.filter((_, i) => i !== idx);
        setQuestions(next);
        setFocusedIndex(Math.max(0, focusedIndex - 1));
    };

    const saveExamToBackend = async (status) => {
        if (!metaData?.title) {
            toast.error("Title is missing");
            return;
        }

        if (questions.length === 0) {
            toast.error("Please add at least one question before submitting");
            return;
        }

        // Validate questions
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.text.trim()) {
                toast.error(`Question ${i + 1} is missing content`);
                return;
            }
            if (q.type === 'MCQ') {
                const validOptions = q.options.filter(opt => opt.trim());
                if (validOptions.length < 2) {
                    toast.error(`Question ${i + 1} needs at least 2 options`);
                    return;
                }
                if (!q.options[q.correct]?.trim()) {
                    toast.error(`Question ${i + 1} has invalid correct answer`);
                    return;
                }
            }
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const examPayload = {
                title: metaData.title,
                category: metaData.category,
                description: metaData.description || metaData.category,
                status: status,
                sections: sections,
                questions: questions,
                violationLimits: metaData.violationLimits || {
                    faceLimit: 5,
                    soundLimit: 5,
                    fullscreenLimit: 5
                }
            };

            let url = `${API_BASE_URL}/exams`;
            let method = 'POST';

            if (metaData._id) {
                url = `${API_BASE_URL}/exams/${metaData._id}`;
                method = 'PUT';
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(examPayload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Save failed');
            }

            if (status === 'published') {
                toast.success('Exam published successfully!');
                localStorage.removeItem('examDraft');
                navigate('/manage-exams');
            } else {
                toast.success('Draft saved successfully!');
                localStorage.removeItem('examDraft');
                navigate('/manage-exams');
            }

        } catch (error) {
            console.error('Save error:', error);
            toast.error(`Error saving exam: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveDraft = () => saveExamToBackend('draft');

    const handlePublish = () => saveExamToBackend('published');

    const currentQuestion = questions[focusedIndex] || {
        id: 1,
        sectionId: 0,
        type: 'MCQ',
        text: '',
        options: ['', '', '', ''],
        correct: 0,
        marks: 2,
        difficulty: 'Medium',
        tags: []
    };

    return (
        <div className="h-full lg:h-[calc(100vh-100px)] flex flex-col min-w-0">
            {/* Page Header - Refined Light Aesthetic */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-8 px-4 lg:px-2">
                <div className="flex items-start gap-6">
                    <button
                        onClick={() => navigate('/create-exam')}
                        className="mt-1.5 p-3 bg-white border border-[#F1F5F9] hover:bg-[#F8FAFC] rounded-2xl transition-all shadow-sm group active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5 text-[#94A3B8] group-hover:text-[#0F172A]" />
                    </button>
                    <div className="min-w-0 space-y-2">
                        <div className="flex items-center gap-4 flex-wrap">
                            <h1 className="text-xl sm:text-[22px] font-medium text-[#0F172A] tracking-tight truncate max-w-[280px] sm:max-w-none">
                                {metaData?.title || 'System Design Final'}
                            </h1>
                            <span className="flex items-center gap-2 px-3 py-1.5 bg-[#F8FAFC] text-[#0F172A] text-[11px] font-bold uppercase rounded-xl tracking-widest border border-[#E2E8F0]/50 whitespace-nowrap">
                                <div className="w-1.5 h-1.5 bg-[#0F172A] rounded-full shadow-[0_0_8px_rgba(15,23,42,0.4)]" />
                                {sections.length} {sections.length === 1 ? 'Section' : 'Sections'}
                            </span>
                        </div>
                        <div className="flex items-center gap-5 text-[#475569]">
                            <div className="flex items-center gap-2.5 text-[14px]">
                                <ListTodo className="w-4 h-4 text-[#0F172A]" />
                                <span className="font-medium text-[#0F172A]">{questions.length} Questions</span>
                            </div>
                            <div className="w-1 h-1 bg-[#E2E8F0] rounded-full" />
                            <div className="flex items-center gap-2.5 text-[14px]">
                                <Target className="w-4 h-4 text-[#0F172A]" />
                                <span className="font-medium text-[#0F172A]">{questions.reduce((a, b) => a + Number(b.marks || 0), 0)} Marks Total</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSaveDraft}
                        className="flex-1 sm:flex-none justify-center px-6 py-3 bg-white border border-[#E2E8F0] text-[#1E293B] font-semibold text-[14px] rounded-2xl hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-all flex items-center gap-2.5 shadow-sm active:scale-95 whitespace-nowrap"
                    >
                        <Save className="w-4 h-4 text-[#64748B]" /> Save Draft
                    </button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-white border border-[#E2E8F0] lg:rounded-[32px] shadow-sm relative">

                {/* Mobile Navigation Trigger */}
                <button
                    onClick={() => setIsNavOpen(true)}
                    className="lg:hidden absolute bottom-6 right-6 z-30 w-14 h-14 bg-white border border-[#E2E8F0] rounded-full shadow-lg flex items-center justify-center text-[#0F172A]"
                >
                    <ListTodo className="w-6 h-6" />
                </button>

                {/* Mobile Overlay */}
                {isNavOpen && (
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] lg:hidden"
                        onClick={() => setIsNavOpen(false)}
                    />
                )}

                {/* 1. Navigation Panel (Left Internal Panel) */}
                <div className={`
                    w-full lg:w-80 border-r border-[#E2E8F0] flex flex-col bg-white
                    fixed lg:relative inset-y-0 left-0 z-[70] lg:z-10 transition-transform duration-300
                    ${isNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    <div className="p-6 border-b border-[#F1F5F9] flex items-center justify-between bg-[#F8FAFC]/50">
                        <div className="font-semibold text-[#1E293B] text-sm tracking-tight">Question Navigator</div>
                        <button onClick={() => setIsNavOpen(false)} className="lg:hidden p-2 text-[#94A3B8] hover:bg-white rounded-xl border border-[#E2E8F0]">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-4 border-b border-[#F1F5F9] space-y-3">
                        <div className="relative group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] group-focus-within:text-[#0F172A] transition-colors" />
                            <input
                                placeholder="Find question..."
                                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13.5px] outline-none focus:bg-white focus:border-[#0F172A]/30 transition-all font-medium placeholder:text-[#94A3B8]/70"
                            />
                        </div>
                        <button
                            onClick={addSection}
                            className="w-full py-2.5 bg-slate-50 border border-[#0F172A]/20 rounded-2xl text-[#0F172A] font-bold text-[12px] hover:bg-[#0F172A] hover:text-white transition-all flex items-center justify-center gap-2 group shadow-sm active:scale-[0.98]"
                        >
                            <Plus className="w-4 h-4" /> Add New Section
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
                        {sections.map((section, sIdx) => (
                            <div key={section.id} className="space-y-4">
                                <div
                                    className={`flex items-center justify-between px-3 py-2 rounded-xl group/section cursor-pointer transition-all ${activeSectionId === section.id
                                        ? 'bg-slate-100 border border-[#0F172A]/20'
                                        : 'hover:bg-slate-50'
                                        }`}
                                    onClick={() => setActiveSectionId(section.id)}
                                >
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeSectionId === section.id ? 'bg-[#0F172A]' : 'bg-[#94A3B8]'
                                            }`} />
                                        {editingSectionId === section.id ? (
                                            <input
                                                id={`section-input-${section.id}`}
                                                value={section.name}
                                                onChange={(e) => updateSectionName(section.id, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                onBlur={() => setEditingSectionId(null)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') setEditingSectionId(null); }}
                                                autoFocus
                                                className={`text-[10px] font-bold uppercase tracking-[0.15em] bg-white border border-[#0F172A]/20 outline-none w-full rounded-md px-1.5 py-0.5 ${activeSectionId === section.id ? 'text-[#0F172A]' : 'text-[#64748B]'}`}
                                            />
                                        ) : (
                                            <span className={`text-[10px] font-bold uppercase tracking-[0.15em] truncate ${activeSectionId === section.id ? 'text-[#0F172A]' : 'text-[#64748B]'}`}>
                                                {section.name}
                                            </span>
                                        )}
                                        <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${activeSectionId === section.id
                                            ? 'bg-[#0F172A] text-white'
                                            : 'bg-[#F1F5F9] text-[#64748B]'
                                            }`}>
                                            {questions.filter(q => q.sectionId === section.id).length} Q
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => {
                                                setActiveSectionId(section.id);
                                                addQuestion(section.id);
                                            }}
                                            className="p-1 px-2.5 bg-slate-50 text-[#0F172A] hover:bg-[#0F172A] hover:text-white rounded-lg transition-all flex items-center gap-1"
                                            title="Add Question"
                                        >
                                            <Plus className="w-3 h-3" />
                                            <span className="text-[9px] font-bold">Add</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingSectionId(editingSectionId === section.id ? null : section.id);
                                            }}
                                            className={`p-1 transition-colors ${editingSectionId === section.id ? 'text-[#6366F1]' : 'text-[#64748B] hover:text-[#6366F1]'}`}
                                            title="Rename Section"
                                        >
                                            <Pencil className="w-3 h-3" />
                                        </button>
                                        {sections.length > 1 && (
                                            <button
                                                onClick={() => removeSection(section.id)}
                                                className="p-1 text-[#64748B] hover:text-[#EF4444] transition-colors"
                                                title="Delete Section"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {questions.filter(q => q.sectionId === section.id).map((q, sectionQIdx) => {
                                        const globalIdx = questions.findIndex(item => item.id === q.id);
                                        return (
                                            <div
                                                key={q.id}
                                                onClick={() => {
                                                    setFocusedIndex(globalIdx);
                                                    setIsNavOpen(false);
                                                }}
                                                className={`group p-4 rounded-2xl border transition-all cursor-pointer relative ${focusedIndex === globalIdx
                                                    ? 'border-[#0F172A]/30 bg-slate-50 shadow-sm'
                                                    : 'border-[#F1F5F9] hover:border-[#E2E8F0] bg-white'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${focusedIndex === globalIdx ? 'bg-[#0F172A] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                                                        }`}>
                                                        Q{sectionQIdx + 1}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-medium text-[#0F172A] uppercase tracking-wider">{q.difficulty}</span>
                                                        <GripVertical className="w-3.5 h-3.5 text-[#CBD5E1] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                </div>
                                                <p className={`text-[13px] font-medium line-clamp-2 leading-relaxed ${focusedIndex === globalIdx ? 'text-[#4F46E5]' : 'text-[#0F172A]'
                                                    }`}>
                                                    {q.text || <span className="text-[#94A3B8] italic font-normal">No content...</span>}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 border-t border-[#F1F5F9] bg-[#F8FAFC]/50">
                        {/* Bulk Import Option */}
                        <div className="relative group">
                            <input
                                type="file"
                                accept=".xlsx,.xls,.pdf"
                                onChange={handleImport}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                disabled={isLoading}
                            />
                            <button
                                disabled={isLoading}
                                className="w-full py-3.5 bg-white border border-[#E2E8F0] rounded-2xl text-[#6366F1] font-semibold text-[13px] hover:bg-[#6366F1] hover:text-white transition-all flex items-center justify-center gap-2.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                {isLoading ? 'Importing...' : 'Bulk Import'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Editor Panel (Center Panel) */}
                <div className="flex-1 bg-[#F8FAFC] overflow-y-auto p-4 sm:p-12 custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
                        {/* Internal Navigation Shortcuts */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 px-3 py-1 bg-white border border-[#E2E8F0] rounded-full shadow-sm">
                                <button
                                    disabled={focusedIndex === 0}
                                    onClick={() => setFocusedIndex(focusedIndex - 1)}
                                    className="p-1 hover:bg-[#F1F5F9] rounded-full transition-colors disabled:opacity-30"
                                >
                                    <ArrowLeft className="w-4 h-4 text-[#64748B]" />
                                </button>
                                <span className="text-xs font-bold text-[#0F172A] px-2 border-x border-[#E2E8F0]">
                                    {focusedIndex + 1} of {questions.length}
                                </span>
                                <button
                                    disabled={focusedIndex === questions.length - 1}
                                    onClick={() => setFocusedIndex(focusedIndex + 1)}
                                    className="p-1 hover:bg-[#F1F5F9] rounded-full transition-colors disabled:opacity-30"
                                >
                                    <ChevronRight className="w-4 h-4 text-[#64748B]" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => removeQuestion(focusedIndex)}
                                    className="p-2.5 text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl transition-all"
                                    title="Delete Question"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button className="p-2.5 text-[#64748B] hover:bg-white rounded-xl transition-all border border-transparent hover:border-[#E2E8F0]">
                                    <Copy className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Focused Question Editor */}
                        {questions.length === 0 ? (
                            <div className="bg-white rounded-2xl sm:rounded-[32px] border border-[#E2E8F0] shadow-sm p-10 text-center">
                                <p className="text-slate-500 mb-4">No questions yet. Click "Add New Section" or "Bulk Import" to get started.</p>
                                <button
                                    onClick={() => addQuestion(sections[0]?.id || 0)}
                                    className="px-6 py-3 bg-[#0F172A] text-white font-semibold rounded-xl hover:bg-[#1E293B] transition-all"
                                >
                                    Add First Question
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl sm:rounded-[32px] border border-[#E2E8F0] shadow-sm p-6 sm:p-10 space-y-6 sm:space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none hidden sm:block">
                                    <Zap className="w-64 h-64 text-[#0F172A]" />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                                        <div className="flex items-center gap-3">
                                            <label className="text-[11px] font-medium text-[#0F172A] uppercase tracking-[0.1em]">
                                                {sections.find(s => s.id === currentQuestion.sectionId)?.name || 'No Section'}
                                            </label>
                                            <div className="w-1 h-1 bg-[#E2E8F0] rounded-full" />
                                            <label className="text-[11px] font-medium text-[#0F172A] uppercase tracking-[0.1em]">Question Context</label>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <select
                                                className="bg-[#F8FAFC] border border-[#E2E8F0] text-[12px] font-medium text-[#0F172A] outline-none cursor-pointer px-3 py-1.5 rounded-xl hover:bg-white transition-colors"
                                                value={currentQuestion.difficulty}
                                                onChange={(e) => updateQuestion(focusedIndex, 'difficulty', e.target.value)}
                                            >
                                                <option>Easy</option>
                                                <option>Medium</option>
                                                <option>Hard</option>
                                            </select>
                                            <div className="flex items-center gap-2.5 bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-1.5 rounded-xl">
                                                <span className="text-[12px] font-normal text-[#475569]">Marks:</span>
                                                <input
                                                    type="number"
                                                    className="w-8 bg-transparent border-none text-[12px] font-medium text-[#0F172A] outline-none"
                                                    value={currentQuestion.marks}
                                                    onChange={(e) => updateQuestion(focusedIndex, 'marks', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <textarea
                                        className="w-full p-0 text-lg sm:text-[21px] font-medium text-[#0F172A] bg-transparent border-none outline-none placeholder:text-[#64748B] resize-none leading-relaxed tracking-tight"
                                        placeholder="Type your question here..."
                                        rows="3"
                                        value={currentQuestion.text}
                                        onChange={(e) => updateQuestion(focusedIndex, 'text', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-5">
                                    <label className="text-[11px] font-medium text-[#0F172A] uppercase tracking-[0.15em]">Answers & Options</label>
                                    <div className="space-y-4">
                                        {currentQuestion.options.map((opt, oIdx) => (
                                            <div
                                                key={oIdx}
                                                className={`flex items-start sm:items-center gap-4 sm:gap-6 p-5 sm:p-6 rounded-2xl border transition-all ${currentQuestion.correct === oIdx
                                                    ? 'border-[#0F172A]/30 bg-slate-50'
                                                    : 'border-[#E2E8F0]/80 hover:border-[#0F172A]/50 bg-white'
                                                    }`}
                                            >
                                                <div
                                                    onClick={() => updateQuestion(focusedIndex, 'correct', oIdx)}
                                                    className={`mt-1 sm:mt-0 w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${currentQuestion.correct === oIdx
                                                        ? 'bg-[#0F172A] border-[#0F172A]'
                                                        : 'border-[#E2E8F0] hover:border-[#0F172A]'
                                                        }`}
                                                >
                                                    {currentQuestion.correct === oIdx && <div className="w-2 h-2 bg-white rounded-full" />}
                                                </div>
                                                <input
                                                    className="flex-1 bg-transparent border-none outline-none text-sm sm:text-[15.5px] font-medium text-[#0F172A] placeholder:text-[#64748B]"
                                                    placeholder={`Option ${String.fromCharCode(65 + oIdx)}...`}
                                                    value={opt}
                                                    onChange={(e) => updateOption(focusedIndex, oIdx, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 flex flex-wrap items-center gap-6 text-[#475569]">
                                    <button className="flex items-center gap-2.5 text-[13px] font-medium hover:text-[#6366F1] transition-colors">
                                        <Plus className="w-4 h-4" /> Add Option
                                    </button>
                                    <div className="w-[1px] h-4 bg-[#E2E8F0]" />
                                    <button className="flex items-center gap-2.5 text-[13px] font-medium hover:text-[#6366F1] transition-colors">
                                        <Info className="w-4 h-4" /> Add Rationale
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Examiner_AddQuestions;
