'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Types
interface Submission {
  _id: string;
  course: {
    _id: string;
    name: string;
    code: string;
  };
  class: {
    _id: string;
    name: string;
  } | null;
  term: string;
  status: string;
  submittedAt: string;
  approvedAt?: string;
  rejectionReason?: string;
  totalStudents: number;
  marks: Assessment[];
}

interface Assessment {
  name: string;
  score: number;
  maxScore: number;
}

interface StudentMark {
  studentId: string;
  studentName: string;
  registrationNumber: string;
  marks: Assessment[];
  total: number;
}

interface SubmittedMarksData {
  submissions: Submission[];
  stats: {
    pending: number;
    approved: number;
    published: number;
    rejected: number;
  };
  terms: string[];
}

export default function TeacherSubmittedMarksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SubmittedMarksData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [studentMarks, setStudentMarks] = useState<StudentMark[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/teacher/marks');
      if (response.ok) {
        const result = await response.json();
        
        // Transform assignments into submissions
        const submissions: Submission[] = result.assignments
          ?.filter((a: any) => a.students[0]?.status !== 'draft' && a.students[0]?.status !== undefined)
          .map((assignment: any) => {
            const firstStudent = assignment.students[0] || {};
            return {
              _id: assignment._id,
              course: assignment.course,
              class: assignment.class,
              term: result.term,
              status: firstStudent.status || 'draft',
              submittedAt: firstStudent.submittedAt || '',
              totalStudents: assignment.totalStudents,
              marks: []
            };
          }) || [];

        const stats = {
          pending: submissions.filter(s => s.status === 'submitted').length,
          approved: submissions.filter(s => s.status === 'approved').length,
          published: submissions.filter(s => s.status === 'published').length,
          rejected: submissions.filter(s => s.status === 'rejected').length,
        };

        setData({
          submissions,
          stats,
          terms: result.terms || [result.term].filter(Boolean)
        });
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        if (autoRefresh) {
          fetchData();
        }
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [status, fetchData, autoRefresh]);

  // Filter submissions
  const filteredSubmissions = data?.submissions?.filter(submission => {
    const matchesSearch = 
      submission.course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (submission.class?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    const matchesTerm = termFilter === 'all' || submission.term === termFilter;
    
    return matchesSearch && matchesStatus && matchesTerm;
  }) || [];

  const handleViewDetails = async (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowDetailsModal(true);
    
    // Fetch detailed marks (in real app, this would be a separate API call)
    try {
      const response = await fetch(`/api/teacher/marks?courseId=${submission.course._id}`);
      if (response.ok) {
        const result = await response.json();
        const assignment = result.assignments?.[0];
        if (assignment) {
          const marks = assignment.students
            .filter((s: any) => s.marks?.length > 0)
            .map((s: any) => ({
              studentId: s._id,
              studentName: s.name,
              registrationNumber: s.registrationNumber,
              marks: s.marks,
              total: s.marks.reduce((sum: number, m: Assessment) => sum + m.score, 0)
            }));
          setStudentMarks(marks);
        }
      }
    } catch (error) {
      console.error('Error fetching details:', error);
    }
  };

  const handleRevise = (submission: Submission) => {
    router.push(`/dashboard/teacher/marks?courseId=${submission.course._id}&classId=${submission.class?._id || ''}&revise=true`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-sky-100 text-sky-700">Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Approved</span>;
      case 'published':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">✓ Published</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };

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
            <Link href="/dashboard/teacher" className="text-sky-600 hover:text-sky-800">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Submitted Marks</h1>
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
            <span className="text-gray-700">{session?.user?.name}</span>
            <button onClick={() => signOut()} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-600">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Status Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div 
            onClick={() => setStatusFilter('submitted')}
            className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all ${statusFilter === 'submitted' ? 'ring-2 ring-sky-500' : ''}`}
          >
            <div className="text-2xl font-bold text-sky-600">{data?.stats?.pending || 0}</div>
            <div className="text-sm text-gray-500">Pending Approval</div>
          </div>
          <div 
            onClick={() => setStatusFilter('approved')}
            className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all ${statusFilter === 'approved' ? 'ring-2 ring-green-500' : ''}`}
          >
            <div className="text-2xl font-bold text-green-600">{data?.stats?.approved || 0}</div>
            <div className="text-sm text-gray-500">Approved</div>
          </div>
          <div 
            onClick={() => setStatusFilter('published')}
            className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all ${statusFilter === 'published' ? 'ring-2 ring-green-500' : ''}`}
          >
            <div className="text-2xl font-bold text-green-700">{data?.stats?.published || 0}</div>
            <div className="text-sm text-gray-500">Published</div>
          </div>
          <div 
            onClick={() => setStatusFilter('rejected')}
            className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all ${statusFilter === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
          >
            <div className="text-2xl font-bold text-red-600">{data?.stats?.rejected || 0}</div>
            <div className="text-sm text-gray-500">Rejected</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Search by course or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <select
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Terms</option>
              {data?.terms?.map(term => (
                <option key={term} value={term}>{term}</option>
              ))}
            </select>
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear filter ✕
              </button>
            )}
          </div>
        </div>

        {/* Submissions Table */}
        {filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">No Submissions Yet</h2>
           -gray-700 mb <p className="text-gray-500 mb-4">
              You haven't submitted any marks yet. Go to Classes to get started.
            </p>
            <Link href="/dashboard/teacher/classes" className="text-sky-600 hover:underline">
              Go to My Classes
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Term</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubmissions.map(submission => (
                  <tr key={submission._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{submission.course.name}</div>
                      <div className="text-sm text-gray-500">{submission.course.code}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {submission.class?.name || 'General'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {submission.term}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {submission.totalStudents}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(submission.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(submission)}
                          className="px-3 py-1 text-sm border border-sky-500 text-sky-600 rounded hover:bg-sky-50"
                        >
                          View Details
                        </button>
                        {submission.status === 'rejected' && (
                          <button
                            onClick={() => handleRevise(submission)}
                            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Revise
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Details Modal */}
      {showDetailsModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedSubmission.course.name}</h2>
                <p className="text-gray-500">
                  {selectedSubmission.course.code} • {selectedSubmission.class?.name || 'General'} • {selectedSubmission.term}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedSubmission.status)}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Rejection Reason */}
            {selectedSubmission.status === 'rejected' && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-semibold text-red-700 mb-2">⚠️ Rejection Reason</h3>
                <p className="text-red-600">{selectedSubmission.rejectionReason || 'No reason provided'}</p>
              </div>
            )}

            {/* Submission Info */}
            <div className="mb-4 text-sm text-gray-600">
              <p>Submitted: {selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleString() : 'N/A'}</p>
              {selectedSubmission.approvedAt && (
                <p>Approved: {new Date(selectedSubmission.approvedAt).toLocaleString()}</p>
              )}
            </div>

            {/* Marks Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">#</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Student</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Reg. No.</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">Midterm (30)</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">Final (50)</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">Lab (20)</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {studentMarks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        Loading marks...
                      </td>
                    </tr>
                  ) : (
                    studentMarks.map((student, idx) => (
                      <tr key={student.studentId} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{student.studentName}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{student.registrationNumber}</td>
                        <td className="px-4 py-2 text-center text-sm">{student.marks[0]?.score || 0}</td>
                        <td className="px-4 py-2 text-center text-sm">{student.marks[1]?.score || 0}</td>
                        <td className="px-4 py-2 text-center text-sm">{student.marks[2]?.score || 0}</td>
                        <td className="px-4 py-2 text-center text-sm font-bold">{student.total}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Export to PDF
                  alert('Export to PDF coming soon');
                }}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
