import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, User, AlertCircle, ShieldCheck, HelpCircle } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const Login = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        candidateId: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const candidateId = searchParams.get('candidateId');
        if (candidateId) setFormData(prev => ({ ...prev, candidateId }));
    }, [searchParams]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/candidate-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    candidateId: formData.candidateId,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    setError(data.message);
                    setTimeout(() => {
                        navigate('/');
                    }, 3000);
                    return;
                }
                throw new Error(data.message || 'Authentication failed');
            }

            // Success
            localStorage.setItem('token', data.token);
            localStorage.setItem('candidate', JSON.stringify(data.candidate));
            localStorage.setItem('candidateId', data.candidate.candidateId);
            localStorage.setItem('examData', JSON.stringify(data.exam));

            navigate('/instructions', { state: { name: data.candidate.name } });
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <div className="min-h-screen flex bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Left Side: Corporate Branding */}
            <div className="hidden lg:flex w-5/12 bg-[#0f172a] flex-col justify-between p-12 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-white/90 mb-12">
                        <div className="p-1.5 bg-blue-600 rounded-sm">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold tracking-tight text-lg">FairExam Secure Browser</span>
                    </div>

                    <h1 className="text-4xl font-bold text-white leading-tight mb-6">
                        Reliable Proctoring for <br />
                        <span className="text-blue-400">High-Stakes Assessments</span>
                    </h1>
                    <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
                        Our platform ensures integrity through advanced AI monitoring and secure browser environments.
                    </p>
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="flex gap-4">
                        <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-lg">
                            <div className="text-blue-400 font-bold text-xl mb-1">10M+</div>
                            <div className="text-slate-400 text-sm">Exams Conducted</div>
                        </div>
                        <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-lg">
                            <div className="text-blue-400 font-bold text-xl mb-1">24/7</div>
                            <div className="text-slate-400 text-sm">Support Available</div>
                        </div>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                        © 2026 FairExam Inc. All rights reserved.
                    </div>
                </div>

                {/* Subtle background pattern */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
                <div className="absolute top-20 right-[-100px] w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 relative">
                <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm border border-slate-200">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Candidate Login</h2>
                        <p className="text-slate-500 text-sm">Enter your credentials to access the examination portal.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                                    Candidate ID
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 sm:text-sm transition-all"
                                        placeholder="e.g. CAND67a10001"
                                        value={formData.candidateId}
                                        onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                                    Access Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 sm:text-sm transition-all"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-start gap-3 p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all
                                        ${!isLoading
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'bg-slate-400 cursor-not-allowed'}`}
                        >
                            {isLoading ? 'Authenticating...' : 'Start Exam'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <a href="#" className="text-xs text-slate-500 hover:text-blue-600 flex items-center justify-center gap-1">
                            <HelpCircle className="w-3 h-3" /> Technical Support
                        </a>
                    </div>
                </div>

                {/* Mobile Footer */}
                <div className="mt-8 lg:hidden text-center text-xs text-slate-400">
                    © 2026 FairExam Inc.
                </div>
            </div>
        </div>
    );
};

export default Login;
