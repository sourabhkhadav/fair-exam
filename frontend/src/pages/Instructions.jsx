import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Shield, Clock, FileText, CheckSquare, ArrowRight,
    AlertTriangle, Monitor, MousePointer, BookOpen, XCircle, Layers
} from 'lucide-react';
import EnvironmentCheck from '../components/EnvironmentCheck';

/* ─── Helper components ──────────────────────────────────────────────────── */

const InstructionCard = ({ icon: Icon, title, desc }) => (
    <div className="flex gap-4 p-4 rounded-lg border border-slate-100 bg-slate-50/50">
        <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
                <Icon className="w-5 h-5" />
            </div>
        </div>
        <div>
            <h4 className="font-semibold text-slate-800 text-sm mb-1">{title}</h4>
            <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
        </div>
    </div>
);

/** Shown when the candidate has already submitted the exam */
const AlreadyAttempted = ({ navigate }) => (
    <div className="min-h-screen bg-slate-50 font-sans flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-10 max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                    <XCircle className="w-9 h-9 text-red-500" />
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Exam Already Attempted</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                    You have already submitted this exam. Each candidate is allowed only{' '}
                    <span className="font-semibold text-slate-700">one attempt</span>. If you believe
                    this is an error, please contact your examiner.
                </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
                <div className="flex gap-3 text-sm text-amber-800">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Re-entry is blocked to maintain exam integrity and prevent unfair advantages.</span>
                </div>
            </div>
            <button
                onClick={() => navigate('/candidate-login')}
                className="w-full py-3 rounded-md bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
                Return to Login
            </button>
        </div>
    </div>
);

/* ─── Main component ─────────────────────────────────────────────────────── */

const Instructions = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const userName = location.state?.name || 'Candidate';

    const [agreed, setAgreed] = useState(false);
    const [showEnvironmentCheck, setShowEnvironmentCheck] = useState(false);
    const [examDetails, setExamDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9).toUpperCase());

    useEffect(() => {
        const fetchExamDetails = async () => {
            try {
                const candidateData = JSON.parse(localStorage.getItem('candidate') || '{}');
                const examId = candidateData.examId;
                const candidateId = candidateData._id || candidateData.id;

                if (!examId) {
                    console.error('No exam ID found');
                    setLoading(false);
                    return;
                }

                // ── Check one-attempt gate ───────────────────────────────
                const checkResponse = await fetch(
                    `${API_BASE_URL}/submissions/check/${examId}/${candidateId}`
                );
                const checkData = await checkResponse.json();

                if (checkData.success && checkData.hasSubmitted) {
                    setAlreadySubmitted(true);
                    setLoading(false);
                    return;
                }

                // ── Load exam details ────────────────────────────────────
                const response = await fetch(`${API_BASE_URL}/exams/public/${examId}`);
                const data = await response.json();

                if (data.success) {
                    setExamDetails(data.data);
                    localStorage.setItem('examData', JSON.stringify(data.data));
                }
            } catch (error) {
                console.error('Error fetching exam details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchExamDetails();
    }, []);

    const handleStart = () => {
        if (agreed) setShowEnvironmentCheck(true);
    };

    const handleEnvironmentCheckComplete = (passed) => {
        if (passed) {
            navigate('/exam', { state: { name: userName } });
        } else {
            setShowEnvironmentCheck(false);
        }
    };

    /* ── Loading ── */
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 text-sm">Loading exam details…</p>
                </div>
            </div>
        );
    }

    /* ── Already attempted ── */
    if (alreadySubmitted) {
        return <AlreadyAttempted navigate={navigate} />;
    }

    /* ── Derived values ── */
    const candidateData = JSON.parse(localStorage.getItem('candidate') || '{}');
    const assessmentId = candidateData.examId || 'N/A';
    const duration = examDetails?.duration || 90;
    const totalQuestions = examDetails?.totalQuestions || 0;
    const violationLimits = examDetails?.violationLimits || { faceLimit: 5, soundLimit: 5, fullscreenLimit: 5 };
    const sections = examDetails?.sections || [];          // [{id, name, questionCount, totalMarks}]
    const unsectionedCount = examDetails?.unsectionedCount ?? totalQuestions;
    const hasSections = sections.length > 0;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* ── Header ── */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8 mb-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100 mb-4">
                                Assessment ID: {assessmentId}
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Examination Guidelines</h1>
                            <p className="mt-2 text-slate-500">
                                Welcome, <span className="font-semibold text-slate-700">{userName}</span>. Please review the
                                following protocols before commencing.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 shrink-0">
                            <Clock className="w-8 h-8 text-blue-600" />
                            <div>
                                <div className="text-sm font-semibold text-slate-900">Duration: {duration} Minutes</div>
                                <div className="text-xs text-slate-500">Total Questions: {totalQuestions}</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">

                        {/* ── Section Breakdown ── */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-slate-500" />
                                Section Breakdown
                            </h3>

                            {hasSections ? (
                                /* ── Named sections ── */
                                <div className="space-y-3">
                                    {sections.map((section, idx) => (
                                        <div
                                            key={section.id}
                                            className="flex items-start gap-4 p-4 rounded-lg border border-slate-100 bg-slate-50/50"
                                        >
                                            {/* Section badge */}
                                            <div className="flex-shrink-0 w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm font-bold text-sm">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-slate-800 text-sm">{section.name}</h4>
                                                <p className="text-sm text-slate-500 mt-0.5">
                                                    {section.questionCount} Question{section.questionCount !== 1 ? 's' : ''}
                                                    {section.totalMarks > 0 && (
                                                        <> &bull; {section.totalMarks} Mark{section.totalMarks !== 1 ? 's' : ''}</>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0 text-right">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                                                    MCQ
                                                </span>
                                            </div>
                                        </div>
                                    ))}


                                </div>
                            ) : (
                                /* ── No named sections – single unified MCQ block ── */
                                <InstructionCard
                                    icon={MousePointer}
                                    title="Multiple Choice Questions"
                                    desc={`${totalQuestions} Question${totalQuestions !== 1 ? 's' : ''}. Single correct option. Analytical & Logical reasoning.`}
                                />
                            )}
                        </div>

                        {/* ── One-attempt notice ── */}
                        <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-100 bg-blue-50">
                            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-800">
                                <span className="font-semibold">One-Time Attempt Policy:</span> You are allowed to
                                attempt this exam <span className="font-semibold">only once</span>. Once you start and
                                submit, re-entry will be permanently blocked.
                            </p>
                        </div>

                        {/* ── Code of Conduct & Violation Limits ── */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-slate-500" />
                                Code of Conduct &amp; Violation Limits
                            </h3>
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 space-y-4">
                                <ul className="space-y-3">
                                    {[
                                        "Strict Prohibition: No generic materials, external sites, or communication tools.",
                                        "Monitoring: Your webcam, microphone, and screen activity are recorded.",
                                        "Fullscreen Mode: Exiting fullscreen will trigger a warning log.",
                                        "Identity Verification: Ensure your face is clearly visible at all times."
                                    ].map((rule, i) => (
                                        <li key={i} className="flex gap-3 text-sm text-slate-700">
                                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                            <span>{rule}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-6 pt-4 border-t border-amber-200">
                                    <h4 className="text-sm font-bold text-slate-900 mb-3">Violation Limits</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {[
                                            { label: 'Face Detection', value: violationLimits.faceLimit },
                                            { label: 'Sound Detection', value: violationLimits.soundLimit },
                                            { label: 'Fullscreen Exit', value: violationLimits.fullscreenLimit }
                                        ].map(({ label, value }) => (
                                            <div key={label} className="bg-white rounded-lg p-3 border border-amber-200">
                                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</div>
                                                <div className="text-2xl font-bold text-red-600">{value}</div>
                                                <div className="text-xs text-slate-600 mt-1">violations allowed</div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-600 mt-3 italic">
                                        ⚠️ Exceeding these limits will result in automatic screenshot capture and potential exam termination.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Footer action ── */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                            />
                            <div
                                className={`w-5 h-5 border-2 rounded transition-colors ${agreed ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}
                            >
                                {agreed && <CheckSquare className="w-4 h-4 text-white absolute top-0 left-0" />}
                            </div>
                        </div>
                        <span className="text-sm text-slate-600 font-medium">
                            I have read and agree to follow the examination protocols.
                        </span>
                    </label>

                    <button
                        onClick={handleStart}
                        disabled={!agreed}
                        className={`px-8 py-3 rounded-md font-semibold text-sm transition-all flex items-center gap-2
                            ${agreed
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        Start Assessment
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="text-center text-xs text-slate-400">
                    Session ID: {sessionId} &bull; Server Time: {new Date().toUTCString()}
                </div>
            </div>

            {/* Environment Check Modal */}
            {showEnvironmentCheck && (
                <EnvironmentCheck onCheckComplete={handleEnvironmentCheckComplete} />
            )}
        </div>
    );
};

export default Instructions;
