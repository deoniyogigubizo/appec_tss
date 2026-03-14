'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { 
  Search, 
  Check, 
  X, 
  History,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User,
  BookOpen,
  Shield,
  ShieldOff,
  Edit,
  Save,
  XCircle
} from 'lucide-react';

// Types
interface Course {
  _id: string;
  name: string;
  code: string;
  trade: string;
  level: string;
}

interface Assignment {
  _id: string;
  teacherId: string;
  courseId: {
    _id: string;
    name: string;
    code: string;
    trade: string;
    level: string;
  } | string;
  term: string;
  permissionGranted: boolean;
  grantedBy: { _id: string; name: string } | null;
  grantedAt: string | null;
  revokedBy: { _id: string; name: string } | null;
  revokedAt: string | null;
}

interface TeacherWithAssignments {
  _id: string;
  userId: string;
  name: string;
  email: string;
  department: string;
  subjects: string[];
  assignments: Assignment[];
  isActive: boolean;
}

export default function DOSPermissionsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<TeacherWithAssignments[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTeachers, setExpandedTeachers] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [editingTeacher, setEditingTeacher] = useState<string | null>(null);
  const [editingSubjects, setEditingSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState('');

  // Helper function to find course by subject name
  const findCourseBySubject = (subjectName: string): Course | undefined => {
    return courses.find(c => c.name.toLowerCase() === subjectName.toLowerCase());
  };

  const fetchData = useCallback(async () => {
    try {
      // Fetch teachers
      const teachersRes = await fetch('/api/teachers');
      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        
        // Fetch courses
        const coursesRes = await fetch('/api/courses');
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setCourses(coursesData);
        }
        
        // Fetch assignments
        const assignmentsRes = await fetch('/api/teacher-assignments');
        let assignments: Assignment[] = [];
        if (assignmentsRes.ok) {
          assignments = await assignmentsRes.json();
        }

        // Group assignments by teacher
        const teachersWithAssignments: TeacherWithAssignments[] = teachersData.map((teacher: any) => {
          const teacherUserId = teacher.userId?._id?.toString() || teacher.userId?.toString() || teacher._id;
          const teacherAssignments = assignments.filter((a: Assignment) => a.teacherId === teacherUserId);
          return {
            _id: teacher._id,
            userId: teacherUserId,
            name: teacher.userId?.name || 'Unknown',
            email: teacher.userId?.email || '',
            department: teacher.department || '',
            subjects: teacher.subjects || [],
            isActive: teacher.isActive || false,
            assignments: teacherAssignments
          };
        });

        setTeachers(teachersWithAssignments);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
      
      const interval = setInterval(() => {
        if (autoRefresh) {
          fetchData();
        }
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [status, fetchData, autoRefresh]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Subject editing handlers
  const startEditingSubjects = (teacherId: string, currentSubjects: string[]) => {
    setEditingTeacher(teacherId);
    setEditingSubjects([...currentSubjects]);
  };

  const cancelEditingSubjects = () => {
    setEditingTeacher(null);
    setEditingSubjects([]);
    setNewSubject('');
  };

  const addSubject = () => {
    if (newSubject.trim() && !editingSubjects.includes(newSubject.trim())) {
      setEditingSubjects([...editingSubjects, newSubject.trim()]);
      setNewSubject('');
    }
  };

  const removeSubject = (subject: string) => {
    setEditingSubjects(editingSubjects.filter(s => s !== subject));
  };

  const saveSubjects = async (teacherId: string) => {
    try {
      const response = await fetch('/api/teachers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, subjects: editingSubjects })
      });

      if (response.ok) {
        showToast('Subjects updated successfully', 'success');
        setEditingTeacher(null);
        setEditingSubjects([]);
        fetchData();
      } else {
        showToast('Failed to update subjects', 'error');
      }
    } catch (error) {
      console.error('Error updating subjects:', error);
      showToast('Failed to update subjects', 'error');
    }
  };

  // Create assignment from teacher subject using courses API and grant permission
  const handleCreateAssignmentFromSubject = async (teacherId: string, subject: string, matchedCourse: Course | undefined) => {
    try {
      console.log('Creating assignment with:', { teacherId, subject, matchedCourse });
      
      if (!matchedCourse) {
        showToast('Cannot create assignment: Course not found in system', 'error');
        return;
      }

      if (!matchedCourse._id) {
        showToast('Cannot create assignment: Course ID is missing', 'error');
        return;
      }

      // Use the teacher-assignments API to create assignment with permission granted
      const response = await fetch('/api/teacher-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacherId,
          courseId: matchedCourse._id,
          term: 'current',
          permissionGranted: true // Grant permission immediately
        })
      });

      if (response.ok) {
        const result = await response.json();
        showToast(`Permission granted for ${subject}`, 'success');
        fetchData();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to grant permission', 'error');
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      showToast('Failed to grant permission', 'error');
    }
  };

  const handleGrantAll = async (teacherId: string) => {
    try {
      const teacher = teachers.find(t => t._id === teacherId);
      if (!teacher) return;

      // Grant all assignments that don't have permission
      const promises = teacher.assignments
        .filter(a => !a.permissionGranted)
        .map(a => 
          fetch('/api/teacher-assignments', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignmentId: a._id, permissionGranted: true })
          })
        );

      await Promise.all(promises);
      showToast(`Granted permissions for all courses to ${teacher.name}`, 'success');
      fetchData();
    } catch (error) {
      console.error('Error granting permissions:', error);
      showToast('Failed to grant permissions', 'error');
    }
  };

  const handleRevokeAll = async (teacherId: string) => {
    try {
      const teacher = teachers.find(t => t._id === teacherId);
      if (!teacher) return;

      // Revoke all assignments that have permission
      const promises = teacher.assignments
        .filter(a => a.permissionGranted)
        .map(a => 
          fetch('/api/teacher-assignments', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignmentId: a._id, permissionGranted: false })
          })
        );

      await Promise.all(promises);
      showToast(`Revoked permissions for all courses from ${teacher.name}`, 'success');
      fetchData();
    } catch (error) {
      console.error('Error revoking permissions:', error);
      showToast('Failed to revoke permissions', 'error');
    }
  };

  const handleToggleSingle = async (assignmentId: string, granted: boolean) => {
    try {
      const response = await fetch('/api/teacher-assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, permissionGranted: granted })
      });

      const result = await response.json();
      
      if (result.success) {
        showToast(granted ? 'Permission granted' : 'Permission revoked', 'success');
        fetchData();
      } else {
        showToast(result.error || 'Failed to update', 'error');
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      showToast('Failed to update permission', 'error');
    }
  };

  const toggleTeacherExpand = (teacherId: string) => {
    setExpandedTeachers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teacherId)) {
        newSet.delete(teacherId);
      } else {
        newSet.add(teacherId);
      }
      return newSet;
    });
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGrantedCount = (teacher: TeacherWithAssignments) => 
    teacher.assignments.filter(a => a.permissionGranted).length;

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <Link href="/dashboard/dos" className="text-sky-600 hover:text-sky-800">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Permissions</h1>
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
        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search teachers by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Teachers List */}
        {filteredTeachers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Teachers Found</h2>
            <p className="text-gray-500">
              No teachers match your search criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTeachers.map(teacher => (
              <div key={teacher._id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Teacher Header */}
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleTeacherExpand(teacher._id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{teacher.name}</h3>
                      <p className="text-sm text-gray-500">{teacher.email}</p>
                      <p className="text-xs text-gray-400">{teacher.department}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Status Badge */}
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      teacher.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {teacher.isActive ? 'Active' : 'Pending'}
                    </span>
                    
                    {/* Stats */}
                    <div className="text-center px-4">
                      <div className={`text-xl font-bold ${
                        getGrantedCount(teacher) === teacher.assignments.length && teacher.assignments.length > 0
                          ? 'text-green-600'
                          : getGrantedCount(teacher) > 0
                            ? 'text-yellow-600'
                            : 'text-gray-400'
                      }`}>
                        {getGrantedCount(teacher)}/{teacher.assignments.length}
                      </div>
                      <div className="text-xs text-gray-500">Permissions</div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleGrantAll(teacher._id)}
                        disabled={teacher.assignments.length === 0 || getGrantedCount(teacher) === teacher.assignments.length}
                        className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        <Shield className="w-4 h-4" />
                        Grant All
                      </button>
                      <button
                        onClick={() => handleRevokeAll(teacher._id)}
                        disabled={getGrantedCount(teacher) === 0}
                        className="flex items-center gap-1 px-3 py-2 border-2 border-red-500 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        <ShieldOff className="w-4 h-4" />
                        Revoke All
                      </button>
                    </div>
                    
                    {/* Expand Icon */}
                    {expandedTeachers.has(teacher._id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {/* Expanded Course List */}
                {expandedTeachers.has(teacher._id) && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    {/* Show Teacher's Subjects from Teacher Model */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-600">
                          Courses ({editingTeacher === teacher._id ? editingSubjects.length : teacher.subjects.length})
                        </h4>
                        {editingTeacher !== teacher._id && (
                          <button
                            onClick={() => startEditingSubjects(teacher._id, teacher.subjects)}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                        )}
                      </div>
                      
                      {/* Editing Mode */}
                      {editingTeacher === teacher._id ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {editingSubjects.map((subject, idx) => {
                              const matchedCourse = findCourseBySubject(subject);
                              return (
                                <span 
                                  key={idx}
                                  className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                >
                                  {subject}
                                  {matchedCourse && (
                                    <span className="text-xs text-blue-600">
                                      ({matchedCourse.code} - {matchedCourse.trade}/{matchedCourse.level})
                                    </span>
                                  )}
                                  <button
                                    onClick={() => removeSubject(subject)}
                                    className="ml-1 hover:text-red-500"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                          
                          {/* Add new subject */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newSubject}
                              onChange={(e) => setNewSubject(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addSubject()}
                              placeholder="Add new subject..."
                              className="flex-1 px-3 py-2 text-sm border rounded"
                              list="available-courses"
                            />
                            <datalist id="available-courses">
                              {courses.filter(c => !editingSubjects.includes(c.name)).map(course => (
                                <option key={course._id} value={course.name} />
                              ))}
                            </datalist>
                            <button
                              onClick={addSubject}
                              className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                            >
                              Add
                            </button>
                            <button
                              onClick={saveSubjects.bind(null, teacher._id)}
                              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center gap-1"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={cancelEditingSubjects}
                              className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <div className="flex flex-wrap gap-2">
                          {teacher.subjects && teacher.subjects.length > 0 ? (
                            teacher.subjects.map((subject, idx) => {
                              const matchedCourse = findCourseBySubject(subject);
                              return (
                                <span 
                                  key={idx}
                                  className={`px-3 py-1 rounded-full text-sm ${
                                    matchedCourse 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {subject}
                                  {matchedCourse && (
                                    <span className="ml-1 text-xs">
                                      ({matchedCourse.code} - {matchedCourse.trade}/{matchedCourse.level})
                                    </span>
                                  )}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-gray-500 text-sm">No subjects assigned</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Show Assignments */}
                    {teacher.assignments.length === 0 && teacher.subjects.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No course assignments yet</p>
                        <p className="text-sm">Assign courses to this teacher first</p>
                      </div>
                    ) : teacher.assignments.length === 0 ? (
                      <div className="p-4">
                        <p className="text-sm text-gray-600 mb-3">
                          Grant permission for teacher's subjects to allow marks entry:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {teacher.subjects.map((subject, idx) => {
                            const matchedCourse = findCourseBySubject(subject);
                            return (
                              <div 
                                key={idx}
                                className={`p-3 rounded-lg border-2 bg-white`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                      {subject}
                                    </p>
                                    {matchedCourse && (
                                      <p className="text-xs text-gray-500">
                                        {matchedCourse.code} • {matchedCourse.trade} {matchedCourse.level}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleCreateAssignmentFromSubject(teacher._id, subject, matchedCourse)}
                                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                  >
                                    Grant
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4">
                        <h4 className="text-sm font-semibold text-gray-600 mb-3">
                          Assigned Courses ({teacher.assignments.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {teacher.assignments.map(assignment => (
                            <div 
                              key={assignment._id} 
                              className={`p-3 rounded-lg border-2 transition-all ${
                                assignment.permissionGranted 
                                  ? 'border-green-200 bg-green-50' 
                                  : 'border-gray-200 bg-white'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">
                                    {(assignment.courseId as any)?.name || 'Unknown Course'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {(assignment.courseId as any)?.code} • {(assignment.courseId as any)?.trade} {(assignment.courseId as any)?.level}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Term: {assignment.term}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleToggleSingle(assignment._id, !assignment.permissionGranted)}
                                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    assignment.permissionGranted 
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                                  }`}
                                >
                                  {assignment.permissionGranted ? 'Reject' : 'Grant'}
                                </button>
                              </div>
                              <div className="mt-2 text-xs text-gray-500">
                                {assignment.permissionGranted ? (
                                  <span className="text-green-600">
                                    ✓ Granted {assignment.grantedAt ? `on ${formatDate(assignment.grantedAt)}` : ''}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">
                                    Not granted
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

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
