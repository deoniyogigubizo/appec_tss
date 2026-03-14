'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Types
interface Assignment {
  _id: string;
  course: {
    _id: string;
    name: string;
    code: string;
    trade: string;
    level: string;
  };
  class: {
    _id: string;
    name: string;
    level: string;
  } | null;
  permissionGranted: boolean;
  students: Student[];
  totalStudents: number;
  marksEntered: number;
  status: string;
}

interface Student {
  _id: string;
  registrationNumber: string;
  name: string;
}

interface TeacherClassesData {
  assignments: Assignment[];
  term: string;
  terms: string[];
  teacher: {
    _id: string;
    name: string;
    department: string;
  };
  stats: {
    totalClasses: number;
    totalStudents: number;
    submitted: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

export default function TeacherClassesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TeacherClassesData | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [permissionFilter, setPermissionFilter] = useState('all');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showRosterModal, setShowRosterModal] = useState<Assignment | null>(null);
  const [recentActivity, setRecentActivity] = useState<{message: string; time: string}[]>([]);

  const fetchData = useCallback(async (term?: string) => {
    try {
      const url = term ? `/api/teacher/marks?term=${term}` : '/api/teacher/marks';
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        setData(result);
        if (!selectedTerm && result.term) {
          setSelectedTerm(result.term);
        }
        // Generate recent activity
        const activities: {message: string; time: string}[] = [];
        result.assignments?.forEach((a: Assignment) => {
          if (a.status === 'submitted') {
            activities.push({
              message: `Marks for ${a.course.name} (${a.class?.name || 'N/A'}) submitted`,
              time: 'Recently'
            });
          } else if (a.status === 'approved') {
            activities.push({
              message: `Marks for ${a.course.name} approved by DOS`,
              time: 'Today'
            });
          }
        });
        setRecentActivity(activities.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTerm]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, fetchData]);

  // Filter assignments
  const filteredAssignments = data?.assignments?.filter(assignment => {
    const matchesSearch = 
      assignment.course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assignment.class?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    const matchesPermission = permissionFilter === 'all' || 
      (permissionFilter === 'granted' && assignment.permissionGranted) ||
      (permissionFilter === 'denied' && !assignment.permissionGranted);
    
    return matchesSearch && matchesStatus && matchesPermission;
  }) || [];

  const handleTermChange = (term: string) => {
    setSelectedTerm(term);
    setLoading(true);
    fetchData(term);
  };

  const handleEnterMarks = (assignment: Assignment) => {
    router.push(`/dashboard/teacher/marks?courseId=${assignment.course._id}&classId=${assignment.class?._id || ''}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-sky-100 text-sky-700">Draft</span>;
      case 'submitted':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">Submitted</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Approved</span>;
      case 'published':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">✓ Published</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">Draft</span>;
    }
  };

  const calculateProgress = (assignment: Assignment) => {
    if (assignment.totalStudents === 0) return 0;
    return Math.round((assignment.marksEntered / assignment.totalStudents) * 100);
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
            <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{session?.user?.name}</span>
            <button onClick={() => signOut()} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-600">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Term Selection */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Selected Term:</label>
              <select
                value={selectedTerm}
                onChange={(e) => handleTermChange(e.target.value)}
                className="px-4 py-2 border-2 border-sky-500 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {data?.terms?.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
                {data?.term && !data?.terms?.includes(data.term) && (
                  <option value={data.term}>{data.term} (Current)</option>
                )}
              </select>
            </div>
            <div className="text-sm text-gray-500">
              📅 Marks due: End of {selectedTerm || 'Term'}
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{data?.stats?.totalClasses || 0}</div>
            <div className="text-sm text-gray-500">Total Classes</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{data?.stats?.totalStudents || 0}</div>
            <div className="text-sm text-gray-500">Total Students</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-600">{data?.stats?.pending || 0}/{data?.stats?.totalClasses || 0}</div>
            <div className="text-sm text-gray-500">Pending Submission</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{data?.stats?.approved || 0}</div>
            <div className="text-sm text-gray-500">Approved</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content - Class List */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <div className="flex flex-wrap gap-4">
                <input
                  type="text"
                  placeholder="Search classes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  value={permissionFilter}
                  onChange={(e) => setPermissionFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="all">All Permissions</option>
                  <option value="granted">Permission Granted</option>
                  <option value="denied">Permission Denied</option>
                </select>
              </div>
            </div>

            {/* Class Cards */}
            {filteredAssignments.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">📚</div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">No Classes Assigned</h2>
                <p className="text-gray-500">
                  You have no classes assigned for this term. Contact your DOS if this is an error.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAssignments.map(assignment => (
                  <div 
                    key={assignment._id}
                    className={`bg-white rounded-lg shadow-md border-2 transition-all ${
                      expandedCard === assignment._id ? 'border-sky-500' : 'border-transparent hover:border-sky-300'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900">{assignment.course.name}</h3>
                          <p className="text-sm text-gray-500">
                            {assignment.course.code} • {assignment.class?.name || 'General'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {assignment.permissionGranted ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                              ✓ Permission
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 flex items-center gap-1" title="DOS permission required">
                              ✗ No Permission
                            </span>
                          )}
                          {getStatusBadge(assignment.status)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <span>👥 {assignment.totalStudents} students</span>
                        {assignment.status === 'draft' && (
                          <span>{assignment.marksEntered}/{assignment.totalStudents} marks entered</span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {assignment.status === 'draft' && assignment.permissionGranted && (
                        <div className="mb-3">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 transition-all duration-300"
                              style={{ width: `${calculateProgress(assignment)}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{calculateProgress(assignment)}% complete</div>
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEnterMarks(assignment)}
                          disabled={!assignment.permissionGranted}
                          className={`flex-1 px-3 py-2 rounded-md font-semibold text-sm transition-all ${
                            assignment.permissionGranted
                              ? 'bg-primary text-white hover:bg-primary-600'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Enter Marks
                        </button>
                        <button
                          onClick={() => setShowRosterModal(assignment)}
                          className="px-3 py-2 border-2 border-sky-500 text-sky-600 rounded-md font-semibold text-sm hover:bg-sky-50"
                        >
                          View Roster
                        </button>
                      </div>

                      {/* Expanded Details */}
                      {expandedCard === assignment._id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="text-sm text-gray-600">
                            <p>Course: {assignment.course.name}</p>
                            <p>Code: {assignment.course.code}</p>
                            <p>Trade: {assignment.course.trade}</p>
                            <p>Level: {assignment.course.level}</p>
                            {assignment.class && (
                              <>
                                <p>Class: {assignment.class.name}</p>
                                <p>Class Level: {assignment.class.level}</p>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Recent Activity */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="text-sm">
                      <p className="text-gray-700">{activity.message}</p>
                      <p className="text-xs text-gray-400">{activity.time}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Roster Modal */}
      {showRosterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Class Roster</h2>
                <p className="text-gray-500">
                  {showRosterModal.course.name} • {showRosterModal.class?.name || 'General'}
                </p>
              </div>
              <button
                onClick={() => setShowRosterModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">#</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Registration No.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {showRosterModal.students.map((student, idx) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{student.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{student.registrationNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowRosterModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Export functionality would go here
                  alert('Export to PDF/CSV coming soon');
                }}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600"
              >
                Export List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
