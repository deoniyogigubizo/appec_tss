'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

// Types
interface Assessment {
  name: string;
  score: number | string;
  maxScore: number;
}

interface StudentMark {
  _id: string;
  registrationNumber: string;
  name: string;
  email: string;
  marks: Assessment[];
  status: string;
  submittedAt?: string;
  rejectionReason?: string;
  updatedAt?: string;
}

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
  students: StudentMark[];
  totalStudents: number;
  marksEntered: number;
}

interface MarksData {
  assignments: Assignment[];
  term: string;
  teacher: {
    _id: string;
    name: string;
    department: string;
  };
}

// Default assessments - can be configured by DOS
const DEFAULT_ASSESSMENTS = [
  { name: 'Midterm', maxScore: 30 },
  { name: 'Final Exam', maxScore: 50 },
  { name: 'Lab Work', maxScore: 20 },
];

export default function TeacherMarksPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [marksData, setMarksData] = useState<MarksData | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [studentMarks, setStudentMarks] = useState<Record<string, Assessment[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch marks data
  const fetchMarksData = useCallback(async () => {
    try {
      const response = await fetch('/api/teacher/marks');
      if (response.ok) {
        const data = await response.json();
        setMarksData(data);
      }
    } catch (error) {
      console.error('Error fetching marks:', error);
      showToast('Failed to load marks data', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedAssignment]);

  // Auto-select first assignment with permission when data loads
  useEffect(() => {
    if (marksData && marksData.assignments.length > 0 && !selectedAssignment) {
      const firstWithPermission = marksData.assignments.find((a: Assignment) => a.permissionGranted);
      if (firstWithPermission) {
        setSelectedAssignment(firstWithPermission);
      }
    }
  }, [marksData, selectedAssignment]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMarksData();
    }
  }, [status, fetchMarksData]);

  // Initialize student marks when selection changes
  useEffect(() => {
    if (selectedAssignment) {
      const initialMarks: Record<string, Assessment[]> = {};
      selectedAssignment.students.forEach(student => {
        initialMarks[student._id] = student.marks.length > 0
          ? student.marks.map(m => ({ ...m, score: m.score === 0 ? '' : m.score }))
          : DEFAULT_ASSESSMENTS.map(a => ({ ...a, score: '' as string | number }));
      });
      setStudentMarks(initialMarks);
      setHasUnsavedChanges(false);
    }
  }, [selectedAssignment]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleMarkChange = (studentId: string, assessmentIndex: number, value: string, maxScore: number) => {
    // Allow empty string while typing; clamp numeric values
    let newScore: string | number = value;
    if (value !== '') {
      const num = Number(value);
      newScore = isNaN(num) ? 0 : Math.max(0, Math.min(num, maxScore));
    }
    
    setStudentMarks(prev => ({
      ...prev,
      [studentId]: prev[studentId].map((mark, idx) =>
        idx === assessmentIndex ? { ...mark, score: newScore } : mark
      )
    }));
    setHasUnsavedChanges(true);
  };

  const calculateTotal = (marks: Assessment[]) => {
    return marks.reduce((sum, mark) => sum + (mark.score === '' ? 0 : Number(mark.score)), 0);
  };

  const calculateMaxTotal = (marks: Assessment[]) => {
    return marks.reduce((sum, mark) => sum + mark.maxScore, 0);
  };

  const handleSaveDraft = async () => {
    if (!selectedAssignment) return;

    setSaving(true);
    try {
      const marksToSave = Object.entries(studentMarks).map(([studentId, marks]) => ({
        studentId,
        marks: marks.map(m => ({ ...m, score: m.score === '' ? 0 : Number(m.score) }))
      }));

      const response = await fetch('/api/teacher/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedAssignment.course._id,
          studentMarks: marksToSave,
          action: 'save',
          term: marksData?.term
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showToast(`Draft saved at ${new Date().toLocaleTimeString()}`, 'success');
        setHasUnsavedChanges(false);
        fetchMarksData();
      } else {
        showToast(result.error || 'Failed to save draft', 'error');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      showToast('Failed to save draft', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignment) return;

    setSaving(true);
    try {
      const marksToSave = Object.entries(studentMarks).map(([studentId, marks]) => ({
        studentId,
        marks: marks.map(m => ({ ...m, score: m.score === '' ? 0 : Number(m.score) }))
      }));

      const response = await fetch('/api/teacher/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedAssignment.course._id,
          studentMarks: marksToSave,
          action: 'submit',
          term: marksData?.term
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showToast('Marks submitted successfully for DOS review', 'success');
        setHasUnsavedChanges(false);
        setShowSubmitModal(false);
        fetchMarksData();
      } else {
        showToast(result.error || 'Failed to submit marks', 'error');
      }
    } catch (error) {
      console.error('Error submitting marks:', error);
      showToast('Failed to submit marks', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-sky-100 text-sky-700">Draft</span>;
      case 'submitted':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">Submitted</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Rejected</span>;
      case 'published':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">Published</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const filteredAssignments = marksData?.assignments.filter(assignment =>
    assignment.course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (assignment.class?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Separate courses with and without permission
  // When no search, show only courses with permission in main view
  const assignmentsWithPermission = searchTerm 
    ? filteredAssignments.filter(a => a.permissionGranted)
    : filteredAssignments.filter(a => a.permissionGranted);
  const assignmentsWithoutPermission = filteredAssignments.filter(a => !a.permissionGranted);

  const isReadOnly = 
                     selectedAssignment?.students[0]?.status === 'approved' ||
                     selectedAssignment?.students[0]?.status === 'published' ||
                     !selectedAssignment?.permissionGranted;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Please log in to access this page.</p>
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
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Enter Marks</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{session?.user?.name}</span>
            <span className="text-sm text-gray-500">• {marksData?.term}</span>
            <button
              onClick={() => signOut()}
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="px-4 sm:px-0 mb-4 text-sm text-gray-600">
          Dashboard &gt; Teacher &gt; Marks {selectedAssignment && `> ${selectedAssignment.course.name}`}
        </div>

        {/* No Assignments Message */}
        {!loading && marksData?.assignments.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Courses Assigned</h2>
            <p className="text-gray-500 mb-4">
              You don't have any courses assigned yet. Please contact the DOS to get your teaching assignments.
            </p>
            <Link href="/dashboard/teacher" className="text-sky-600 hover:underline">
              Return to Teacher Dashboard
            </Link>
          </div>
        )}

        {/* No Permission Message */}
        {!loading && marksData && marksData.assignments.length > 0 && assignmentsWithPermission.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">🔒</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Permission Required</h2>
            <p className="text-gray-500 mb-4">
              You don't have permission to enter marks for any course yet. Please contact the DOS to grant you permission.
            </p>
            <Link href="/dashboard/teacher" className="text-sky-600 hover:underline">
              Return to Teacher Dashboard
            </Link>
          </div>
        )}

        {/* Main Content */}
        {marksData && marksData.assignments.length > 0 && assignmentsWithPermission.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Panel - Assignment List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">My Courses</h2>
                
                {/* Search */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Assignment List */}
                <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {/* Courses with Permission */}
                  {assignmentsWithPermission.length > 0 && (
                    <>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Courses with Permission
                      </h3>
                      {assignmentsWithPermission.map(assignment => (
                        <div
                          key={assignment._id}
                          onClick={() => setSelectedAssignment(assignment)}
                          className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                            selectedAssignment?._id === assignment._id
                              ? 'border-sky-500 bg-sky-50'
                              : 'border-transparent hover:border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{assignment.course.name}</p>
                              <p className="text-sm text-gray-500">
                                {assignment.course.code} • {assignment.class?.name || 'N/A'}
                              </p>
                            </div>
                            <span className="text-green-500" title="Permission granted">✓</span>
                          </div>
                          <div className="mt-2 flex justify-between items-center text-sm">
                            <span className="text-gray-500">
                              {assignment.marksEntered}/{assignment.totalStudents} students
                            </span>
                            {getStatusBadge(assignment.students[0]?.status || 'draft')}
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Courses without Permission */}
                  {assignmentsWithoutPermission.length > 0 && (
                    <>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">
                        Pending Permission
                      </h3>
                      {assignmentsWithoutPermission.map(assignment => (
                        <div
                          key={assignment._id}
                          onClick={() => setSelectedAssignment(assignment)}
                          className={`p-3 rounded-lg cursor-pointer transition-all border-2 opacity-60 ${
                            selectedAssignment?._id === assignment._id
                              ? 'border-sky-500 bg-sky-50'
                              : 'border-transparent hover:border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{assignment.course.name}</p>
                              <p className="text-sm text-gray-500">
                                {assignment.course.code} • {assignment.class?.name || 'N/A'}
                              </p>
                            </div>
                            <span className="text-red-500" title="Permission denied">✗</span>
                          </div>
                          <div className="mt-2 text-xs text-red-500">
                            Contact DOS for permission
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {filteredAssignments.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      No courses assigned
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Marks Table */}
            <div className="lg:col-span-3">
              {selectedAssignment ? (
                <div className="bg-white rounded-lg shadow">
                  {/* Assignment Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {selectedAssignment.course.name}
                        </h2>
                        <p className="text-gray-500">
                          {selectedAssignment.course.code} • {selectedAssignment.class?.name || 'General'} • {marksData.term}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          {selectedAssignment.permissionGranted ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                              ✓ Permission Granted
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                              ✗ Permission Denied
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {selectedAssignment.marksEntered}/{selectedAssignment.totalStudents} students have marks
                        </p>
                      </div>
                    </div>

                    {/* Status Banner */}
                    {selectedAssignment.students[0]?.status === 'submitted' && !isReadOnly && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                        ✓ Marks submitted - awaiting DOS review
                      </div>
                    )}

                    {isReadOnly && (
                      <div className="mt-3 p-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                        {selectedAssignment.students[0]?.status === 'approved' && '✓ Marks approved by DOS'}
                        {selectedAssignment.students[0]?.status === 'published' && '✓ Results published to students'}
                      </div>
                    )}

                    {selectedAssignment.students[0]?.status === 'rejected' && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 font-semibold text-sm">✗ Marks rejected by DOS - Please revise and resubmit</p>
                        {selectedAssignment.students[0]?.rejectionReason && (
                          <p className="text-red-600 text-sm mt-1">Reason: {selectedAssignment.students[0].rejectionReason}</p>
                        )}
                      </div>
                    )}

                    {hasUnsavedChanges && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                        ⚠ You have unsaved changes
                      </div>
                    )}
                  </div>

                  {/* Marks Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50">
                            Student
                          </th>
                          {DEFAULT_ASSESSMENTS.map(assessment => (
                            <th key={assessment.name} className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              {assessment.name} ({assessment.maxScore})
                            </th>
                          ))}
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Total ({calculateMaxTotal(DEFAULT_ASSESSMENTS.map(a => ({...a, score: 0} as Assessment)))})
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedAssignment.students.map(student => (
                          <tr key={student._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 sticky left-0 bg-white">
                              <p className="font-medium text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-500">{student.registrationNumber}</p>
                            </td>
                            {studentMarks[student._id]?.map((mark, idx) => (
                              <td key={idx} className="px-4 py-3">
                                <input
                                  type="number"
                                  min={0}
                                  max={mark.maxScore}
                                  value={mark.score}
                                  onChange={(e) => handleMarkChange(student._id, idx, e.target.value, mark.maxScore)}
                                  onFocus={(e) => {
                                    // Clear the field when focused if value is 0, so user can type freely
                                    if (e.target.value === '0') {
                                      handleMarkChange(student._id, idx, '', mark.maxScore);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    // On blur, if empty treat as 0
                                    if (e.target.value === '') {
                                      handleMarkChange(student._id, idx, '0', mark.maxScore);
                                    }
                                  }}
                                  disabled={isReadOnly}
                                  className={`w-20 px-2 py-1 text-center border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                                    isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''
                                  } ${
                                    Number(mark.score) > mark.maxScore || Number(mark.score) < 0
                                      ? 'border-red-500 bg-red-50'
                                      : 'border-gray-300'
                                  }`}
                                />
                              </td>
                            ))}
                            <td className="px-4 py-3 text-center">
                              <span className={`font-bold ${
                                calculateTotal(studentMarks[student._id] || []) >= calculateMaxTotal(DEFAULT_ASSESSMENTS.map(a => ({...a, score: 0} as Assessment))) * 0.5
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}>
                                {calculateTotal(studentMarks[student._id] || [])}/{calculateMaxTotal(DEFAULT_ASSESSMENTS.map(a => ({...a, score: 0} as Assessment)))}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 border-t border-gray-200 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {hasUnsavedChanges && '⚠ Unsaved changes will be lost if you leave this page'}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveDraft}
                        disabled={saving || isReadOnly}
                        className={`px-4 py-2 border-2 rounded-md font-semibold transition-all ${
                          isReadOnly 
                            ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                            : 'border-sky-500 text-sky-600 hover:bg-sky-50'
                        }`}
                      >
                        {saving ? 'Saving...' : 'Save Draft'}
                      </button>
                      <button
                        onClick={() => setShowSubmitModal(true)}
                        disabled={saving || isReadOnly}
                        className={`px-6 py-2 rounded-md font-semibold transition-all ${
                          isReadOnly 
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : 'bg-primary hover:bg-primary-600 text-white'
                        }`}
                      >
                        {saving ? 'Submitting...' : 'Submit for Review'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-500">Select a course to enter marks</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Submission</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to submit these marks for DOS review? 
              You cannot edit them after submission unless DOS rejects them.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600"
              >
                Yes, Submit Marks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
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
