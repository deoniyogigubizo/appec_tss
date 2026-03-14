'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  Users,
  BookOpen,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

// Types
interface AcademicMark {
  _id: string;
  studentId: string;
  studentName?: string;
  registrationNumber?: string;
  course: string;
  term: string;
  level: string;
  trade: string;
  marks: {
    midterm?: number;
    finalExam?: number;
    labWork?: number;
  };
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'published';
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  published: number;
  byCourse: Record<string, number>;
}

export default function DOSMarksPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [marks, setMarks] = useState<AcademicMark[]>([]);
  const [stats, setStats] = useState<Stats>({ 
    total: 0, 
    pendingReview: 0, 
    approved: 0, 
    rejected: 0, 
    published: 0,
    byCourse: {} 
  });
  const [selectedMarks, setSelectedMarks] = useState<string[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [termFilter, setTermFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // UI State
  const [selectedMark, setSelectedMark] = useState<AcademicMark | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [processing, setProcessing] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 25;

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/dos/marks');
      if (response.ok) {
        const data = await response.json();
        
        let marksData: AcademicMark[] = [];
        if (Array.isArray(data)) {
          marksData = data;
        } else if (data.results) {
          marksData = data.results;
        }

        setMarks(marksData);
        
        // Calculate stats
        let pendingReview = 0;
        let approved = 0;
        let rejected = 0;
        let published = 0;
        const byCourse: Record<string, number> = {};
        
        marksData.forEach(m => {
          switch (m.status) {
            case 'submitted': pendingReview++; break;
            case 'approved': approved++; break;
            case 'rejected': rejected++; break;
            case 'published': published++; break;
          }
          byCourse[m.course] = (byCourse[m.course] || 0) + 1;
        });
        
        setStats({
          total: marksData.length,
          pendingReview,
          approved,
          rejected,
          published,
          byCourse
        });
      }
    } catch (error) {
      console.error('Error fetching marks:', error);
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

  // Approve mark
  const handleApprove = async (id: string) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/dos/marks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markId: id, action: 'approve', approvedBy: session?.user?.name })
      });
      
      if (response.ok) {
        showToast('Mark approved successfully', 'success');
        fetchData();
      } else {
        showToast('Failed to approve mark', 'error');
      }
    } catch (error) {
      showToast('Error approving mark', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Batch approve
  const handleBatchApprove = async () => {
    if (selectedMarks.length === 0) return;
    
    setProcessing(true);
    try {
      for (const id of selectedMarks) {
        await fetch(`/api/dos/marks`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markId: id, action: 'approve', approvedBy: session?.user?.name })
        });
      }
      showToast(`${selectedMarks.length} marks approved`, 'success');
      setSelectedMarks([]);
      fetchData();
    } catch (error) {
      showToast('Error batch approving', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Reject mark
  const handleReject = async () => {
    if (!selectedMark || !rejectReason) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/dos/marks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          markId: selectedMark._id, 
          action: 'reject', 
          rejectionReason: rejectReason,
          approvedBy: session?.user?.name
        })
      });
      
      if (response.ok) {
        showToast('Mark rejected', 'success');
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedMark(null);
        fetchData();
      } else {
        showToast('Failed to reject mark', 'error');
      }
    } catch (error) {
      showToast('Error rejecting mark', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Filter marks
  const filteredMarks = marks.filter(mark => {
    const matchesSearch = 
      mark.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mark.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mark.course?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTerm = termFilter === 'all' || mark.term === termFilter;
    const matchesCourse = courseFilter === 'all' || mark.course === courseFilter;
    const matchesLevel = levelFilter === 'all' || mark.level === levelFilter;
    const matchesStatus = statusFilter === 'all' || mark.status === statusFilter;
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'pending' && mark.status === 'submitted') ||
      (activeTab === 'approved' && mark.status === 'approved') ||
      (activeTab === 'rejected' && mark.status === 'rejected');
    
    return matchesSearch && matchesTerm && matchesCourse && matchesLevel && matchesStatus && matchesTab;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMarks.length / rowsPerPage);
  const paginatedMarks = filteredMarks.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSelectAll = () => {
    if (selectedMarks.length === paginatedMarks.length) {
      setSelectedMarks([]);
    } else {
      setSelectedMarks(paginatedMarks.map(m => m._id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedMarks(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">Draft</span>;
      case 'submitted':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">Pending Review</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Rejected</span>;
      case 'published':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Published</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const getTotalMark = (marks: AcademicMark['marks']) => {
    return (marks.midterm || 0) + (marks.finalExam || 0) + (marks.labWork || 0);
  };

  const courses = Object.keys(stats.byCourse);

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
            <h1 className="text-2xl font-bold text-gray-900">Marks Management</h1>
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
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
              <Download className="w-4 h-4" />
              Export
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div 
            onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
            className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md ${activeTab === 'all' ? 'ring-2 ring-sky-500' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-100 rounded-lg">
                <FileText className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">Total Submissions</div>
              </div>
            </div>
          </div>
          <div 
            onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
            className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md ${activeTab === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingReview}</div>
                <div className="text-sm text-gray-500">Pending Review</div>
              </div>
            </div>
          </div>
          <div 
            onClick={() => { setActiveTab('approved'); setCurrentPage(1); }}
            className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md ${activeTab === 'approved' ? 'ring-2 ring-green-500' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                <div className="text-sm text-gray-500">Approved</div>
              </div>
            </div>
          </div>
          <div 
            onClick={() => { setActiveTab('rejected'); setCurrentPage(1); }}
            className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md ${activeTab === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <div className="text-sm text-gray-500">Rejected</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.published}</div>
                <div className="text-sm text-gray-500">Published</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-4">
          <div className="flex border-b">
            <button
              onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
              className={`px-6 py-3 font-medium ${activeTab === 'all' ? 'border-b-2 border-sky-500 text-sky-600' : 'text-gray-500'}`}
            >
              All Submissions
            </button>
            <button
              onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
              className={`px-6 py-3 font-medium ${activeTab === 'pending' ? 'border-b-2 border-yellow-500 text-yellow-600' : 'text-gray-500'}`}
            >
              Pending Review ({stats.pendingReview})
            </button>
            <button
              onClick={() => { setActiveTab('approved'); setCurrentPage(1); }}
              className={`px-6 py-3 font-medium ${activeTab === 'approved' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500'}`}
            >
              Approved ({stats.approved})
            </button>
            <button
              onClick={() => { setActiveTab('rejected'); setCurrentPage(1); }}
              className={`px-6 py-3 font-medium ${activeTab === 'rejected' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500'}`}
            >
              Rejected ({stats.rejected})
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
                  placeholder="Search by student, course..."
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

            {selectedMarks.length > 0 && activeTab === 'pending' && (
              <button
                onClick={handleBatchApprove}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Approve Selected ({selectedMarks.length})
              </button>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={termFilter}
                onChange={(e) => { setTermFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">All Terms</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
              <select
                value={courseFilter}
                onChange={(e) => { setCourseFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
              <select
                value={levelFilter}
                onChange={(e) => { setLevelFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">All Levels</option>
                <option value="L3">Level 3</option>
                <option value="L4">Level 4</option>
                <option value="L5">Level 5</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="published">Published</option>
              </select>
            </div>
          )}
        </div>

        {/* Marks Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    {paginatedMarks.length > 0 && (
                      <input
                        type="checkbox"
                        checked={selectedMarks.length === paginatedMarks.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    )}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Term</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Midterm</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Final</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Lab</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedMarks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No marks found</p>
                    </td>
                  </tr>
                ) : (
                  paginatedMarks.map(mark => (
                    <tr key={mark._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {mark.status === 'submitted' && (
                          <input
                            type="checkbox"
                            checked={selectedMarks.includes(mark._id)}
                            onChange={() => handleSelectOne(mark._id)}
                            className="rounded border-gray-300"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{mark.studentName || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{mark.registrationNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{mark.course}</div>
                        <div className="text-xs text-gray-400">{mark.level} - {mark.trade}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{mark.term}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={mark.marks?.midterm !== undefined ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                          {mark.marks?.midterm ?? '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={mark.marks?.finalExam !== undefined ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                          {mark.marks?.finalExam ?? '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={mark.marks?.labWork !== undefined ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                          {mark.marks?.labWork ?? '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-sky-600">{getTotalMark(mark.marks)}</span>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(mark.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setSelectedMark(mark); setShowDetailModal(true); }}
                            className="p-1 text-sky-600 hover:text-sky-800"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {mark.status === 'submitted' && (
                            <>
                              <button
                                onClick={() => handleApprove(mark._id)}
                                disabled={processing}
                                className="p-1 text-green-600 hover:text-green-800"
                                title="Approve"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => { setSelectedMark(mark); setShowRejectModal(true); }}
                                disabled={processing}
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
                Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredMarks.length)} of {filteredMarks.length} records
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

      {/* Detail Modal */}
      {showDetailModal && selectedMark && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">Mark Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Student Name</label>
                  <p className="font-medium">{selectedMark.studentName}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Registration Number</label>
                  <p>{selectedMark.registrationNumber}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Course</label>
                  <p>{selectedMark.course}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Term</label>
                  <p>{selectedMark.term}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Level</label>
                  <p>{selectedMark.level}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Trade</label>
                  <p>{selectedMark.trade}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Marks Breakdown</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-xs text-gray-500">Midterm</div>
                    <div className="text-xl font-bold text-gray-900">{selectedMark.marks?.midterm ?? 0}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-xs text-gray-500">Final Exam</div>
                    <div className="text-xl font-bold text-gray-900">{selectedMark.marks?.finalExam ?? 0}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-xs text-gray-500">Lab Work</div>
                    <div className="text-xl font-bold text-gray-900">{selectedMark.marks?.labWork ?? 0}</div>
                  </div>
                </div>
                <div className="mt-4 bg-sky-50 p-4 rounded-lg text-center">
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="text-3xl font-bold text-sky-600">{getTotalMark(selectedMark.marks)}</div>
                </div>
              </div>

              <div className="border-t pt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Status</label>
                  <p className="mt-1">{getStatusBadge(selectedMark.status)}</p>
                </div>
                {selectedMark.submittedAt && (
                  <div>
                    <label className="text-xs text-gray-500">Submitted</label>
                    <p>{new Date(selectedMark.submittedAt).toLocaleString()}</p>
                  </div>
                )}
                {selectedMark.approvedAt && (
                  <div>
                    <label className="text-xs text-gray-500">Reviewed</label>
                    <p>{new Date(selectedMark.approvedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              {selectedMark.status === 'submitted' && (
                <>
                  <button
                    onClick={() => { setShowDetailModal(false); setShowRejectModal(true); }}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => { handleApprove(selectedMark._id); setShowDetailModal(false); }}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Approve
                  </button>
                </>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedMark && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">Reject Mark</h2>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-4">
                You are about to reject the marks for <strong>{selectedMark.studentName}</strong> in <strong>{selectedMark.course}</strong>.
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection (required)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter the reason for rejecting this mark..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason || processing}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              >
                Reject Mark
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
