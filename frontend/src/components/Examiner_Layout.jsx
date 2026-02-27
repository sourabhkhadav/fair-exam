import React, { useState } from 'react';
import {
    LayoutDashboard, PlusCircle, BookOpen, AlertCircle,
    FileCheck, BarChart3, UserCircle, Menu, ChevronLeft,
    LogOut, Settings, Bell, Search
} from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

const SidebarItem = ({ icon: Icon, label, active = false, to, collapsed = false, onClick }) => {
    const content = (
        <>
            <Icon className={`w-5 h-5 ${active ? 'text-[#0F172A]' : 'text-[#64748B]'}`} />
            <span className={`font-medium text-[15px] whitespace-nowrap ${collapsed ? 'hidden' : 'block'}`}>{label}</span>
            {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-[#1E293B] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                    {label}
                </div>
            )}
        </>
    );

    const classes = `flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 group w-full text-left ${active
        ? 'bg-[#F1F5F9] text-[#0F172A]'
        : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
        }`;

    if (to) {
        return (
            <Link to={to} onClick={onClick} className={classes}>
                {content}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={classes}>
            {content}
        </button>
    );
};

const Examiner_Layout = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    React.useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (!token || !user) {
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    const menuItems = [
        { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
        { icon: PlusCircle, label: "Create Exam", to: "/create-exam" },
        { icon: BookOpen, label: "Manage Exams", to: "/manage-exams" },
        { icon: AlertCircle, label: "Violation Reports", to: "/violation-reports" },
        { icon: FileCheck, label: "Results & Publishing", to: "/results-publishing" },
    ];

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('examDraft');
        navigate('/');
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
            {/* Mobile Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar toggle for mobile when header is removed */}
            <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="fixed top-4 left-4 p-2.5 bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] rounded-xl shadow-sm z-30 lg:hidden transition-all active:scale-95"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Sidebar */}
            <aside
                className={`bg-white border-r border-[#E2E8F0] flex flex-col fixed h-full z-50 transition-all duration-300 ease-in-out 
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
            >
                <div className="flex items-center justify-between h-20 px-6 border-b border-[#F1F5F9]">
                    <div className={`flex flex-col animate-in fade-in duration-300 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                        <div className="text-2xl font-bold text-[#0F172A] tracking-tight">FairExam</div>
                        <div className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Examiner Portal</div>
                    </div>
                    {isCollapsed && (
                        <div className="text-xl font-bold text-[#0F172A] mx-auto hidden lg:block">FE</div>
                    )}
                    <button
                        onClick={closeMobileMenu}
                        className="p-2 -mr-2 text-[#64748B] hover:bg-[#F8FAFC] rounded-lg lg:hidden"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item, index) => (
                        <SidebarItem
                            key={index}
                            icon={item.icon}
                            label={item.label}
                            to={item.to}
                            active={location.pathname === item.to}
                            collapsed={isCollapsed}
                            onClick={() => {
                                if (item.label === "Create Exam") {
                                    localStorage.removeItem('examDraft');
                                }
                                closeMobileMenu();
                            }}
                        />
                    ))}
                </div>

                <div className="p-4 border-t border-[#F1F5F9] space-y-1.5 pt-6">
                    <SidebarItem
                        icon={UserCircle}
                        label="Profile"
                        to="/profile"
                        active={location.pathname === '/profile'}
                        collapsed={isCollapsed}
                        onClick={closeMobileMenu}
                    />
                    <SidebarItem
                        icon={LogOut}
                        label="Logout"
                        collapsed={isCollapsed}
                        onClick={handleLogout}
                    />
                </div>

                {/* Industry-Level Floating Toggle */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`hidden lg:flex absolute -right-4 top-24 w-8 h-8 bg-white border border-[#E2E8F0] rounded-full items-center justify-center shadow-sm hover:shadow-md hover:border-[#0F172A]/30 transition-all duration-300 z-[60] cursor-pointer group/toggle ${isCollapsed ? 'rotate-180' : ''}`}
                >
                    <ChevronLeft className="w-4 h-4 text-[#64748B] group-hover/toggle:text-[#0F172A] transition-colors" />
                </button>
            </aside>

            {/* Main Content Area */}
            <main
                className={`flex-1 transition-all duration-300 ease-in-out min-w-0
                    ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} ml-0`}
            >
                {/* Content Container */}
                <div className="p-4 sm:p-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Examiner_Layout;
