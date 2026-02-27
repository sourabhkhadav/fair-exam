
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Clock, Menu, X, ChevronRight, Flag, AlertTriangle, CheckCircle } from 'lucide-react';
import LiveCameraMonitor from '../components/LiveCameraMonitor';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

const Exam = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { examId: urlExamId } = useParams();

    // Get real candidate and exam data from localStorage
    const candidateData = JSON.parse(localStorage.getItem('candidate') || '{}');
    const storedExamData = JSON.parse(localStorage.getItem('examData') || '{}');

    const userName = candidateData.name || location.state?.name || 'Candidate';
    // Support all possible field names set by the login flow
    const candidateId = candidateData._id || candidateData.id || candidateData.candidateId || localStorage.getItem('candidateId') || null;
    // examId: check every possible location the login flow stores it
    const examId = candidateData.examId
        || storedExamData._id
        || storedExamData.id
        || storedExamData.examId
        || urlExamId
        || null;
    const examName = storedExamData.title || candidateData.examTitle || 'Exam';

    // State Management
    const [examData, setExamData] = useState(null);
    const [allQuestions, setAllQuestions] = useState([]);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); // shows full-screen overlay
    const [timeLeft, setTimeLeft] = useState(5400);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [questionStatus, setQuestionStatus] = useState({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [violations, setViolations] = useState(0);
    const [soundViolations, setSoundViolations] = useState(0);
    const [faceViolations, setFaceViolations] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [violationLimits, setViolationLimits] = useState({ faceLimit: 5, soundLimit: 5, fullscreenLimit: 5 });
    const [showViolationAutoSubmitModal, setShowViolationAutoSubmitModal] = useState(false);
    const [violationAutoSubmitMessage, setViolationAutoSubmitMessage] = useState('');
    const [autoSubmitCountdown, setAutoSubmitCountdown] = useState(3);

    useEffect(() => {
        if (!examId || !candidateId) {
            toast.error('Session expired. Please log in again.');
            navigate('/candidate-login');
            return;
        }
        // One-attempt gate: abort if already submitted
        const guard = async () => {
            try {
                const cid = candidateData.id || candidateData._id;
                if (examId && cid) {
                    const r = await fetch(`${API_BASE_URL}/submissions/check/${examId}/${cid}`);
                    const d = await r.json();
                    if (d.success && d.hasSubmitted) {
                        toast.error('You have already submitted this exam.');
                        navigate('/candidate-login');
                        return;
                    }
                }
            } catch (_) { /* ignore network errors on guard */ }
            fetchExamQuestions();
        };
        guard();
    }, [examId]);

    const fetchExamQuestions = async () => {
        try {
            console.log('Fetching exam with ID:', examId);
            const url = `${API_BASE_URL}/exams/public/${examId}/questions`;
            console.log('API URL:', url);

            const response = await fetch(url);
            console.log('Response status:', response.status);

            const data = await response.json();
            console.log('Response data:', data);

            if (data.success) {
                setExamData(data.data);
                setAllQuestions(data.data.questions);
                setSections(data.data.sections || [{ id: 0, name: 'Section 1' }]);
                if (data.data.duration) {
                    setTimeLeft(data.data.duration * 60);
                }
                if (data.data.violationLimits) {
                    setViolationLimits(data.data.violationLimits);
                }
                console.log('Loaded', data.data.questions.length, 'questions');
                console.log('Sections:', data.data.sections);
                console.log('Violation Limits:', data.data.violationLimits);
            } else {
                toast.error(data.message || 'Failed to load exam');
            }
        } catch (error) {
            console.error('Error fetching exam:', error);
            toast.error('Failed to load exam: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle face violations from LiveCameraMonitor
    const handleViolationUpdate = (violationsList) => {
        // 🔒 Stop all violation callbacks once exam is being submitted
        if (isSubmittingRef.current) return;
        const count = violationsList.length;
        setFaceViolations(count);
        faceViolationsRef.current = count;
        if (count >= violationLimitsRef.current.faceLimit) {
            // High violation: show warning, then auto-submit (use ref for latest function)
            if (triggerViolationAutoSubmitRef.current) triggerViolationAutoSubmitRef.current('Face detection violation limit exceeded. Your exam is being auto-submitted.');
        }
    };

    // Simple Audio Detection - No Meyda Required
    useEffect(() => {
        let animationFrameId = null;

        const startAudioDetection = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: false
                    }
                });
                micStreamRef.current = stream;

                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                const microphone = audioContextRef.current.createMediaStreamSource(stream);
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 512;
                microphone.connect(analyserRef.current);

                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                let calibrationSamples = [];
                let baselineVolume = 0;

                const detectSound = () => {
                    analyserRef.current.getByteFrequencyData(dataArray);
                    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

                    // Calibration - first 60 frames
                    if (calibrationSamples.length < 60) {
                        calibrationSamples.push(average);
                        if (calibrationSamples.length === 60) {
                            const sorted = [...calibrationSamples].sort((a, b) => a - b);
                            baselineVolume = sorted[Math.floor(sorted.length * 0.7)];
                            calibrationDoneRef.current = true;
                            console.log('✅ Audio calibrated - Baseline:', baselineVolume.toFixed(2));
                        }
                        animationFrameId = requestAnimationFrame(detectSound);
                        return;
                    }

                    const threshold = baselineVolume + 15;

                    if (average > threshold && !soundLockRef.current && !isSubmittingRef.current) {
                        soundLockRef.current = true;

                        setSoundViolations(prev => {
                            const newCount = prev + 1;
                            soundViolationsRef.current = newCount;
                            toast.error(`🔊 Sound detected! Violation #${newCount}/${violationLimitsRef.current.soundLimit}`, {
                                id: 'sound-warning',
                                duration: 500,
                            });
                            console.log('🔊 SOUND! Level:', average.toFixed(2), 'Threshold:', threshold.toFixed(2));
                            // Trigger auto-submit if sound violation limit reached
                            if (newCount >= violationLimitsRef.current.soundLimit) {
                                // High violation: show warning, then auto-submit (use ref for latest function)
                                if (triggerViolationAutoSubmitRef.current) triggerViolationAutoSubmitRef.current('Sound detection violation limit exceeded. Your exam is being auto-submitted.');
                            }
                            return newCount;
                        });

                        setTimeout(() => {
                            soundLockRef.current = false;
                        }, 2000);
                    }

                    animationFrameId = requestAnimationFrame(detectSound);
                };

                detectSound();
                console.log('✅ Microphone access granted');

            } catch (err) {
                console.error('❌ Microphone error:', err);
                if (err.name === 'NotAllowedError') {
                    toast.error('⚠️ Microphone access required!', {
                        duration: Infinity,
                        style: { background: '#DC2626', color: '#fff', fontWeight: 'bold', fontSize: '16px' }
                    });
                } else {
                    toast.error('Microphone error: ' + err.message, {
                        duration: 5000,
                        style: { background: '#DC2626', color: '#fff', fontWeight: 'bold' }
                    });
                }
            }
        };

        startAudioDetection();

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            if (micStreamRef.current) {
                micStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    // Fullscreen & Tab Switch Prevention
    useEffect(() => {
        let violationTimeout = null;

        const playWarningSound = () => {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.3);
            } catch (err) {
                console.error('Audio error:', err);
            }
        };

        const addViolation = (message) => {
            if (violationTimeout) return;

            setViolations(prev => {
                const newCount = prev + 1;
                violationsRef.current = newCount;
                playWarningSound();
                toast.error(`⚠️ ${message} Violation #${newCount}/${violationLimitsRef.current.fullscreenLimit}`, {
                    id: 'violation',
                    duration: 500,
                });
                // Trigger auto-submit if fullscreen violation limit reached
                if (newCount >= violationLimitsRef.current.fullscreenLimit) {
                    // High violation: show warning, then auto-submit (use ref for latest function)
                    if (triggerViolationAutoSubmitRef.current) triggerViolationAutoSubmitRef.current('Fullscreen exit violation limit exceeded. Your exam is being auto-submitted.');
                }
                return newCount;
            });

            violationTimeout = setTimeout(() => {
                violationTimeout = null;
            }, 2000);
        };

        const enterFullscreen = async () => {
            try {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true);
                setForceFullscreenModal(false);
            } catch (err) {
                console.error('Fullscreen error:', err);
            }
        };

        // Auto enter fullscreen on mount
        setTimeout(enterFullscreen, 500);

        const handleFullscreenChange = () => {
            // Ignore fullscreen exit if exam is already being submitted or navigating away
            if (isSubmittingRef.current || navigatingRef.current) return;
            if (!document.fullscreenElement) {
                addViolation('Fullscreen Exit!');
                setForceFullscreenModal(true);
            }
        };

        const preventEscape = (e) => {
            if (e.key === 'Escape' && document.fullscreenElement) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('keydown', preventEscape, true);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('keydown', preventEscape, true);
            if (violationTimeout) clearTimeout(violationTimeout);
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => { });
            }
        };
    }, []);

    // Timer Logic
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Use ref to call fresh handleSubmit
                    if (handleSubmitRef.current) handleSubmitRef.current();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const micStreamRef = useRef(null);
    const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
    const warningAudioRef = useRef(null);
    const violationLockRef = useRef(false);
    const [forceFullscreenModal, setForceFullscreenModal] = useState(false);
    const soundLockRef = useRef(false);
    const baselineRef = useRef(0);
    const calibrationDoneRef = useRef(false);
    const isSubmittingRef = useRef(false); // Guard: prevent duplicate submissions
    const navigatingRef = useRef(false);   // Guard: prevent fullscreen modal after redirect
    const handleSubmitRef = useRef(null);  // Always points to latest handleSubmit
    const triggerViolationAutoSubmitRef = useRef(null); // Always points to latest triggerViolationAutoSubmit

    // Refs to track latest violation counts (state may not be flushed when handleSubmit is called from setState)
    const faceViolationsRef = useRef(0);
    const soundViolationsRef = useRef(0);
    const violationsRef = useRef(0);

    // Ref to always hold the latest violation limits (closures in useEffect[] can't see state updates)
    const violationLimitsRef = useRef(violationLimits);
    violationLimitsRef.current = violationLimits;

    // Trigger violation auto-submit: show warning modal, then auto-submit after 3 seconds
    const triggerViolationAutoSubmit = (message) => {
        if (isSubmittingRef.current) return; // already submitting
        setViolationAutoSubmitMessage(message);
        setShowViolationAutoSubmitModal(true);
        setAutoSubmitCountdown(3);
    };

    // Keep refs always pointing to the latest versions
    triggerViolationAutoSubmitRef.current = triggerViolationAutoSubmit;

    // Auto-submit countdown when violation modal is shown
    useEffect(() => {
        if (!showViolationAutoSubmitModal) return;

        const countdownTimer = setInterval(() => {
            setAutoSubmitCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownTimer);
                    // Use ref to call fresh handleSubmit
                    if (handleSubmitRef.current) handleSubmitRef.current();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(countdownTimer);
    }, [showViolationAutoSubmitModal]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg font-medium text-slate-600">Loading exam...</div>
            </div>
        );
    }

    if (!examData || allQuestions.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg font-medium text-slate-600">No questions available</div>
            </div>
        );
    }

    const currentQuestion = allQuestions[currentQuestionIndex];

    // Navigation & Interaction Handlers
    const handleAnswerChange = (value) => {
        setAnswers({ ...answers, [currentQuestion.id]: value });
        if (questionStatus[currentQuestion.id] !== 'marked') {
            setQuestionStatus({ ...questionStatus, [currentQuestion.id]: 'answered' });
        }
    };

    const handleNext = () => {
        if (currentQuestionIndex < allQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleMarkForReview = () => {
        const newStatus = questionStatus[currentQuestion.id] === 'marked' ? (answers[currentQuestion.id] ? 'answered' : 'unvisited') : 'marked';
        setQuestionStatus({ ...questionStatus, [currentQuestion.id]: newStatus });
    };

    const handleJumpToQuestion = (index) => {
        setCurrentQuestionIndex(index);
        setIsSidebarOpen(false);
    };

    const handleSubmit = async () => {
        // 🔒 Prevent duplicate submissions (timer + violation race condition)
        if (isSubmittingRef.current) {
            console.log('⚠️ Submission already in progress, ignoring duplicate call.');
            return;
        }
        isSubmittingRef.current = true;

        // Dismiss all active toasts immediately
        toast.dismiss();

        // Show full-screen submitting overlay IMMEDIATELY – user never sees exam page
        setIsSubmitting(true);
        setIsSubmitModalOpen(false);
        setShowViolationAutoSubmitModal(false);
        setForceFullscreenModal(false);

        // Snap navigatingRef so fullscreen events are suppressed right away
        navigatingRef.current = true;

        // Stop microphone immediately
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => { });
        }

        // Exit fullscreen silently right now (before awaiting APIs)
        if (document.fullscreenElement) {
            await document.exitFullscreen().catch(() => { });
        }

        try {
            // Read fresh from localStorage since we haven't cleared it yet
            const freshCandidate = JSON.parse(localStorage.getItem('candidate') || '{}');
            const freshExam = JSON.parse(localStorage.getItem('examData') || '{}');
            const resolvedCandidateId = freshCandidate._id || freshCandidate.id || freshCandidate.candidateId || localStorage.getItem('candidateId');
            const resolvedExamId = freshCandidate.examId || freshExam._id || freshExam.id || freshExam.examId || examId;

            // Prepare answers for submission
            const submissionAnswers = Object.entries(answers).map(([questionId, selectedOption]) => {
                const question = allQuestions.find(q => q.id.toString() === questionId);
                const optionIndex = question?.options.indexOf(selectedOption);
                return {
                    questionId,
                    selectedOption: optionIndex !== undefined ? optionIndex : -1
                };
            });

            // Submit exam
            const submitRes = await fetch(`${API_BASE_URL}/submissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    examId: resolvedExamId,
                    candidateId: resolvedCandidateId,
                    answers: submissionAnswers,
                    timeTaken: examData ? (examData.duration * 60) - timeLeft : 0
                })
            });
            const submitData = await submitRes.json();
            console.log('✅ Submit response:', submitData);

            // Record violations if any exist — use refs for latest counts
            const finalFace = faceViolationsRef.current;
            const finalSound = soundViolationsRef.current;
            const finalFullscreen = violationsRef.current;
            console.log(`📊 Final violation counts — Face: ${finalFace}, Sound: ${finalSound}, Fullscreen: ${finalFullscreen}`);

            if (finalFace > 0 || finalSound > 0 || finalFullscreen > 0) {
                const violationRes = await fetch(`${API_BASE_URL}/violations/record`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        candidateId: resolvedCandidateId,
                        candidateName: userName,
                        examId: resolvedExamId,
                        examName,
                        violationType: 'face',
                        violationCount: {
                            faceDetection: finalFace,
                            soundDetection: finalSound,
                            fullscreenExit: finalFullscreen,
                            tabSwitch: 0
                        }
                    })
                });
                const violationData = await violationRes.json();
                console.log('✅ Violation record response:', violationData);
            }

            // 🎉 Success — clear storage, dismiss ALL toasts, and redirect cleanly
            localStorage.clear();
            toast.dismiss(); // Kill any toasts created during async submission
            navigate('/');
        } catch (error) {
            console.error('Submit error:', error);
            // Even on error, exit cleanly
            localStorage.clear();
            toast.dismiss();
            navigate('/');
        }
    };

    // Keep handleSubmitRef always pointing to the latest handleSubmit
    handleSubmitRef.current = handleSubmit;

    const getStatusColor = (id) => {
        const status = questionStatus[id];
        const isCurrent = id === currentQuestion.id;

        if (isCurrent) return 'bg-blue-600 text-white border-blue-600';
        if (status === 'marked') return 'bg-amber-100 text-amber-700 border-amber-300';
        if (status === 'answered') return 'bg-emerald-100 text-emerald-700 border-emerald-300';
        return 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50';
    };

    return (
        <div className="flex flex-col h-screen bg-white font-sans text-slate-900 overflow-hidden">

            {/* ── Submitting full-screen overlay ── */}
            {isSubmitting && (
                <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-blue-950">
                    <div className="flex flex-col items-center gap-6">
                        {/* Spinner */}
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full border-4 border-blue-900 border-t-blue-400 animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-blue-400" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">Submitting Your Exam…</h2>
                            <p className="text-blue-300 text-sm">Please wait. Do not close this window.</p>
                        </div>
                        {/* Animated dots */}
                        <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Live Camera Monitor - Always Visible */}
            <LiveCameraMonitor
                onViolationUpdate={handleViolationUpdate}
                candidateId={candidateId}
                candidateName={userName}
                examId={examId}
                examName={examData?.title || 'Exam'}
            />

            {/* Top Bar - Enterprise Style */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-30 shadow-sm flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white font-black p-1.5 px-2.5 rounded-lg text-base shadow-md border border-blue-500">FE</div>
                        <div>
                            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-700 to-blue-600 leading-none" style={{ fontFamily: "'Righteous', cursive", letterSpacing: '0.05em' }}>
                                FairExam
                            </h1>
                            <span className="text-[9px] font-semibold text-slate-400 tracking-widest">EXAMINATION SYSTEM</span>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-slate-200"></div>
                    <div>
                        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Candidate Name</span>
                        <span className="text-sm font-medium text-slate-900">{userName}</span>
                    </div>
                </div>

                <div className={`flex items-center gap-3 px-4 py-1.5 rounded bg-slate-50 border ${timeLeft < 300 ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}>
                    <Clock className={`w-4 h-4 ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-slate-500'}`} />
                    <span className={`font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-700' : 'text-slate-700'}`}>{formatTime(timeLeft)}</span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gradient-to-r from-red-50 to-red-100 border border-red-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-[10px] font-semibold text-red-700">FS: {violations}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                        <span className="text-[10px] font-semibold text-orange-700">S: {soundViolations}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>
                        <span className="text-[10px] font-semibold text-purple-700">F: {faceViolations}</span>
                    </div>
                    <div className="hidden sm:block text-right">
                        <div className="text-xs text-slate-500 uppercase">Assessment ID</div>
                        <div className="text-sm font-bold text-slate-900">#SWE-2026-X1</div>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 lg:hidden"
                    >
                        <Menu className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* Question Area */}
                <main className={`flex-1 flex flex-col h-full transition-all duration-300 ml-52 ${isSidebarOpen ? 'mr-0 lg:mr-80' : 'mr-0'}`}>

                    {/* Progress Strip */}
                    <div className="h-1 w-full bg-slate-200">
                        <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${(Object.keys(answers).length / allQuestions.length) * 100}%` }}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 md:p-10 pt-20 bg-white scroll-smooth custom-scrollbar">
                        <div className="max-w-3xl mx-auto w-full space-y-6">

                            {/* Question Header */}
                            <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-white text-slate-600 border border-slate-200 uppercase tracking-wide shadow-sm">
                                            Q.{currentQuestionIndex + 1}
                                        </span>
                                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Multiple Choice
                                        </span>
                                        {sections.length > 1 && (
                                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                {sections.find(s => s.id === currentQuestion.sectionId)?.name || 'Section 1'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {questionStatus[currentQuestion.id] === 'marked' && (
                                            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                                <Flag className="w-3 h-3" /> REVIEW
                                            </span>
                                        )}
                                        <button className="text-slate-400 hover:text-slate-600 p-1" title="Report Issue">
                                            <AlertTriangle className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h2 className="text-xl text-slate-900 font-medium leading-relaxed">
                                    {currentQuestion.question}
                                </h2>
                            </div>

                            {/* Answer Area */}
                            <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl shadow-sm">
                                {currentQuestion.type === 'mcq' && (
                                    <div className="space-y-3">
                                        {currentQuestion.options.map((option, idx) => (
                                            <label key={idx}
                                                className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all duration-150 group
                                                ${answers[currentQuestion.id] === option
                                                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500 shadow-md'
                                                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`q-${currentQuestion.id}`}
                                                    className="sr-only"
                                                    checked={answers[currentQuestion.id] === option}
                                                    onChange={() => handleAnswerChange(option)}
                                                />
                                                <div className={`w-5 h-5 rounded-full border mr-4 flex items-center justify-center flex-shrink-0
                                                    ${answers[currentQuestion.id] === option ? 'border-blue-600' : 'border-slate-300 group-hover:border-slate-400'}`}>
                                                    {answers[currentQuestion.id] === option && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                                </div>
                                                <span className={`text-base ${answers[currentQuestion.id] === option ? 'text-slate-900 font-medium' : 'text-slate-700'}`}>
                                                    {option}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}


                            </div>
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="bg-white border-t border-slate-200 p-4 px-6 flex justify-between items-center z-20">
                        <div className="flex gap-3">
                            <button
                                onClick={handleMarkForReview}
                                className="px-4 py-2 rounded text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2"
                            >
                                <Flag className="w-4 h-4" />
                                {questionStatus[currentQuestion.id] === 'marked' ? 'Unmark Review' : 'Mark for Review'}
                            </button>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handlePrev}
                                disabled={currentQuestionIndex === 0}
                                className="px-5 py-2 rounded text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            {currentQuestionIndex === allQuestions.length - 1 ? (
                                <button
                                    onClick={() => setIsSubmitModalOpen(true)}
                                    className="px-6 py-2 rounded text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" /> Submit Assessment
                                </button>
                            ) : (
                                <button
                                    onClick={handleNext}
                                    className="px-6 py-2 rounded text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-1"
                                >
                                    Next Question <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </main>

                {/* Right Sidebar - Palette */}
                <aside className={`
                    absolute lg:static top-0 right-0 h-full w-80 bg-white border-l border-slate-200 z-40 transform transition-transform duration-300 flex flex-col
                    ${isSidebarOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : 'translate-x-full lg:translate-x-0'}
                `}>
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Question Palette</h3>
                        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-4 bg-white border-b border-slate-100">
                        <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-500">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></div> Answered</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-100 border border-amber-300"></div> For Review</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-white border border-slate-200"></div> Unvisited</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-600 border border-blue-600"></div> Current</div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/30">
                        <div className="space-y-6">
                            {sections.map((section) => {
                                const sectionQuestions = allQuestions.filter(q => q.sectionId === section.id);
                                if (sectionQuestions.length === 0) return null;

                                return (
                                    <div key={section.id}>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-1">
                                            {section.name}
                                        </h4>
                                        <div className="grid grid-cols-5 gap-2">
                                            {sectionQuestions.map((q) => {
                                                const globalIdx = allQuestions.findIndex(item => item.id === q.id);
                                                return (
                                                    <button
                                                        key={q.id}
                                                        onClick={() => handleJumpToQuestion(globalIdx)}
                                                        className={`
                                                            h-9 w-9 rounded flex items-center justify-center text-sm font-medium border transition-all
                                                            ${getStatusColor(q.id)}
                                                        `}
                                                    >
                                                        {globalIdx + 1}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </aside>
            </div>

            {/* Force Fullscreen Modal - Blocks Everything */}
            {forceFullscreenModal && (
                <div className="fixed inset-0 bg-red-900/95 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-red-600 p-4 text-center">
                            <AlertTriangle className="h-12 w-12 text-white mx-auto mb-2 animate-pulse" />
                            <h3 className="text-2xl font-bold text-white">EXAM PAUSED</h3>
                        </div>
                        <div className="p-6 text-center">
                            <p className="text-lg font-semibold text-slate-900 mb-2">
                                Fullscreen Mode Required
                            </p>
                            <p className="text-sm text-slate-600 mb-4">
                                You must return to fullscreen to continue the exam.
                            </p>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                <p className="text-xs text-red-700 font-medium">
                                    Violation #{violations} recorded
                                </p>
                            </div>
                            <button
                                onClick={async () => {
                                    try {
                                        await document.documentElement.requestFullscreen();
                                        setForceFullscreenModal(false);
                                    } catch (err) {
                                        console.error('Fullscreen error:', err);
                                    }
                                }}
                                className="w-full px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-lg text-lg"
                            >
                                Return to Fullscreen
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Warning Modal */}
            {showFullscreenWarning && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top duration-300">
                    <div className={`rounded-lg shadow-2xl px-6 py-4 border-2 ${violations >= 3
                        ? 'bg-red-600 border-red-800 text-white'
                        : 'bg-amber-500 border-amber-700 text-white'
                        }`}>
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-6 w-6 animate-pulse" />
                            <div>
                                <p className="font-bold text-lg">
                                    {violations >= 3 ? 'SERIOUS WARNING!' : 'WARNING!'}
                                </p>
                                <p className="text-sm">
                                    Fullscreen Exit - Violation {violations}
                                </p>
                                <p className="text-xs mt-1">
                                    Returning to fullscreen...
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Violation Auto-Submit Modal — shows warning with 3s countdown */}
            {showViolationAutoSubmitModal && (
                <div className="fixed inset-0 bg-red-900/95 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-red-600 p-6 text-center">
                            <AlertTriangle className="h-14 w-14 text-white mx-auto mb-3 animate-pulse" />
                            <h3 className="text-2xl font-bold text-white">⚠️ Violation Limit Crossed!</h3>
                        </div>
                        <div className="p-8 text-center">
                            <p className="text-lg font-semibold text-slate-900 mb-3">
                                You have crossed the violation limit.
                            </p>
                            <p className="text-sm text-slate-600 mb-4">
                                {violationAutoSubmitMessage}
                            </p>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5">
                                <div className="flex justify-center gap-6 text-xs font-semibold text-red-700">
                                    <span>Face: {faceViolations}/{violationLimits.faceLimit}</span>
                                    <span>Sound: {soundViolations}/{violationLimits.soundLimit}</span>
                                    <span>Fullscreen: {violations}/{violationLimits.fullscreenLimit}</span>
                                </div>
                            </div>
                            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6">
                                <p className="text-amber-800 font-bold text-lg">
                                    Auto-submitting in {autoSubmitCountdown} second{autoSubmitCountdown !== 1 ? 's' : ''}...
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    if (handleSubmitRef.current) handleSubmitRef.current();
                                }}
                                className="w-full px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-lg text-lg"
                            >
                                Submit Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit Modal */}
            {isSubmitModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 mb-4">
                                <AlertTriangle className="h-6 w-6 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">End Assessment?</h3>
                            <p className="mt-2 text-sm text-slate-500">
                                You have {allQuestions.length - Object.keys(answers).length} unanswered questions. Once submitted, you cannot return to the exam.
                            </p>
                        </div>
                        <div className="bg-slate-50 px-6 py-4 flex gap-3">
                            <button
                                onClick={() => setIsSubmitModalOpen(false)}
                                className="flex-1 px-4 py-2 bg-white text-slate-700 text-sm font-medium border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-1 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
                            >
                                Submit All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Exam;
