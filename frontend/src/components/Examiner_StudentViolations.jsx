import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import {
    PlusCircle, ArrowLeft, AlertCircle, Calendar, Clock,
    Monitor, Shield, Eye, FileText, BarChart3, ChevronRight,
    Search, Filter, Info, Camera, Volume2, Maximize, MousePointer
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const MetricCard = ({ label, value, colorClass, icon: Icon }) => (
    <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex-1 min-w-[200px] group hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-3">
            <div className="text-[#64748B] text-xs font-bold uppercase tracking-widest">{label}</div>
            <div className={`p-2 rounded-xl ${colorClass.replace('text', 'bg').replace('-', '-50 text-')}`}>
                <Icon className={`w-4 h-4 ${colorClass}`} />
            </div>
        </div>
        <div className={`text-3xl font-bold ${colorClass}`}>{value}</div>
    </div>
);

const Examiner_StudentViolations = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [selectedScreenshot, setSelectedScreenshot] = useState(null);
    const [studentData, setStudentData] = useState({
        name: "",
        violations: []
    });

    useEffect(() => {
        fetchStudentViolations();
    }, [id]);

    const fetchStudentViolations = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/violations/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                const filtered = data.data.violations.filter(v => v.name === decodeURIComponent(id));

                if (filtered.length > 0) {
                    setStudentData({
                        name: filtered[0].name,
                        violations: filtered.map(v => ({
                            id: v.id,
                            name: v.name,
                            exam: v.exam,
                            type: v.type,
                            time: v.time,
                            severity: v.severity,
                            faceDetection: v.violationCount?.faceDetection || 0,
                            soundDetection: v.violationCount?.soundDetection || 0,
                            fullscreenExit: v.violationCount?.fullscreenExit || 0,
                            tabSwitch: v.violationCount?.tabSwitch || 0,
                            screenshotUrl: v.screenshotUrl
                        }))
                    });
                } else {
                    setStudentData({
                        name: decodeURIComponent(id),
                        violations: []
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching student violations:', error);
            setStudentData({
                name: decodeURIComponent(id),
                violations: []
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Monitor className="w-6 h-6 text-[#0F172A] animate-spin" />
                    </div>
                    <span className="text-[#64748B] font-medium tracking-wide">Loading Student Record...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-10 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/violation-reports')}
                            className="w-11 h-11 flex items-center justify-center bg-white border border-[#E2E8F0] rounded-xl shadow-sm hover:shadow-md hover:-translate-x-0.5 transition-all text-[#64748B] hover:text-[#0F172A] group"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">{studentData.name} - Violation History</h1>
                            <p className="text-[#64748B] text-[15px] font-medium mt-1">Found {studentData.violations.length} total security violations </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 sm:gap-6 mb-10">
                    <MetricCard label="Total Flags" value={studentData.violations.length} colorClass="text-[#0F172A]" icon={AlertCircle} />
                    <MetricCard label="High Severity" value={studentData.violations.filter(v => v.severity === 'High').length} colorClass="text-[#EF4444]" icon={Shield} />
                    <MetricCard label="Recent Violation" value={studentData.violations.length > 0 ? "Today" : "None"} colorClass="text-[#D97706]" icon={Clock} />
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-[#0F172A]">Detailed Log</h2>
                    {studentData.violations.length > 0 ? (
                        studentData.violations.map((v, idx) => (
                            <div key={v.id} className="bg-white rounded-3xl border border-[#E2E8F0] shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${v.severity === 'High' ? 'bg-red-500 text-white' :
                                                    v.severity === 'Medium' ? 'bg-amber-500 text-white' :
                                                        'bg-blue-500 text-white'
                                                }`}>
                                                {v.severity} Severity
                                            </span>
                                            <span className="text-xs font-semibold text-[#64748B]">{v.time}</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                console.log('Violation data:', v);
                                                console.log('Screenshot URL:', v.screenshotUrl);
                                                if (v.screenshotUrl) {
                                                    setSelectedScreenshot(v.screenshotUrl);
                                                } else {
                                                    setSelectedScreenshot('placeholder');
                                                    toast.error('No screenshot available for this violation', {
                                                        duration: 2000
                                                    });
                                                }
                                            }}
                                            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                                        >
                                            <Eye className="w-3 h-3" />
                                            View Clip
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-sm transition-all">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="p-1.5 bg-slate-100 rounded">
                                                    <Camera className="w-3.5 h-3.5 text-slate-600" />
                                                </div>
                                                <span className="text-xs font-semibold text-slate-700 uppercase">Face</span>
                                            </div>
                                            <div className="text-2xl font-bold text-slate-900">{v.faceDetection}</div>
                                            <div className="text-xs text-slate-500">times violated</div>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-sm transition-all">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="p-1.5 bg-slate-100 rounded">
                                                    <Volume2 className="w-3.5 h-3.5 text-slate-600" />
                                                </div>
                                                <span className="text-xs font-semibold text-slate-700 uppercase">Sound</span>
                                            </div>
                                            <div className="text-2xl font-bold text-slate-900">{v.soundDetection}</div>
                                            <div className="text-xs text-slate-500">times violated</div>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-sm transition-all">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="p-1.5 bg-slate-100 rounded">
                                                    <Maximize className="w-3.5 h-3.5 text-slate-600" />
                                                </div>
                                                <span className="text-xs font-semibold text-slate-700 uppercase">Fullscreen</span>
                                            </div>
                                            <div className="text-2xl font-bold text-slate-900">{v.fullscreenExit}</div>
                                            <div className="text-xs text-slate-500">times violated</div>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-sm transition-all">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="p-1.5 bg-slate-100 rounded">
                                                    <MousePointer className="w-3.5 h-3.5 text-slate-600" />
                                                </div>
                                                <span className="text-xs font-semibold text-slate-700 uppercase">Tab Switch</span>
                                            </div>
                                            <div className="text-2xl font-bold text-slate-900">{v.tabSwitch}</div>
                                            <div className="text-xs text-slate-500">times violated</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white p-20 rounded-[32px] border-2 border-dashed border-[#E2E8F0] flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-[#F0FDF4] rounded-2xl flex items-center justify-center mb-6">
                                <FileText className="w-8 h-8 text-[#22C55E]" />
                            </div>
                            <h3 className="text-xl font-bold text-[#0F172A]">Clean Record</h3>
                            <p className="text-[#64748B] font-medium mt-2 max-w-sm">No violations found for this student. They have maintained full academic integrity during their exams.</p>
                        </div>
                    )}
                </div>

                {selectedScreenshot && (
                    <div
                        className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setSelectedScreenshot(null)}
                    >
                        <div className="relative max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                        <Camera className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">Violation Screenshot</h3>
                                        <p className="text-slate-300 text-xs">Captured during exam session</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedScreenshot(null)}
                                    className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all group"
                                >
                                    <span className="text-white text-2xl group-hover:rotate-90 transition-transform">&times;</span>
                                </button>
                            </div>
                            <div className="p-6 bg-slate-50">
                                {selectedScreenshot && selectedScreenshot !== 'placeholder' ? (
                                    <img
                                        src={selectedScreenshot}
                                        alt="Violation screenshot"
                                        className="w-full h-auto rounded-2xl shadow-lg border-4 border-white max-h-[70vh] object-contain"
                                        onError={(e) => {
                                            console.error('Image failed to load:', selectedScreenshot);
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div className="w-full h-96 bg-slate-200 rounded-2xl items-center justify-center" style={{ display: selectedScreenshot === 'placeholder' ? 'flex' : 'none' }}>
                                    <div className="text-center">
                                        <Camera className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                                        <p className="text-slate-600 font-semibold text-lg">No screenshot available</p>
                                        <p className="text-slate-500 text-sm mt-2">Screenshot was not captured for this violation</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Examiner_StudentViolations;
