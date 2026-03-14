'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Mark {
  assessment: string;
  score: number;
  maxScore: number;
}

interface CourseResult {
  _id: string;
  courseName: string;
  courseCode: string;
  credits: number;
  marks: Mark[];
  totalScore: number;
  grade: string;
  published: boolean;
}

interface TermData {
  name: string;
  isActive: boolean;
  results: CourseResult[];
}

export default function StudentResults() {
  const { data: session } = useSession();
  const [terms, setTerms] = useState<TermData[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [currentResults, setCurrentResults] = useState<CourseResult[]>([]);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  useEffect(() => {
    async function fetchResults() {
      try {
        const response = await fetch('/api/student/results');
        if (response.ok) {
          const data = await response.json();
          setTerms(data.terms);
          if (data.terms.length > 0) {
            // Find active term or first term with published results
            const activeTerm = data.terms.find((t: TermData) => t.isActive);
            const publishedTerm = data.terms.find((t: TermData) => t.results.some((r: CourseResult) => r.published));
            const termToSelect = activeTerm || publishedTerm || data.terms[0];
            setSelectedTerm(termToSelect.name);
            setCurrentResults(termToSelect.results);
          }
        }
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, []);

  const handleTermChange = (termName: string) => {
    setSelectedTerm(termName);
    const term = terms.find(t => t.name === termName);
    if (term) {
      setCurrentResults(term.results);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade.charAt(0)) {
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'B':
        return 'bg-sky-100 text-sky-800';
      case 'C':
        return 'bg-yellow-100 text-yellow-800';
      case 'D':
        return 'bg-orange-100 text-orange-800';
      case 'F':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateGPA = (results: CourseResult[]) => {
    if (results.length === 0) return 0;
    
    const gradePoints: { [key: string]: number } = {
      'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'D-': 0.7,
      'F': 0.0
    };

    let totalPoints = 0;
    let totalCredits = 0;

    results.forEach(result => {
      const gradePoint = gradePoints[result.grade] || 0;
      totalPoints += gradePoint * result.credits;
      totalCredits += result.credits;
    });

    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  };

  const publishedCount = currentResults.filter(r => r.published).length;
  const totalMarks = currentResults.reduce((sum, r) => sum + r.totalScore, 0);
  const averageScore = publishedCount > 0 ? (totalMarks / publishedCount).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="min-h-screen bg-antiquewhite">
        <header className="bg-sky-500 shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-white">APPEC TSS - Student Portal</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-antiquewhite">
      {/* Header */}
      <header className="bg-sky-500 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">APPEC TSS - Student Portal</h1>
            <p className="text-sky-100 text-sm mt-1">Academic Results</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/student"
              className="text-white hover:text-sky-200 flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 px-4">
        {/* Term Selector */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center">
              <label className="text-gray-700 font-medium mr-3">Select Term:</label>
              <select
                value={selectedTerm}
                onChange={(e) => handleTermChange(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {terms.map((term) => (
                  <option 
                    key={term.name} 
                    value={term.name}
                    disabled={!term.results.some(r => r.published)}
                  >
                    {term.name} {!term.results.some(r => r.published) ? '(Not Available)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDownloadModal(true)}
                disabled={publishedCount === 0}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </button>
              <button
                disabled={publishedCount === 0}
                className="bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-sky-500">
            <p className="text-sm text-gray-500">Current GPA</p>
            <p className="text-3xl font-bold text-gray-900">{calculateGPA(currentResults)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Average Score</p>
            <p className="text-3xl font-bold text-gray-900">{averageScore}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
            <p className="text-sm text-gray-500">Subjects</p>
            <p className="text-3xl font-bold text-gray-900">{publishedCount}/{currentResults.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
            <p className="text-sm text-gray-500">Total Credits</p>
            <p className="text-3xl font-bold text-gray-900">
              {currentResults.reduce((sum, r) => sum + r.credits, 0)}
            </p>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-md border-2 border-transparent hover:border-sky-400 transition-all overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Current Term Results
            </h2>
          </div>

          {publishedCount === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Available</h3>
              <p className="text-gray-500">Results for this term have not been published yet. Please check back later.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentResults.map((result, index) => (
                    <tr key={result._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.courseName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.courseCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.credits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.marks.map((m, i) => (
                          <div key={i} className="text-xs">
                            {m.assessment}: {m.score}/{m.maxScore}
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.totalScore}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(result.grade)}`}>
                          {result.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.published ? (
                          <span className="inline-flex items-center text-green-600 text-sm">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Published
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Performance Chart */}
        {publishedCount > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-md border-2 border-transparent hover:border-sky-400 transition-all p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Performance by Subject
            </h2>
            <div className="h-64 flex items-end justify-around gap-2">
              {currentResults.filter(r => r.published).map((result, index) => {
                const percentage = (result.totalScore / 100) * 100;
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="w-full bg-gray-200 rounded-t-md relative" style={{ height: '200px' }}>
                      <div 
                        className={`absolute bottom-0 w-full rounded-t-md transition-all ${percentage >= 70 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ height: `${percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 text-center truncate w-full">{result.courseCode}</p>
                    <p className="text-xs font-medium text-gray-900">{result.totalScore}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Download Modal */}
        {showDownloadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Download Transcript</h3>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                Your official transcript will include your personal details, all published results, and a unique verification code.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center mb-4">
                  <svg className="w-16 h-16 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-center text-sm text-gray-600">
                  PDF includes: Student Details, Course Results, GPA, School Logo, and QR Verification Code
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
