import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft, AlertTriangle, Key, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const AuthForm = ({ initialMode = 'login' }) => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(initialMode === 'login');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotStep, setForgotStep] = useState(1);
    const [forgotEmail, setForgotEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
//just a comment to test commit
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setShowPassword(false);
        setShowConfirmPassword(false);
        setError('');
        setSuccess('');
        setShowForgotPassword(false);
        setForgotStep(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!isLogin && formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        const url = `${API_BASE_URL}${endpoint}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(isLogin ?
                    { email: formData.email, password: formData.password } :
                    {
                        name: formData.name,
                        email: formData.email,
                        password: formData.password,
                        role: 'examiner'
                    }
                )
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            // Success
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({
                _id: data._id,
                name: data.name,
                email: data.email,
                role: data.role || 'examiner'
            }));

            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };



    const handleBackClick = () => {
        navigate('/');
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send OTP');
            }

            setSuccess('OTP sent to your email');
            setForgotStep(2);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail, otp, newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to reset password');
            }

            setSuccess('Password reset successful!');
            setTimeout(() => {
                setShowForgotPassword(false);
                setForgotStep(1);
                setForgotEmail('');
                setOtp('');
                setNewPassword('');
                setError('');
                setSuccess('');
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-charcoal flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Back Button */}
            <button
                onClick={handleBackClick}
                className="fixed top-8 left-8 p-4 rounded-2xl bg-white border border-black/5 shadow-xl shadow-slate-100/50 flex items-center justify-center group cursor-pointer z-50 transition-all hover:bg-slate-50 active:scale-95"
            >
                <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-charcoal transition-colors" />
            </button>

            {/* Cinematic Background (Consistent with Landing Page) */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[800px] h-[400px] bg-radial from-indigo-50/60 via-transparent to-transparent blur-[100px] opacity-80" />
                <div className="absolute bottom-0 right-1/4 translate-x-1/2 w-[800px] h-[400px] bg-radial from-blue-50/40 via-transparent to-transparent blur-[100px] opacity-60" />
            </div>

            <div className="w-full max-w-[480px] z-10">
                {/* Logo & Header */}
                <div className="flex flex-col items-center mb-10 space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-black/5 shadow-xl shadow-slate-100/50 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-charcoal" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-charcoal">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h1>
                        <p className="text-slate-500 font-bold mt-2">
                            {isLogin
                                ? 'Secure access to your examination portal'
                                : 'Join 2,000+ institutions worldwide'}
                        </p>
                    </div>
                </div>

                {/* Auth Card */}
                <div className="rounded-[40px] p-10 bg-white border border-black/5 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                    {showForgotPassword && isLogin ? (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-charcoal">Reset Password</h2>
                                <p className="text-slate-500 text-sm mt-2">
                                    {forgotStep === 1 ? 'Enter your email to receive OTP' : 'Enter OTP and new password'}
                                </p>
                            </div>

                            {forgotStep === 1 ? (
                                <form onSubmit={handleForgotPassword} className="space-y-6">
                                    {error && (
                                        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-3">
                                            <AlertTriangle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}
                                    {success && (
                                        <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm font-bold flex items-center gap-3">
                                            <CheckCircle className="w-4 h-4" />
                                            {success}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Email Address</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                value={forgotEmail}
                                                onChange={(e) => setForgotEmail(e.target.value)}
                                                placeholder="your@email.com"
                                                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border border-transparent hover:bg-slate-100 focus:bg-white focus:border-charcoal/20 transition-all duration-300 outline-none font-bold text-charcoal"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 rounded-2xl bg-charcoal text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl disabled:opacity-70 transition-all hover:bg-slate-800"
                                    >
                                        {loading ? 'Sending...' : 'Send OTP'}
                                        {!loading && <ArrowRight className="w-4 h-4" />}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleResetPassword} className="space-y-6">
                                    {error && (
                                        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-3">
                                            <AlertTriangle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}
                                    {success && (
                                        <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm font-bold flex items-center gap-3">
                                            <CheckCircle className="w-4 h-4" />
                                            {success}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">OTP Code</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400">
                                                <Key className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                maxLength="6"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                placeholder="Enter 6-digit OTP"
                                                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border border-transparent hover:bg-slate-100 focus:bg-white focus:border-charcoal/20 transition-all duration-300 outline-none font-bold text-charcoal"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">New Password</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400">
                                                <Lock className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="password"
                                                required
                                                minLength="6"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border border-transparent hover:bg-slate-100 focus:bg-white focus:border-charcoal/20 transition-all duration-300 outline-none font-bold text-charcoal"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 rounded-2xl bg-charcoal text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl disabled:opacity-70 transition-all hover:bg-slate-800"
                                    >
                                        {loading ? 'Resetting...' : 'Reset Password'}
                                        {!loading && <ArrowRight className="w-4 h-4" />}
                                    </button>
                                </form>
                            )}

                            <button
                                onClick={() => {
                                    setShowForgotPassword(false);
                                    setForgotStep(1);
                                    setError('');
                                    setSuccess('');
                                }}
                                className="w-full text-center text-sm text-slate-600 hover:text-charcoal font-bold"
                            >
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm font-bold flex items-center gap-3">
                                    <CheckCircle className="w-4 h-4" />
                                    {success}
                                </div>
                            )}

                            {!isLogin && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Full Name</label>
                                    <div className="relative group overflow-hidden">
                                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-charcoal transition-colors duration-300">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="John Doe"
                                            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border border-transparent hover:bg-slate-100 focus:bg-white focus:border-charcoal/20 transition-all duration-300 outline-none font-bold text-charcoal placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Work Email</label>
                                <div className="relative group overflow-hidden">
                                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-charcoal transition-colors duration-300">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="name@institution.edu"
                                        className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border border-transparent hover:bg-slate-100 focus:bg-white focus:border-charcoal/20 transition-all duration-300 outline-none font-bold text-charcoal placeholder:text-slate-300"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Password</label>
                                    {isLogin && <button type="button" onClick={() => setShowForgotPassword(true)} className="text-[10px] font-black uppercase tracking-[0.2em] text-charcoal hover:underline">Forgot?</button>}
                                </div>
                                <div className="relative group overflow-hidden">
                                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-charcoal transition-colors duration-300">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full pl-14 pr-14 py-4 rounded-2xl bg-slate-50 border border-transparent hover:bg-slate-100 focus:bg-white focus:border-charcoal/20 transition-all duration-300 outline-none font-bold text-charcoal placeholder:text-slate-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-5 flex items-center text-slate-300 hover:text-charcoal transition-colors duration-300"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>


                            {!isLogin && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Confirm Password</label>
                                    <div className="relative group overflow-hidden">
                                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-purple transition-colors duration-300">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            required
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            className="w-full pl-14 pr-14 py-4 rounded-2xl bg-slate-50 border border-transparent hover:bg-slate-100 focus:bg-white focus:border-brand-purple/20 transition-all duration-300 outline-none font-bold text-charcoal placeholder:text-slate-300"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-5 flex items-center text-slate-300 hover:text-brand-purple transition-colors duration-300"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-2xl bg-charcoal text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-slate-100 cursor-pointer disabled:opacity-70 disabled:cursor-wait transition-all hover:bg-slate-800"
                            >
                                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                                {!loading && <ArrowRight className="w-4 h-4" />}
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer Link */}
                <p className="text-center mt-10 font-bold text-slate-500">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button
                        onClick={toggleMode}
                        className="text-charcoal uppercase tracking-wider text-sm font-bold ml-2 hover:underline"
                    >
                        {isLogin ? 'Get Started' : 'Sign In'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthForm;
