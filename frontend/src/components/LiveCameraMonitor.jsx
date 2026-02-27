import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { API_BASE_URL } from '../config/api';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { Camera, CameraOff, AlertTriangle, Users, EyeOff, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { detectMultiplePeople } from '../utils/advancedPersonDetection';

const LiveCameraMonitor = ({ onViolationUpdate, candidateId, candidateName, examId, examName }) => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [cameraStatus, setCameraStatus] = useState('loading');
    const [isCameraEnabled, setIsCameraEnabled] = useState(true);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [violations, setViolations] = useState([]);
    const [currentWarning, setCurrentWarning] = useState(null);
    const [detectionStats, setDetectionStats] = useState({
        faceCount: 0,
        bodyVisible: false,
        poseDetected: false,
        lastDetectionTime: null
    });

    const detectionIntervalRef = useRef(null);
    const violationTimersRef = useRef({
        noFace: null,
        noFaceStartTime: null,
        multipleFaceStartTime: null,
        multipleFaceToastId: null,
        lookingAway: null,
        lookingAwayStartTime: null,
        eyeGazeAway: null,
        eyeGazeAwayStartTime: null,
        noBody: null,
        noBodyStartTime: null,
        multiplePersonToastId: null
    });

    // Load face-api.js models
    useEffect(() => {
        loadModels();
        requestCameraPermission();

        return () => {
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current);
            }
            Object.values(violationTimersRef.current).forEach(timer => {
                if (timer) clearTimeout(timer);
            });
        };
    }, []);

    // Start detection when models loaded and camera active
    useEffect(() => {
        if (modelsLoaded && cameraStatus === 'active' && isCameraEnabled) {
            startDetection();
        } else {
            stopDetection();
        }
    }, [modelsLoaded, cameraStatus, isCameraEnabled]);

    const loadModels = async () => {
        try {
            const MODEL_URL = '/models';
            console.log('Loading TinyFaceDetector...');
            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            console.log('Loading Face Landmarks...');
            await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
            setModelsLoaded(true);
            console.log('✅ All models loaded successfully');
        } catch (error) {
            console.error('❌ Model loading failed:', error);
            toast.error('AI models failed to load. Using basic monitoring.');
        }
    };

    const requestCameraPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            setCameraStatus('active');
        } catch (error) {
            setCameraStatus(error.name === 'NotAllowedError' ? 'denied' : 'error');
        }
    };

    const startDetection = () => {
        detectionIntervalRef.current = setInterval(async () => {
            await detectFaces();
            await detectAdvancedPerson();
        }, 18);
    };

    const stopDetection = () => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }
    };

    const detectFaces = async () => {
        if (!webcamRef.current?.video || !modelsLoaded) return;

        const video = webcamRef.current.video;
        if (video.readyState !== 4) return;

        try {
            const detections = await faceapi.detectAllFaces(
                video,
                new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.2 })
            );

            const faceCount = detections.length;
            const currentTime = Date.now();

            // Body detection: Check if face is too large (too close) or too small (too far)
            let bodyVisible = false;
            if (faceCount === 1) {
                const faceBox = detections[0].box;
                const videoHeight = video.videoHeight;
                const faceHeight = faceBox.height;
                const faceRatio = faceHeight / videoHeight;

                // Face should be 15-50% of video height for proper body visibility
                bodyVisible = faceRatio >= 0.15 && faceRatio <= 0.5;
                console.log('📏 Face ratio:', faceRatio.toFixed(2), 'Body visible:', bodyVisible);
            }

            console.log('🔍 Detected faces:', faceCount);

            setDetectionStats(prev => ({
                ...prev,
                faceCount,
                bodyVisible,
                lastDetectionTime: currentTime
            }));

            // Rule 1: Multiple Faces Detection
            if (faceCount > 1) {
                handleMultipleFaces(currentTime);
            } else {
                resetMultipleFaceTimer();
            }

            // Rule 2: No Face Detection
            if (faceCount === 0) {
                handleNoFace(currentTime);
            } else {
                resetNoFaceTimer();
            }

            // Body visibility check
            if (faceCount === 1 && !bodyVisible) {
                handleNoBody(currentTime);
            } else {
                resetNoBodyTimer();
            }

            // Only do advanced detection if exactly 1 face
            if (faceCount === 1) {
                const detectionWithLandmarks = await faceapi.detectSingleFace(
                    video,
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.2 })
                ).withFaceLandmarks();

                if (detectionWithLandmarks) {
                    checkLookingAway(detectionWithLandmarks.landmarks, currentTime);
                    trackEyeGaze(detectionWithLandmarks.landmarks, currentTime);
                }
            } else {
                resetLookingAwayTimer();
                resetEyeGazeTimer();
            }

        } catch (error) {
            console.error('Detection error:', error);
        }
    };

    const handleMultipleFaces = (currentTime) => {
        if (!violationTimersRef.current.multipleFaceStartTime) {
            violationTimersRef.current.multipleFaceStartTime = currentTime;
            const toastId = toast.error('⚠️ Multiple people detected! Ensure you are alone.', {
                duration: Infinity,
                style: { background: '#DC2626', color: '#fff', fontWeight: 'bold', fontSize: '16px' }
            });
            violationTimersRef.current.multipleFaceToastId = toastId;
            console.log('🚨 MULTIPLE FACES DETECTED!');
            logViolation('MULTIPLE_PERSON_DETECTED', 'Multiple people detected');
        }
    };

    const resetMultipleFaceTimer = () => {
        violationTimersRef.current.multipleFaceStartTime = null;
        if (violationTimersRef.current.multipleFaceToastId) {
            toast.dismiss(violationTimersRef.current.multipleFaceToastId);
            violationTimersRef.current.multipleFaceToastId = null;
        }
    };

    const handleNoFace = (currentTime) => {
        if (!violationTimersRef.current.noFaceStartTime) {
            violationTimersRef.current.noFaceStartTime = currentTime;
        }

        const duration = currentTime - violationTimersRef.current.noFaceStartTime;

        if (duration > 2000 && !violationTimersRef.current.noFace) {
            violationTimersRef.current.noFace = true;
            logViolation('FACE_NOT_VISIBLE', 'Face not detected');
            toast.error('⚠️ Face not visible!', {
                duration: 4000,
                style: { background: '#EA580C', color: '#fff', fontWeight: 'bold' }
            });
        }
    };

    const resetNoFaceTimer = () => {
        violationTimersRef.current.noFaceStartTime = null;
        violationTimersRef.current.noFace = false;
    };

    const checkLookingAway = (landmarks, currentTime) => {
        const nose = landmarks.getNose();
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        const eyeY = (leftEye[0].y + rightEye[0].y) / 2;
        const noseY = nose[3].y;
        const verticalDiff = noseY - eyeY;

        // Increased threshold to reduce false positives
        const isLookingDown = verticalDiff > 60;

        if (isLookingDown) {
            handleLookingAway(currentTime);
        } else {
            resetLookingAwayTimer();
        }
    };

    const handleLookingAway = (currentTime) => {
        if (!violationTimersRef.current.lookingAwayStartTime) {
            violationTimersRef.current.lookingAwayStartTime = currentTime;
        }

        const duration = currentTime - violationTimersRef.current.lookingAwayStartTime;

        if (duration > 3000 && !violationTimersRef.current.lookingAway) {
            violationTimersRef.current.lookingAway = true;
            logViolation('LOOKING_AWAY', 'Candidate looking down/away from screen');
            toast.error('⚠️ Looking away detected!', {
                duration: 4000,
                style: { background: '#DC2626', color: '#fff', fontWeight: 'bold' }
            });
        }
    };

    const resetLookingAwayTimer = () => {
        violationTimersRef.current.lookingAwayStartTime = null;
        violationTimersRef.current.lookingAway = false;
    };

    const trackEyeGaze = (landmarks, currentTime) => {
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        const nose = landmarks.getNose();

        const leftEyeCenter = {
            x: leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length,
            y: leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length
        };
        const rightEyeCenter = {
            x: rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length,
            y: rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length
        };
        const noseCenter = { x: nose[3].x, y: nose[3].y };

        const eyeMidpoint = {
            x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
            y: (leftEyeCenter.y + rightEyeCenter.y) / 2
        };

        const horizontalDiff = eyeMidpoint.x - noseCenter.x;
        const eyeDistance = Math.abs(rightEyeCenter.x - leftEyeCenter.x);

        let gazeDirection = 'center';
        const threshold = eyeDistance * 0.25; // Increased threshold

        if (Math.abs(horizontalDiff) > threshold) {
            if (horizontalDiff > 0) {
                gazeDirection = 'left';
            } else {
                gazeDirection = 'right';
            }
        }

        if (gazeDirection !== 'center') {
            handleEyeGazeAway(gazeDirection, currentTime);
        } else {
            resetEyeGazeTimer();
        }
    };

    const handleEyeGazeAway = (direction, currentTime) => {
        if (!violationTimersRef.current.eyeGazeAwayStartTime) {
            violationTimersRef.current.eyeGazeAwayStartTime = currentTime;
        }

        const duration = currentTime - violationTimersRef.current.eyeGazeAwayStartTime;

        if (duration > 4000 && !violationTimersRef.current.eyeGazeAway) {
            violationTimersRef.current.eyeGazeAway = true;
            logViolation('EYE_GAZE_AWAY', `Eyes looking ${direction} - possible side screen/notes`);
            toast.error(`⚠️ Eyes looking ${direction}!`, {
                duration: 4000,
                style: { background: '#DC2626', color: '#fff', fontWeight: 'bold' }
            });
        }
    };

    const resetEyeGazeTimer = () => {
        violationTimersRef.current.eyeGazeAwayStartTime = null;
        violationTimersRef.current.eyeGazeAway = false;
    };

    const handleNoBody = (currentTime) => {
        if (!violationTimersRef.current.noBodyStartTime) {
            violationTimersRef.current.noBodyStartTime = currentTime;
        }

        const duration = currentTime - violationTimersRef.current.noBodyStartTime;

        if (duration > 3000 && !violationTimersRef.current.noBody) {
            violationTimersRef.current.noBody = true;
            logViolation('BODY_NOT_VISIBLE', 'Upper body not properly visible - adjust camera position');
            toast.error('⚠️ Position yourself properly! Show upper body.', {
                duration: 5000,
                style: { background: '#DC2626', color: '#fff', fontWeight: 'bold' }
            });
        }
    };

    const resetNoBodyTimer = () => {
        violationTimersRef.current.noBodyStartTime = null;
        violationTimersRef.current.noBody = false;
    };

    const detectAdvancedPerson = async () => {
        if (!webcamRef.current?.video) return;

        const video = webcamRef.current.video;
        if (video.readyState !== 4) return;

        try {
            const poseAnalysis = await detectMultiplePeople(video);

            const isViolation = poseAnalysis?.suspiciousActivity;
            const warning = poseAnalysis?.warning;

            if (isViolation) {
                if (!violationTimersRef.current.multiplePersonToastId) {
                    const toastId = toast.error(`🚨 ${warning}`, {
                        duration: Infinity,
                        style: { background: '#DC2626', color: '#fff', fontWeight: 'bold', fontSize: '16px' }
                    });
                    violationTimersRef.current.multiplePersonToastId = toastId;
                    logViolation('SIDE_PERSON_DETECTED', warning);
                }
            } else {
                if (violationTimersRef.current.multiplePersonToastId) {
                    toast.dismiss(violationTimersRef.current.multiplePersonToastId);
                    violationTimersRef.current.multiplePersonToastId = null;
                }
            }

            setDetectionStats(prev => ({
                ...prev,
                poseDetected: !!poseAnalysis
            }));
        } catch (error) {
            console.error('Advanced detection error:', error);
        }
    };

    const captureScreenshot = async () => {
        if (!webcamRef.current) return null;

        try {
            const screenshot = webcamRef.current.getScreenshot();
            if (!screenshot) {
                console.error('No screenshot captured');
                return null;
            }

            const uploadResponse = await fetch(`${API_BASE_URL}/violations/upload-screenshot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: screenshot,
                    candidateId,
                    candidateName,
                    examId,
                    examName,
                    violationCount: violations.length + 1
                })
            });

            const data = await uploadResponse.json();

            if (data.success && data.url) {
                console.log('✅ Screenshot uploaded:', data.url);
                toast.success('Screenshot captured!', {
                    duration: 2000,
                    style: { background: '#059669', color: '#fff', fontWeight: 'bold' }
                });
                return data.url;
            } else {
                throw new Error(data.message || 'Upload failed');
            }
        } catch (error) {
            console.error('❌ Screenshot error:', error);
            return null;
        }
    };

    const logViolation = async (type, description) => {
        const violation = {
            time: new Date().toLocaleTimeString(),
            type,
            description,
            timestamp: Date.now()
        };
        setViolations(prev => {
            const updated = [...prev, violation];

            // Capture screenshot on every 5th violation
            if (updated.length % 5 === 0) {
                setTimeout(async () => {
                    const screenshotUrl = await captureScreenshot();
                    if (screenshotUrl) {
                        // Update the violation record with screenshot URL
                        await recordViolationToBackend(screenshotUrl);
                    }
                }, 100);
            }

            if (onViolationUpdate) {
                onViolationUpdate(updated);
            }
            return updated;
        });
        console.log('🚨 VIOLATION:', violation);
    };

    const recordViolationToBackend = async (screenshotUrl) => {
        try {
            // Only send the screenshot and violationType — do NOT send violationCount here
            // because it would overwrite sound/fullscreen counts to 0.
            // The final accurate counts for all three types are sent by handleSubmit().
            await fetch(`${API_BASE_URL}/violations/record`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    candidateId,
                    candidateName,
                    examId,
                    examName,
                    violationType: 'face',
                    screenshotUrl
                })
            });
            console.log('✅ Violation screenshot recorded');
        } catch (error) {
            console.error('❌ Failed to record violation:', error);
        }
    };

    const renderCameraContent = () => {
        switch (cameraStatus) {
            case 'active':
                return (
                    <>
                        <Webcam
                            ref={webcamRef}
                            audio={false}
                            screenshotFormat="image/jpeg"
                            mirrored={true}
                            videoConstraints={{
                                width: 640,
                                height: 480,
                                facingMode: 'user'
                            }}
                            className="w-full h-full object-cover rounded"
                        />
                        <canvas ref={canvasRef} className="hidden" />
                    </>
                );

            case 'denied':
                return (
                    <div className="flex flex-col items-center justify-center h-full bg-red-50 rounded p-2 border border-red-300">
                        <CameraOff className="w-6 h-6 text-red-600 mb-1" />
                        <p className="text-[10px] font-bold text-red-700 text-center">⚠️ Required</p>
                        <p className="text-[8px] text-red-600 text-center mt-0.5">Enable camera</p>
                    </div>
                );

            case 'error':
                return (
                    <div className="flex flex-col items-center justify-center h-full bg-yellow-50 rounded p-2 border border-yellow-300">
                        <AlertTriangle className="w-6 h-6 text-yellow-600 mb-1" />
                        <p className="text-[10px] font-bold text-yellow-700 text-center">⚠️ Error</p>
                        <button
                            onClick={requestCameraPermission}
                            className="text-[8px] text-yellow-600 underline mt-0.5"
                        >
                            Retry
                        </button>
                    </div>
                );

            default:
                return (
                    <div className="flex items-center justify-center h-full bg-gray-100 rounded">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                    </div>
                );
        }
    };

    return (
        <div className="fixed top-20 left-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl border-2 border-[#E2E8F0] overflow-hidden w-64">
                {/* Header */}
                <div className="bg-[#0F172A] px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${cameraStatus === 'active' && isCameraEnabled ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                        <span className="text-white text-xs font-bold uppercase tracking-wider">
                            {modelsLoaded ? 'AI Active' : 'Loading'}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsCameraEnabled(!isCameraEnabled)}
                        className="text-white text-xs hover:bg-white/10 px-2 py-1 rounded font-medium"
                    >
                        {isCameraEnabled ? 'OFF' : 'ON'}
                    </button>
                </div>

                {/* Warning Banner - REMOVED */}

                {/* Camera Feed - BIGGER */}
                <div className="relative w-full h-48 bg-gray-900">
                    {isCameraEnabled ? renderCameraContent() : (
                        <div className="flex flex-col items-center justify-center h-full bg-gray-800">
                            <CameraOff className="w-10 h-10 text-gray-400 mb-2" />
                            <p className="text-gray-400 text-sm">Camera Off</p>
                        </div>
                    )}

                    {/* Detection Overlay */}
                    {cameraStatus === 'active' && isCameraEnabled && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                            <p className="text-white text-xs font-medium text-center">
                                {modelsLoaded ? `🔒 F:${detectionStats.faceCount} | B:${detectionStats.bodyVisible ? '✓' : '✗'} | P:${detectionStats.poseDetected ? '✓' : '✗'}` : '⏳ Loading...'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="bg-[#F8FAFC] px-3 py-2 border-t border-[#E2E8F0]">
                    <p className="text-xs text-[#64748B] text-center font-medium">
                        {violations.length} violations
                    </p>
                </div>
            </div>

            {/* Violations Log - REMOVED */}
        </div>
    );
};

export default LiveCameraMonitor;
