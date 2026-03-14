'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

interface Teacher {
  _id: string;
  employeeId: string;
  department: string;
  trade: string;
  level: string;
  subjects: string[];
  isActive: boolean;
  assignedToDos: boolean;
  userId: {
    _id: string;
    name: string;
    email: string;
  } | null;
}

interface Course {
  _id: string;
  name: string;
  code: string;
  trade: string;
  level: string;
  currentTeacher: {
    teacherName: string;
    teacherId: string;
  } | null;
}

interface TeacherAssignment {
  _id: string;
  teacherId: string;
  courseId: {
    _id: string;
    name: string;
    code: string;
    trade: string;
    level: string;
  };
  course?: {
    name: string;
    code: string;
    trade: string;
    level: string;
  };
  term: string;
}

const TRADES = ['CSA', 'BDC', 'ACC', 'SWD'];
const LEVELS = ['L3', 'L4', 'L5'];

export default function TeacherAssignments() {
  const { data: session } = useSession();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [showWarning, setShowWarning] = useState<{ courseId: string; courseName: string; currentTeacher: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all teachers
      const teachersRes = await fetch('/api/teachers');
      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        setTeachers(teachersData);
      }

      // Fetch courses
      const coursesRes = await fetch('/api/courses');
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData);
      }

      // Fetch teacher assignments
      const assignmentsRes = await fetch('/api/teacher-assignments');
      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        setAssignments(assignmentsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setSelectedTrades([]);
    setSelectedLevels([]);
    setSelectedCourses([]);
    setShowWarning(null);
  };

  const handleTradeToggle = (trade: string) => {
    setSelectedTrades(prev => 
      prev.includes(trade) 
        ? prev.filter(t => t !== trade)
        : [...prev, trade]
    );
    setSelectedCourses([]);
  };

  const handleLevelToggle = (level: string) => {
    setSelectedLevels(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
    setSelectedCourses([]);
  };

  const handleSelectAllMatching = () => {
    // Select all courses that match current filters and are not assigned
    const available = filteredCourses.filter(c => !c.currentTeacher || c.currentTeacher.teacherId === selectedTeacher?._id);
    setSelectedCourses(available.map(c => c._id));
  };

  const handleCourseToggle = (course: Course) => {
    if (course.currentTeacher && course.currentTeacher.teacherId !== selectedTeacher?._id) {
      setShowWarning({
        courseId: course._id,
        courseName: course.name,
        currentTeacher: course.currentTeacher.teacherName
      });
      return;
    }

    setSelectedCourses(prev => 
      prev.includes(course._id)
        ? prev.filter(id => id !== course._id)
        : [...prev, course._id]
    );
  };

  const confirmCourseSelection = (course: Course) => {
    setSelectedCourses(prev => [...prev, course._id]);
    setShowWarning(null);
  };

  const handleAssignCourses = async () => {
    if (!selectedTeacher || selectedCourses.length === 0) return;

    try {
      const response = await fetch('/api/courses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teacherId: selectedTeacher._id,
          courseIds: selectedCourses,
          term: 'current',
          replaceExisting: true
        })
      });

      if (response.ok) {
        alert('Courses assigned successfully! Teacher can now login.');
        fetchData();
        setSelectedTeacher(null);
        setSelectedCourses([]);
        setSelectedTrades([]);
        setSelectedLevels([]);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to assign courses');
      }
    } catch (error) {
      console.error('Error assigning courses:', error);
      alert('Failed to assign courses');
    }
  };

  // Filter courses based on selected trades AND levels
  const filteredCourses = selectedTrades.length > 0 && selectedLevels.length > 0
    ? courses.filter(c => selectedTrades.includes(c.trade) && selectedLevels.includes(c.level))
    : [];

  // Group courses by trade for better display
  const groupedCourses = filteredCourses.reduce((acc, course) => {
    const key = `${course.trade}-${course.level}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(course);
    return acc;
  }, {} as Record<string, Course[]>);

  // Get active teachers (verified with courses)
  const activeTeachers = teachers.filter(t => t.isActive);
  
  // Get teacher assignments with course details
  const getTeacherCourses = (teacherId: string) => {
    return assignments
      .filter(a => a.teacherId === teacherId)
      .map(a => {
        // Use embedded course data if available, otherwise use populated courseId
        if (a.course) {
          return {
            _id: a.courseId._id,
            name: a.course.name,
            code: a.course.code || '',
            trade: a.course.trade || '',
            level: a.course.level || ''
          };
        }
        return a.courseId;
      })
      .filter(c => c);
  };

  // Find course by subject name
  const findCourseBySubject = (subjectName: string): Course | undefined => {
    return courses.find(c => c.name.toLowerCase() === subjectName.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-antiquewhite">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/dos" className="text-sky-600 hover:text-sky-800">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Teacher Course Assignments
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{session?.user?.name}</span>
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
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-l-4 border-sky-500">
          <h2 className="text-xl font-bold text-gray-900">
            Assign Multiple Courses to Teachers
          </h2>
          <p className="text-gray-600 mt-2">
            1. Select a teacher → 2. Choose Trades & Levels → 3. Select courses → 4. Assign
          </p>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            {/* Verified Teachers Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-green-700">
                ✓ Verified Teachers (Active with Assigned Courses)
              </h3>
              {activeTeachers.length === 0 ? (
                <p className="text-gray-500">No verified teachers yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeTeachers.map(teacher => {
                    const teacherCourses = getTeacherCourses(teacher._id);
                    return (
                      <div key={teacher._id} className="border rounded-lg p-4 bg-green-50">
                        <div className="font-medium text-gray-900">{teacher.userId?.name}</div>
                        <div className="text-sm text-gray-500">{teacher.userId?.email}</div>
                        <div className="text-sm text-gray-500">{teacher.department}</div>
                        <div className="mt-2">
                          <span className="text-xs font-semibold text-green-700">Courses:</span>
                          <div className="text-sm text-gray-600 mt-1">
                            {teacherCourses.length === 0 ? (
                              <div>
                                {teacher.subjects && teacher.subjects.length > 0 ? (
                                  <div>
                                    <span className="text-orange-500">No active assignments</span>
                                    <div className="mt-1">
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {teacher.subjects.map((subject, idx) => {
                                          const matchedCourse = findCourseBySubject(subject);
                                          return (
                                            <span 
                                              key={idx} 
                                              className={`px-2 py-0.5 rounded text-xs ${
                                                matchedCourse 
                                                  ? 'bg-green-100 text-green-800' 
                                                  : 'bg-blue-100 text-blue-800'
                                              }`}
                                            >
                                              {subject}
                                              {matchedCourse && (
                                                <span className="ml-1">
                                                  ({matchedCourse.code} - {matchedCourse.trade}/{matchedCourse.level})
                                                </span>
                                              )}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-orange-500">No courses assigned yet</span>
                                )}
                              </div>
                            ) : (
                              teacherCourses.map((course, idx) => (
                                <div key={idx} className="ml-2">
                                  • {course.name} ({course.code})
                                  <span className="text-gray-400 ml-1">- {course.trade}/{course.level}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assignment Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Teacher List */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Step 1: Select Teacher</h3>
                {teachers.length === 0 ? (
                  <p className="text-gray-500">No teachers found.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {teachers.map(teacher => (
                      <div 
                        key={teacher._id}
                        onClick={() => handleSelectTeacher(teacher)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedTeacher?._id === teacher._id 
                            ? 'border-sky-500 bg-sky-50' 
                            : 'border-gray-200 hover:border-sky-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">{teacher.userId?.name || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{teacher.userId?.email}</p>
                          </div>
                          <div>
                            {teacher.isActive ? (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Trade & Level Selection */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Step 2: Select Trades & Levels</h3>
                
                {!selectedTeacher ? (
                  <p className="text-gray-500">Select a teacher first.</p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trades (select one or more)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {TRADES.map(trade => (
                          <button
                            key={trade}
                            onClick={() => handleTradeToggle(trade)}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                              selectedTrades.includes(trade)
                                ? 'bg-sky-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {trade}
                          </button>
                        ))}
                      </div>
                      {selectedTrades.length > 0 && (
                        <p className="text-xs text-sky-600 mt-1">Selected: {selectedTrades.join(', ')}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Levels (select one or more)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {LEVELS.map(level => (
                          <button
                            key={level}
                            onClick={() => handleLevelToggle(level)}
                            disabled={selectedTrades.length === 0}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                              selectedLevels.includes(level)
                                ? 'bg-sky-600 text-white'
                                : selectedTrades.length === 0
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                      {selectedLevels.length > 0 && (
                        <p className="text-xs text-sky-600 mt-1">Selected: {selectedLevels.join(', ')}</p>
                      )}
                    </div>

                    {selectedTrades.length > 0 && selectedLevels.length > 0 && (
                      <div className="pt-4 border-t">
                        <button
                          onClick={handleSelectAllMatching}
                          className="text-sm text-sky-600 hover:text-sky-800 underline"
                        >
                          Select all available courses
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Course Selection */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {selectedTeacher && selectedTrades.length > 0 && selectedLevels.length > 0 
                    ? `Step 3: Select Courses (${filteredCourses.length} available)`
                    : 'Step 3: Select Courses'
                  }
                </h3>
                
                {!selectedTeacher ? (
                  <p className="text-gray-500">Select a teacher first.</p>
                ) : selectedTrades.length === 0 || selectedLevels.length === 0 ? (
                  <p className="text-gray-500">
                    {selectedTrades.length === 0 
                      ? 'Select one or more trades first.'
                      : 'Select one or more levels first.'}
                  </p>
                ) : filteredCourses.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-4">
                      No courses available for {selectedTrades.join(', ')} at {selectedLevels.join(', ')} levels.
                    </p>
                    <p className="text-sm text-gray-400">Please create courses first.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {selectedCourses.length} of {filteredCourses.length} selected
                      </span>
                      <button
                        onClick={() => setSelectedCourses([])}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Clear selection
                      </button>
                    </div>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {Object.entries(groupedCourses).map(([key, groupCourses]) => {
                        const [trade, level] = key.split('-');
                        return (
                          <div key={key} className="border rounded-lg p-3 bg-gray-50">
                            <div className="font-medium text-sm text-gray-700 mb-2">
                              {trade} - {level} ({groupCourses.length} courses)
                            </div>
                            <div className="space-y-2">
                              {groupCourses.map(course => (
                                <label 
                                  key={course._id}
                                  className={`flex items-center p-2 border rounded-lg cursor-pointer ${
                                    selectedCourses.includes(course._id) 
                                      ? 'bg-sky-50 border-sky-500' 
                                      : course.currentTeacher 
                                        ? course.currentTeacher.teacherId === selectedTeacher?._id
                                          ? 'bg-green-50 border-green-400'
                                          : 'bg-red-50 border-red-300'
                                        : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedCourses.includes(course._id)}
                                    onChange={() => handleCourseToggle(course)}
                                    className="h-4 w-4 text-sky-600 rounded"
                                  />
                                  <span className="ml-2 text-sm text-gray-700 flex-1">
                                    {course.name} ({course.code})
                                  </span>
                                  {course.currentTeacher && course.currentTeacher.teacherId !== selectedTeacher?._id && (
                                    <span className="text-xs text-red-600 ml-2">
                                      {course.currentTeacher.teacherName}
                                    </span>
                                  )}
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                
                {selectedTeacher && selectedTrades.length > 0 && selectedLevels.length > 0 && filteredCourses.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <button
                      onClick={handleAssignCourses}
                      disabled={selectedCourses.length === 0}
                      className={`w-full py-2 px-4 rounded-md font-medium ${
                        selectedCourses.length > 0
                          ? 'bg-sky-600 text-white hover:bg-sky-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {selectedCourses.length > 0 
                        ? `Assign ${selectedCourses.length} Course${selectedCourses.length > 1 ? 's' : ''}`
                        : 'Select Courses to Assign'
                      }
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold text-red-600 mb-2">Course Already Assigned</h3>
            <p className="text-gray-700 mb-4">
              <strong>{showWarning.courseName}</strong> is already assigned to <strong>{showWarning.currentTeacher}</strong>.
            </p>
            <p className="text-gray-600 mb-4">
              Do you want to replace them with this teacher?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowWarning(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const course = courses.find(c => c._id === showWarning.courseId);
                  if (course) confirmCourseSelection(course);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
