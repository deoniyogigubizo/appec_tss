'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  User,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Check,
  X,
  Eye,
  Edit,
  ChevronDown,
  ChevronUp,
  Users
} from 'lucide-react';

// Types
interface Student {
  _id: string;
  registrationNumber: string;
  fullname?: string;
  name?: string;
  email?: string;
  class: string;
  level: string;
  trade: string;
  gender?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  admissionLetterStatus: string;
  createdAt: string;
}

interface Stats {
  total: number;
  byLevel: Record<string, number>;
  byTrade: Record<string, number>;
  pending: number;
}

export default function DOSStudentsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, byLevel: {}, byTrade: {}, pending: 0 });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [tradeFilter, setTradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // UI State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 25;

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/students');
      if (response.ok) {
        const data = await response.json();
        
        // Handle both single student and array responses
        let studentsData: Student[] = [];
        if (Array.isArray(data)) {
          studentsData = data;
        } else if (data.student) {
          studentsData = [data.student];
        } else if (data.students) {
          studentsData = data.students;
        }

        setStudents(studentsData);
        
        // Calculate stats
        const byLevel: Record<string, number> = {};
        const byTrade: Record<string, number> = {};
        let pending = 0;
        
        studentsData.forEach(s => {
          byLevel[s.level] = (byLevel[s.level] || 0) + 1;
          byTrade[s.trade] = (byTrade[s.trade] || 0) + 1;
          if (s.admissionLetterStatus === 'pending') pending++;
        });
        
        setStats({
          total: studentsData.length,
          byLevel,
          byTrade,
          pending
        });
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
      
      const interval = setInterval(() => {
        if (autoRefresh) fetchData();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [status, fetchData, autoRefresh]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = levelFilter === 'all' || student.level === levelFilter;
    const matchesTrade = tradeFilter === 'all' || student.trade === tradeFilter;
    const matchesStatus = statusFilter === 'all' || student.admissionLetterStatus === statusFilter;
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'pending' && student.admissionLetterStatus === 'pending');
    
    return matchesSearch && matchesLevel && matchesTrade && matchesStatus && matchesTab;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSelectAll = () => {
    if (selectedStudents.length === paginatedStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(paginatedStudents.map(s => s._id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Active</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">Pending</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const levels = Object.keys(stats.byLevel);
  const trades = Object.keys(stats.byTrade);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/dos" className="text-sky-600 hover:text-sky-800">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300"
              />
              Auto-refresh
            </label>
            <button onClick={() => fetchData()} className="p-2 text-gray-600 hover:text-gray-800">
              <RefreshCw className="w-5 h-5" />
            </button>
            <span className="text-gray-700">{session?.user?.name}</span>
            <button onClick={() => signOut()} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-600">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div 
            onClick={() => { setActiveTab('all'); setLevelFilter('all'); }}
            className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all ${activeTab === 'all' ? 'ring-2 ring-sky-500' : ''}`}
          >
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Students</div>
          </div>
          <div 
            onClick={() => { setActiveTab('pending'); setStatusFilter('pending'); }}
            className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all ${activeTab === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
          >
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-500">Pending Verification</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 mb-2">By Level</div>
            {levels.slice(0, 3).map(level => (
              <div key={level} className="flex justify-between text-sm">
                <span>{level}</span>
                <span className="font-semibold">{stats.byLevel[level]}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 mb-2">By Trade</div>
            {trades.slice(0, 3).map(trade => (
              <div key={trade} className="flex justify-between text-sm">
                <span>{trade}</span>
                <span className="font-semibold">{stats.byTrade[trade]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-4">
          <div className="flex border-b">
            <button
              onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
              className={`px-6 py-3 font-medium ${activeTab === 'all' ? 'border-b-2 border-sky-500 text-sky-600' : 'text-gray-500'}`}
            >
              All Students
            </button>
            <button
              onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
              className={`px-6 py-3 font-medium ${activeTab === 'pending' ? 'border-b-2 border-yellow-500 text-yellow-600' : 'text-gray-500'}`}
            >
              Pending Verification ({stats.pending})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, reg number, or email..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-sky-500 text-sky-600 rounded-md hover:bg-sky-50"
            >
              <Filter className="w-4 h-4" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {selectedStudents.length > 0 && (
              <div className="flex gap-2">
                <button className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm">
                  Activate ({selectedStudents.length})
                </button>
                <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">
                  Export Selected
                </button>
              </div>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={levelFilter}
                onChange={(e) => { setLevelFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">All Levels</option>
                {levels.map(level => (
                  <option key={level} value={level}>{level} ({stats.byLevel[level]})</option>
                ))}
              </select>
              <select
                value={tradeFilter}
                onChange={(e) => { setTradeFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">All Trades</option>
                {trades.map(trade => (
                  <option key={trade} value={trade}>{trade} ({stats.byTrade[trade]})</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Active</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={() => { setLevelFilter('all'); setTradeFilter('all'); setStatusFilter('all'); setSearchTerm(''); setCurrentPage(1); }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === paginatedStudents.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reg. Number</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Trade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No students found</p>
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map(student => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student._id)}
                          onChange={() => handleSelectOne(student._id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {student.registrationNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{student.name || student.fullname || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{student.class}</td>
                      <td className="px-4 py-3 text-gray-600">{student.level}</td>
                      <td className="px-4 py-3 text-gray-600">{student.trade}</td>
                      <td className="px-4 py-3">
                        {getStatusBadge(student.admissionLetterStatus)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setSelectedStudent(student); setShowViewModal(true); }}
                            className="p-1 text-sky-600 hover:text-sky-800"
                            title="View"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => { setSelectedStudent(student); setShowEditModal(true); }}
                            className="p-1 text-gray-600 hover:text-gray-800"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          {student.admissionLetterStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => showToast('Approve functionality coming soon', 'success')}
                                className="p-1 text-green-600 hover:text-green-800"
                                title="Approve"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => showToast('Reject functionality coming soon', 'error')}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Reject"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredStudents.length)} of {filteredStudents.length} students
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* View Modal */}
      {showViewModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">Student Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Registration Number</label>
                <p className="font-medium">{selectedStudent.registrationNumber}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Status</label>
                <p>{getStatusBadge(selectedStudent.admissionLetterStatus)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Full Name</label>
                <p className="font-medium">{selectedStudent.name || selectedStudent.fullname}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Email</label>
                <p>{selectedStudent.email}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Class</label>
                <p>{selectedStudent.class}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Level</label>
                <p>{selectedStudent.level}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Trade</label>
                <p>{selectedStudent.trade}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Gender</label>
                <p>{selectedStudent.gender || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Phone</label>
                <p>{selectedStudent.phoneNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Address</label>
                <p>{selectedStudent.address || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Date of Birth</label>
                <p>{selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Registered</label>
                <p>{selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
