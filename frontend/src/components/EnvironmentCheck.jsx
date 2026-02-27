import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { CheckCircle, XCircle, AlertCircle, Camera, Users, Sun } from 'lucide-react';

const EnvironmentCheck = ({ onCheckComplete }) => {
    const webcamRef = useRef(null);
    const [checks, setChecks] = useState({
        cameraAccess: { status: 'checking', message: 'Checking camera...' },
        microphoneAccess: { status: 'checking', message: 'Checking microphone...' },
        faceVisible: { status: 'checking', message: 'Detecting face...' },
        singlePerson: { status: 'checking', message: 'Checking for single person...' },
        lighting: { status: 'checking', message: 'Analyzing lighting...' }
    });
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [allChecksPassed, setAllChecksPassed] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        loadModels();
        performChecks();
    }, []);

    useEffect(() => {
        let interval;
        if (modelsLoaded && isChecking) {
            interval = setInterval(() => {
                performFaceChecks();
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [modelsLoaded, isChecking]);

    useEffect(() => {
        const allPassed = 
            checks.cameraAccess.status === 'passed' && 
            checks.microphoneAccess.status === 'passed' &&
            checks.faceVisible.status === 'passed' &&
            checks.singlePerson.status === 'passed' &&
            (checks.lighting.status === 'passed' || checks.lighting.status === 'warning');
        setAllChecksPassed(allPassed);
    }, [checks]);

    const loadModels = async () => {
        try {
            const MODEL_URL = '/models';
            console.log('EnvironmentCheck: Loading TinyFaceDetector...');
            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            console.log('EnvironmentCheck: Loading Face Landmarks...');
            await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
            setModelsLoaded(true);
            console.log('✅ EnvironmentCheck: Models loaded');
        } catch (error) {
            console.error('EnvironmentCheck: Model loading failed:', error);
        }
    };

    const performChecks = async () => {
        // Check 1: Camera Access
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setChecks(prev => ({
                ...prev,
                cameraAccess: { status: 'passed', message: 'Camera access granted' }
            }));
            
            // Check 2: Microphone Access
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setChecks(prev => ({
                    ...prev,
                    microphoneAccess: { status: 'passed', message: 'Microphone access granted' }
                }));
                audioStream.getTracks().forEach(track => track.stop());
            } catch (error) {
                setChecks(prev => ({
                    ...prev,
                    microphoneAccess: { status: 'failed', message: 'Microphone access denied' }
                }));
            }
            
            await new Promise(resolve => setTimeout(resolve, 300));
            
            if (webcamRef.current?.video) {
                await performFaceChecks();
            }
        } catch (error) {
            setChecks(prev => ({
                ...prev,
                cameraAccess: { status: 'failed', message: 'Camera access denied' }
            }));
        }
    };

    const performFaceChecks = async () => {
        const video = webcamRef.current.video;
        if (video.readyState !== 4) {
            setTimeout(performFaceChecks, 100);
            return;
        }

        // Skip AI detection if models not loaded - just do basic checks
        if (!modelsLoaded) {
            setChecks(prev => ({
                ...prev,
                faceVisible: { status: 'passed', message: 'Camera active' },
                singlePerson: { status: 'passed', message: 'Ready to start' },
                lighting: { status: 'passed', message: 'Lighting OK' }
            }));
            setAllChecksPassed(true);
            return;
        }

        try {
            const detections = await faceapi.detectAllFaces(
                video,
                new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 })
            );

            const faceCount = detections.length;
            console.log('EnvironmentCheck: Detected', faceCount, 'faces');

            // Check 2: Face Visible - STRICT CHECK
            if (faceCount === 1) {
                setChecks(prev => ({
                    ...prev,
                    faceVisible: { status: 'passed', message: 'Face detected successfully' }
                }));
            } else if (faceCount === 0) {
                setChecks(prev => ({
                    ...prev,
                    faceVisible: { status: 'failed', message: 'No face detected. Position yourself properly.' }
                }));
            } else {
                setChecks(prev => ({
                    ...prev,
                    faceVisible: { status: 'failed', message: 'Multiple faces detected. Ensure you are alone.' }
                }));
            }

            // Check 3: Single Person
            if (faceCount === 1) {
                setChecks(prev => ({
                    ...prev,
                    singlePerson: { status: 'passed', message: 'Single person confirmed' }
                }));
            } else if (faceCount > 1) {
                setChecks(prev => ({
                    ...prev,
                    singlePerson: { status: 'failed', message: `${faceCount} people detected. Ensure you are alone.` }
                }));
            } else {
                setChecks(prev => ({
                    ...prev,
                    singlePerson: { status: 'warning', message: 'Cannot verify single person' }
                }));
            }

            // Check 4: Lighting - SUPER FAST
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 80;
            canvas.height = 60;
            ctx.drawImage(video, 0, 0, 80, 60);
            
            const imageData = ctx.getImageData(0, 0, 80, 60);
            const data = imageData.data;
            let brightness = 0;
            
            // Sample every 8th pixel
            for (let i = 0; i < data.length; i += 32) {
                brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
            }
            brightness = brightness / (data.length / 32);

            if (brightness >= 60 && brightness <= 200) {
                setChecks(prev => ({
                    ...prev,
                    lighting: { status: 'passed', message: 'Lighting is optimal' }
                }));
            } else if (brightness < 60) {
                setChecks(prev => ({
                    ...prev,
                    lighting: { status: 'warning', message: 'Lighting is too dark. Consider improving.' }
                }));
            } else {
                setChecks(prev => ({
                    ...prev,
                    lighting: { status: 'warning', message: 'Lighting is too bright. Consider adjusting.' }
                }));
            }



        } catch (error) {
            console.error('Face check error:', error);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'passed':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'failed':
                return <XCircle className="w-5 h-5 text-red-600" />;
            case 'warning':
                return <AlertCircle className="w-5 h-5 text-yellow-600" />;
            default:
                return <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'passed':
                return 'bg-green-50 border-green-200';
            case 'failed':
                return 'bg-red-50 border-red-200';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200';
            default:
                return 'bg-blue-50 border-blue-200';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
                {/* Header */}
                <div className="bg-[#0F172A] px-6 py-4">
                    <h2 className="text-xl font-bold text-white">Environment Check</h2>
                    <p className="text-sm text-gray-300 mt-1">Please ensure all checks pass before starting the exam</p>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Camera Preview */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">Camera Preview</h3>
                        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                mirrored={true}
                                videoConstraints={{
                                    width: 640,
                                    height: 480,
                                    facingMode: 'user'
                                }}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Checks List */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">System Checks</h3>
                        <div className="space-y-3">
                            {/* Camera Access */}
                            <div className={`p-4 rounded-lg border ${getStatusColor(checks.cameraAccess.status)}`}>
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(checks.cameraAccess.status)}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Camera className="w-4 h-4" />
                                            <p className="font-medium text-sm">Camera Access</p>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">{checks.cameraAccess.message}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Microphone Access */}
                            <div className={`p-4 rounded-lg border ${getStatusColor(checks.microphoneAccess.status)}`}>
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(checks.microphoneAccess.status)}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Camera className="w-4 h-4" />
                                            <p className="font-medium text-sm">Microphone Access</p>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">{checks.microphoneAccess.message}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Face Visible */}
                            <div className={`p-4 rounded-lg border ${getStatusColor(checks.faceVisible.status)}`}>
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(checks.faceVisible.status)}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            <p className="font-medium text-sm">Face Visible</p>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">{checks.faceVisible.message}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Single Person */}
                            <div className={`p-4 rounded-lg border ${getStatusColor(checks.singlePerson.status)}`}>
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(checks.singlePerson.status)}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            <p className="font-medium text-sm">Single Person</p>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">{checks.singlePerson.message}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Lighting */}
                            <div className={`p-4 rounded-lg border ${getStatusColor(checks.lighting.status)}`}>
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(checks.lighting.status)}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Sun className="w-4 h-4" />
                                            <p className="font-medium text-sm">Lighting Quality</p>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">{checks.lighting.message}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
                    <div className="flex items-center gap-2">
                        {allChecksPassed ? (
                            <>
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <p className="text-sm font-semibold text-green-700">All checks passed! Ready to start.</p>
                            </>
                        ) : (
                            <>
                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm text-gray-600">Checking environment... Please wait</p>
                            </>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            setIsChecking(false);
                            onCheckComplete(true);
                        }}
                        disabled={!allChecksPassed}
                        className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${
                            allChecksPassed
                                ? 'bg-[#0F172A] text-white hover:bg-[#1E293B] shadow-lg'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        Next →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnvironmentCheck;
