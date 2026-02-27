import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { Search, Filter, X, AlertTriangle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const MetricCard = ({ label, value, colorClass }) => (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm flex-1 min-w-[200px]">
        <div className="text-[#0F172A] text-xs sm:text-sm font-medium mb-2">{label}</div>
        <div className={`text-3xl sm:text-[40px] font-medium ${colorClass || 'text-[#0F172A]'}`}>{value}</div>
    </div>
);

const Examiner_ViolationReports = () => {
    const [violations, setViolations] = useState([]);
    const [filteredViolations, setFilteredViolations] = useState([]);
    const [stats, setStats] = useState({ totalViolations: 0, highSeverity: 0 });
    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState([]);
    const [examStats, setExamStats] = useState([]);
    const [filters, setFilters] = useState({
        exam: '',
        search: ''
    });

    useEffect(() => {
        fetchViolations();
        fetchExams();
    }, []);

    useEffect(() => {
        applyFilters();
        calculateExamStats();
    }, [violations, filters]);

    const fetchViolations = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/violations/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setViolations(data.data.violations);
                setStats(data.data.stats);
            }
        } catch (error) {
            console.error('Error fetching violations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchExams = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/exams`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setExams(data.data);
            }
        } catch (error) {
            console.error('Error fetching exams:', error);
        }
    };

    const applyFilters = () => {
        const existingExamNames = exams.map(e => e.title);
        let filtered = violations.filter(v => existingExamNames.includes(v.exam));

        if (filters.exam) {
            filtered = filtered.filter(v => v.exam === filters.exam);
        }

        if (filters.search) {
            filtered = filtered.filter(v =>
                v.name.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        setFilteredViolations(filtered);

        // Recalculate stats based on filtered violations
        const totalViolations = filtered.length;
        const highSeverity = filtered.filter(v => v.severity === 'High').length;
        setStats({ totalViolations, highSeverity });
    };

    const calculateExamStats = () => {
        const existingExamNames = exams.map(e => e.title);
        const examMap = {};
        violations.filter(v => existingExamNames.includes(v.exam)).forEach(v => {
            if (!examMap[v.exam]) {
                examMap[v.exam] = { total: 0, high: 0, medium: 0, low: 0 };
            }
            examMap[v.exam].total++;
            if (v.severity === 'High') examMap[v.exam].high++;
            else if (v.severity === 'Medium') examMap[v.exam].medium++;
            else examMap[v.exam].low++;
        });

        const statsArray = Object.entries(examMap).map(([exam, data]) => ({
            exam,
            ...data
        }));
        setExamStats(statsArray);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({ exam: '', search: '' });
    };

    const hasActiveFilters = filters.exam || filters.search;

    return (
        <div className="p-10 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-[32px] font-semibold text-[#0F172A] tracking-tight">Violation Reports</h1>
                    <p className="text-[#64748B] text-[15px] mt-1">Monitor and review AI-detected violations across all exams</p>
                </div>

                {/* Violation Details Table */}
                <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h2 className="text-lg font-semibold text-[#0F172A]">All Violations</h2>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-colors"
                            >
                                <X size={14} />
                                Clear Filters
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-3 mb-6">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B]" size={16} />
                            <input
                                type="text"
                                placeholder="Search student..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-transparent"
                            />
                        </div>

                        <select
                            value={filters.exam}
                            onChange={(e) => handleFilterChange('exam', e.target.value)}
                            className="px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-transparent bg-white w-64"
                        >
                            <option value="">All Exams</option>
                            {exams.map(exam => (
                                <option key={exam._id} value={exam.title}>{exam.title}</option>
                            ))}
                        </select>
                    </div>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F172A]"></div>
                        </div>
                    ) : filteredViolations.length === 0 ? (
                        <div className="text-center py-12 text-[#64748B]">
                            {violations.length === 0 ? 'No violations recorded yet.' : 'No violations match the selected filters.'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-6 sm:mx-0 px-6 sm:px-0">
                            <table className="w-full min-w-[800px]">
                                <thead>
                                    <tr className="text-left text-[#0F172A] text-[13px] font-medium uppercase tracking-wider border-b border-[#F1F5F9]">
                                        <th className="pb-6">Student Name</th>
                                        <th className="pb-6">Exam</th>
                                        <th className="pb-6">Violation Type</th>
                                        <th className="pb-6">Timestamp</th>
                                        <th className="pb-6 text-right">Severity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F1F5F9]">
                                    {filteredViolations.map((v) => (
                                        <tr key={v.id} className="group hover:bg-[#F8FAFC]/50 transition-colors">
                                            <td className="py-5 font-medium whitespace-nowrap">
                                                <Link to={`/student-violations/${v.name}`} className="text-[#0F172A] hover:text-[#1E293B] hover:underline transition-colors">
                                                    {v.name}
                                                </Link>
                                            </td>
                                            <td className="py-5 text-[#0F172A]/70 font-medium whitespace-nowrap">{v.exam}</td>
                                            <td className="py-5 text-[#0F172A] font-medium italic whitespace-nowrap">"{v.type}"</td>
                                            <td className="py-5 text-[#0F172A]/70 font-medium text-sm whitespace-nowrap">{v.time}</td>
                                            <td className="py-5 text-right whitespace-nowrap">
                                                <span className={`px-4 py-1.5 rounded-full text-[11px] sm:text-[12px] font-bold ${v.severity === 'High' ? 'bg-[#FEF2F2] text-[#EF4444]' :
                                                        v.severity === 'Medium' ? 'bg-[#FFFBEB] text-[#D97706]' :
                                                            'bg-[#EFF6FF] text-[#3B82F6]'
                                                    }`}>
                                                    {v.severity}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[#64748B] text-sm font-medium mb-1">Total Violations</p>
                                <p className="text-4xl font-bold text-[#0F172A]">{stats.totalViolations}</p>
                            </div>
                            <div className="w-14 h-14 bg-[#F1F5F9] rounded-full flex items-center justify-center">
                                <AlertTriangle className="text-[#0F172A]" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[#64748B] text-sm font-medium mb-1">High Severity</p>
                                <p className="text-4xl font-bold text-[#EF4444]">{stats.highSeverity}</p>
                            </div>
                            <div className="w-14 h-14 bg-[#FEF2F2] rounded-full flex items-center justify-center">
                                <AlertTriangle className="text-[#EF4444]" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Exam-wise Statistics */}
                {examStats.length > 0 && (
                    <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm mb-8">
                        <h2 className="text-lg font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                            <FileText size={20} />
                            Violations by Exam
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {examStats.map((stat, idx) => (
                                <div key={idx} className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                                    <h3 className="font-semibold text-[#0F172A] mb-3 truncate" title={stat.exam}>{stat.exam}</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-[#64748B]">Total</span>
                                            <span className="font-bold text-[#0F172A]">{stat.total}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-[#64748B]">High</span>
                                            <span className="font-semibold text-[#EF4444]">{stat.high}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-[#64748B]">Medium</span>
                                            <span className="font-semibold text-[#F59E0B]">{stat.medium}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-[#64748B]">Low</span>
                                            <span className="font-semibold text-[#3B82F6]">{stat.low}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Examiner_ViolationReports;
