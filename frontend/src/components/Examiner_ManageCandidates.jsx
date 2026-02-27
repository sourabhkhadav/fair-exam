import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Save, X, PlusCircle, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const Examiner_ManageCandidates = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Exam ID
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', mobileNumber: '' });
    const [showManualAddModal, setShowManualAddModal] = useState(false);
    const [isAddingCandidate, setIsAddingCandidate] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [manualCandidate, setManualCandidate] = useState({
        name: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        fetchCandidates();
    }, [id]);

    const fetchCandidates = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/candidates/exam/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setCandidates(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch candidates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleManualAdd = async () => {
        if (!manualCandidate.name || !manualCandidate.email || !manualCandidate.phone) {
            toast.error('Please fill all fields');
            return;
        }
        setIsAddingCandidate(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/candidates/manual`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...manualCandidate,
                    examId: id
                })
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Candidate added successfully');
                setShowManualAddModal(false);
                setManualCandidate({ name: '', email: '', phone: '' });
                fetchCandidates(); // Refresh the list
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to add candidate');
        } finally {
            setIsAddingCandidate(false);
        }
    };

    const handleDelete = async (candidateId) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontWeight: 500 }}>Are you sure you want to delete this candidate?</span>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        style={{ padding: '6px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#fff', color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
                    >Cancel</button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                const token = localStorage.getItem('token');
                                const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                const data = await response.json();
                                if (data.success) {
                                    setCandidates(candidates.filter(c => c._id !== candidateId));
                                    toast.success('Candidate deleted successfully');
                                } else {
                                    toast.error(data.message);
                                }
                            } catch (error) {
                                console.error('Delete error:', error);
                                toast.error('Failed to delete candidate');
                            }
                        }}
                        style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: '#EF4444', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                    >Delete</button>
                </div>
            </div>
        ), { duration: Infinity, style: { maxWidth: '400px', background: '#fff', color: '#0F172A' } });
    };

    const startEdit = (candidate) => {
        setEditingId(candidate._id);
        setEditForm({
            name: candidate.name,
            email: candidate.email || '',
            mobileNumber: candidate.mobileNumber || ''
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({ name: '', email: '', mobileNumber: '' });
    };

    const handleUpdate = async (candidateId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });
            const data = await response.json();
            if (data.success) {
                setCandidates(candidates.map(c => c._id === candidateId ? data.data : c));
                setEditingId(null);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to update candidate');
        }
    };

    const handleExcelUpload = async (file) => {
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('examId', id);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/candidates/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`${data.message}`);
                if (data.warnings && data.warnings.length > 0) {
                    toast(`⚠️ ${data.warnings.length} rows were skipped`, { icon: '⚠️', duration: 5000 });
                }
                fetchCandidates();
            } else {
                toast.error(data.message || 'Wrong Format! Please use correct Excel format with columns: name, mobileNumber, email');
            }
        } catch (error) {
            toast.error(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading candidates...</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(`/configure-exam/${id}`)}
                    className="p-2 border border-[#E2E8F0] rounded-lg"
                >
                    <ArrowLeft className="w-5 h-5 text-[#64748B]" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-semibold text-[#0F172A]">Manage Candidates</h1>
                </div>
                <button
                    onClick={() => setShowManualAddModal(true)}
                    className="px-4 py-2 bg-[#0F172A] text-white rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-[#1E293B] transition-all"
                >
                    <PlusCircle className="w-4 h-4" />
                    Add Candidate
                </button>
            </div>

            {/* Excel Upload & Download Sample Row */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) handleExcelUpload(file);
                            e.target.value = '';
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={isUploading}
                    />
                    <button className={`w-full py-3 bg-white border border-[#E2E8F0] border-dashed rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all text-sm font-medium ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                        {isUploading ? (
                            <svg className="animate-spin w-4 h-4 text-[#64748B]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <Upload className="w-4 h-4 text-[#64748B]" />
                        )}
                        <span className="text-[#0F172A]">{isUploading ? 'Uploading...' : 'Upload Excel / CSV'}</span>
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {candidates.length === 0 ? (
                    <div className="p-8 border border-dashed rounded-xl text-center text-[#64748B]">
                        No candidates found for this exam.
                    </div>
                ) : (
                    candidates.map((candidate) => (
                        <div key={candidate._id} className="p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-sm">
                            {editingId === candidate._id ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <input
                                        type="text"
                                        className="px-3 py-2 border rounded-md text-sm"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        placeholder="Name"
                                    />
                                    <input
                                        type="email"
                                        className="px-3 py-2 border rounded-md text-sm"
                                        value={editForm.email}
                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                        placeholder="Email"
                                    />
                                    <input
                                        type="text"
                                        className="px-3 py-2 border rounded-md text-sm"
                                        value={editForm.mobileNumber}
                                        onChange={e => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                                        placeholder="Mobile Number"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleUpdate(candidate._id)}
                                            className="px-3 py-1.5 bg-[#0F172A] text-white rounded-md text-xs flex items-center gap-1"
                                        >
                                            <Save className="w-3 h-3" /> Save
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="px-3 py-1.5 border rounded-md text-xs flex items-center gap-1"
                                        >
                                            <X className="w-3 h-3" /> Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="space-y-1">
                                        <p className="font-medium text-[#0F172A]">{candidate.name}</p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#64748B]">
                                            <span>{candidate.email || 'No email'}</span>
                                            <span>{candidate.mobileNumber}</span>
                                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-mono uppercase">{candidate.candidateId}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => startEdit(candidate)}
                                            className="p-2 text-[#64748B] hover:text-[#0F172A]"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(candidate._id)}
                                            className="p-2 text-rose-500 hover:text-rose-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Manual Add Candidate Modal */}
            {showManualAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                <PlusCircle className="w-5 h-5 text-[#0F172A]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-[#0F172A]">Add Candidate Manually</h2>
                                <p className="text-xs text-[#64748B]">Enter details to add a new candidate</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider ml-1 block mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter full name"
                                    className="w-full px-4 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] outline-none focus:border-[#0F172A] transition-colors text-sm"
                                    value={manualCandidate.name}
                                    onChange={e => setManualCandidate({ ...manualCandidate, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider ml-1 block mb-1.5">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="candidate@example.com"
                                    className="w-full px-4 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] outline-none focus:border-[#0F172A] transition-colors text-sm"
                                    value={manualCandidate.email}
                                    onChange={e => setManualCandidate({ ...manualCandidate, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider ml-1 block mb-1.5">Phone Number</label>
                                <input
                                    type="text"
                                    placeholder="Enter phone number"
                                    className="w-full px-4 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] outline-none focus:border-[#0F172A] transition-colors text-sm"
                                    value={manualCandidate.phone}
                                    onChange={e => setManualCandidate({ ...manualCandidate, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowManualAddModal(false)}
                                className="flex-1 px-4 py-2.5 border border-[#E2E8F0] text-[#0F172A] font-medium rounded-lg hover:bg-[#F8FAFC] transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleManualAdd}
                                disabled={isAddingCandidate}
                                className="flex-1 px-4 py-2.5 bg-[#0F172A] text-white font-medium rounded-lg hover:bg-[#1E293B] transition-all disabled:opacity-50 text-sm"
                            >
                                {isAddingCandidate ? 'Adding...' : 'Add Candidate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Examiner_ManageCandidates;
