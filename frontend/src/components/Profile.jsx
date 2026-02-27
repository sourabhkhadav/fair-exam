import React, { useState, useEffect } from 'react';
import {
    User, Mail, Shield, KeyRound,
    Save, Camera, BadgeCheck,
    Eye, EyeOff, Lock, CheckCircle, AlertCircle
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const ProfileCard = ({ title, icon: Icon, children }) => (
    <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <Icon className="w-5 h-5 text-[#0F172A]" />
            </div>
            <h2 className="text-lg sm:text-xl font-medium text-[#0F172A] tracking-tight">{title}</h2>
        </div>
        <div className="relative z-10 space-y-6">
            {children}
        </div>
    </div>
);

const InputField = ({ label, icon: Icon, type = "text", placeholder, value, onChange, disabled = false }) => (
    <div className="space-y-2">
        <label className="text-[13px] font-semibold text-[#64748B] ml-1 uppercase tracking-wider">{label}</label>
        <div className="relative group/field">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within/field:text-[#0F172A] transition-colors">
                <Icon className="w-4.5 h-4.5" />
            </div>
            <input
                type={type}
                className={`w-full pl-11 pr-5 py-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] focus:bg-white focus:border-[#0F172A]/40 transition-all outline-none text-[#0F172A] font-medium ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
            />
        </div>
    </div>
);

const Profile = () => {
    const [personalInfo, setPersonalInfo] = useState({
        name: '',
        email: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch profile');

            const data = await response.json();
            setPersonalInfo({
                name: data.name,
                email: data.email
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleInfoChange = (field, value) => {
        setPersonalInfo(prev => ({ ...prev, [field]: value }));
    };

    const handlePasswordChange = (field, value) => {
        setPasswordData(prev => ({ ...prev, [field]: value }));
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: personalInfo.name })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to update profile');

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            
            const user = JSON.parse(localStorage.getItem('user'));
            localStorage.setItem('user', JSON.stringify({ ...user, name: data.name }));

            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        setPasswordLoading(true);
        setPasswordMessage({ type: '', text: '' });

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
            setPasswordLoading(false);
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            setPasswordLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/users/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to update password');

            setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

            setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setPasswordMessage({ type: 'error', text: error.message });
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-medium text-[#0F172A] tracking-tight">Profile Settings</h1>
                    <p className="text-[#64748B] text-[15px] font-medium mt-1">Manage your account details and security preferences.</p>
                </div>
                <button 
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-[#0F172A] text-white rounded-xl font-medium hover:bg-[#1E293B] transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="w-5 h-5" />
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {message.text && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-medium">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-8">
                    <ProfileCard title="Account Information" icon={User}>
                        <div className="flex flex-col sm:flex-row items-center gap-6 mb-4">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-3xl bg-slate-50 border-2 border-[#0F172A]/10 flex items-center justify-center text-[#0F172A] overflow-hidden">
                                    <User className="w-12 h-12" />
                                </div>
                            </div>
                            <div className="text-center sm:text-left">
                                <h3 className="text-lg font-bold text-[#0F172A]">{personalInfo.name}</h3>
                                <p className="text-[#64748B] text-sm font-medium">{personalInfo.email}</p>
                                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#059669] text-xs font-bold border border-[#D1FAE5]">
                                    <BadgeCheck className="w-3.5 h-3.5" />
                                    Verified Examiner
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <InputField
                                label="Full Name"
                                icon={User}
                                value={personalInfo.name}
                                onChange={(e) => handleInfoChange('name', e.target.value)}
                            />
                            <InputField
                                label="Email Address"
                                icon={Mail}
                                type="email"
                                value={personalInfo.email}
                                disabled={true}
                            />
                        </div>
                    </ProfileCard>
                </div>

                <div className="lg:col-span-5 space-y-8">
                    <ProfileCard title="Security & Password" icon={Shield}>
                        <div className="space-y-6">
                            <div className="p-4 rounded-2xl bg-[#FFF7ED] border border-[#FFEDD5] flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white border border-[#FFEDD5] flex items-center justify-center shrink-0">
                                    <KeyRound className="w-5 h-5 text-[#F97316]" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#9A3412]">Change Password</h4>
                                    <p className="text-xs text-[#C2410C]/80 mt-1 font-medium leading-relaxed">Ensure a strong password (min. 6 chars).</p>
                                </div>
                            </div>

                            {passwordMessage.text && (
                                <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${passwordMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                                    {passwordMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    <span className="font-medium">{passwordMessage.text}</span>
                                </div>
                            )}

                            <div className="space-y-5">
                                <div className="relative">
                                    <InputField
                                        label="Current Password"
                                        icon={Lock}
                                        type={showPasswords.current ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('current')}
                                        className="absolute right-4 top-[42px] text-[#94A3B8] hover:text-[#64748B]"
                                    >
                                        {showPasswords.current ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                                    </button>
                                </div>

                                <div className="relative">
                                    <InputField
                                        label="New Password"
                                        icon={Lock}
                                        type={showPasswords.new ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={passwordData.newPassword}
                                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('new')}
                                        className="absolute right-4 top-[42px] text-[#94A3B8] hover:text-[#64748B]"
                                    >
                                        {showPasswords.new ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                                    </button>
                                </div>

                                <div className="relative">
                                    <InputField
                                        label="Confirm New Password"
                                        icon={Lock}
                                        type={showPasswords.confirm ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('confirm')}
                                        className="absolute right-4 top-[42px] text-[#94A3B8] hover:text-[#64748B]"
                                    >
                                        {showPasswords.confirm ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                                    </button>
                                </div>
                            </div>

                            <button 
                                onClick={handleUpdatePassword}
                                disabled={passwordLoading}
                                className="w-full py-3.5 bg-[#F1F5F9] text-[#475569] font-bold rounded-xl hover:bg-[#E2E8F0] hover:text-[#0F172A] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {passwordLoading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </ProfileCard>
                </div>
            </div>
        </div>
    );
};

export default Profile;
