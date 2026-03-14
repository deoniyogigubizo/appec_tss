'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Incident {
  date: Date;
  description: string;
  points: number;
  enteredBy: string;
  feedback?: string;
}

interface DisciplineData {
  _id: string;
  term: string;
  incidents: Incident[];
  totalPoints: number;
}

export default function StudentDiscipline() {
  const { data: session } = useSession();
  const [disciplineData, setDisciplineData] = useState<DisciplineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'term' | 'cumulative'>('term');
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    async function fetchDiscipline() {
      try {
        const response = await fetch('/api/student/discipline');
        if (response.ok) {
          const data = await response.json();
          setDisciplineData(data.discipline);
        }
      } catch (error) {
        console.error('Error fetching discipline data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDiscipline();
  }, []);

  const getStatus = (points: number) => {
    if (points >= 50) return { label: 'Excellent Standing', color: 'bg-green-100 text-green-800', icon: '🏆' };
    if (points >= 20) return { label: 'Good Standing', color: 'bg-sky-100 text-sky-800', icon: '✅' };
    if (points >= 0) return { label: 'Satisfactory', color: 'bg-yellow-100 text-yellow-800', icon: '📊' };
    return { label: 'Probation', color: 'bg-red-100 text-red-800', icon: '⚠️' };
  };

  const getCurrentTermPoints = () => {
    const activeTerm = disciplineData.find(d => d.term === 'Current Term');
    return activeTerm ? activeTerm.totalPoints : 0;
  };

  const getCumulativePoints = () => {
    return disciplineData.reduce((sum, d) => sum + d.totalPoints, 0);
  };

  const currentPoints = viewMode === 'term' ? getCurrentTermPoints() : getCumulativePoints();
  const status = getStatus(currentPoints);

  const getAllIncidents = () => {
    if (viewMode === 'term') {
      const activeTerm = disciplineData.find(d => d.term === 'Current Term');
      return activeTerm?.incidents || [];
    }
    return disciplineData.flatMap(d => d.incidents).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const incidents = getAllIncidents();
  const positivePoints = incidents.filter(i => i.points > 0).reduce((sum, i) => sum + i.points, 0);
  const negativePoints = incidents.filter(i => i.points < 0).reduce((sum, i) => sum + Math.abs(i.points), 0);

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
            <div className="h-32 bg-gray-200 rounded-lg"></div>
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
            <p className="text-sky-100 text-sm mt-1">Discipline Record</p>
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
        {/* View Mode Toggle */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">View Mode:</span>
              <div className="flex rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode('term')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    viewMode === 'term' 
                      ? 'bg-sky-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Current Term
                </button>
                <button
                  onClick={() => setViewMode('cumulative')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    viewMode === 'cumulative' 
                      ? 'bg-sky-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Time
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Your discipline record is visible only to you, DOD, DOS, and HOD
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${status.color.split(' ')[0].replace('bg-', 'border-')}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-xl font-bold text-gray-900">{status.icon} {status.label}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-sky-500">
            <p className="text-sm text-gray-500">Total Points</p>
            <p className="text-3xl font-bold text-gray-900">{currentPoints}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Positive Points</p>
            <p className="text-3xl font-bold text-green-600">+{positivePoints}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
            <p className="text-sm text-gray-500">Points Deducted</p>
            <p className="text-3xl font-bold text-red-600">-{negativePoints}</p>
          </div>
        </div>

        {/* Incidents Table */}
        <div className="bg-white rounded-lg shadow-md border-2 border-transparent hover:border-sky-400 transition-all overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {viewMode === 'term' ? 'Current Term' : 'All'} Incidents
            </h2>
          </div>

          {incidents.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Incidents Recorded</h3>
              <p className="text-gray-500">You have a clean discipline record. Keep it up!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entered By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {incidents.map((incident, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(incident.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{incident.description}</div>
                        {incident.feedback && (
                          <div className="text-xs text-gray-500 mt-1 italic">
                            💬 {incident.feedback}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          incident.points >= 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {incident.points > 0 ? '+' : ''}{incident.points}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {incident.enteredBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {incident.points < 0 && (
                          <button
                            onClick={() => {
                              setSelectedIncident(incident);
                              setShowAppealModal(true);
                            }}
                            className="text-sky-500 hover:text-sky-700 text-sm font-medium flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            Appeal
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Behavior Trends Chart */}
        {disciplineData.length > 1 && (
          <div className="mt-6 bg-white rounded-lg shadow-md border-2 border-transparent hover:border-sky-400 transition-all p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              Discipline Points Over Time
            </h2>
            <div className="h-48 flex items-end justify-around gap-2">
              {disciplineData.slice().reverse().map((data, index) => {
                const height = Math.max((data.totalPoints + 20) / 80 * 100, 10);
                const color = data.totalPoints >= 20 ? 'bg-green-500' : data.totalPoints >= 0 ? 'bg-yellow-500' : 'bg-red-500';
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="w-full bg-gray-200 rounded-t-md relative" style={{ height: '160px' }}>
                      <div 
                        className={`absolute bottom-0 w-full rounded-t-md transition-all ${color}`}
                        style={{ height: `${height}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 text-center">{data.term}</p>
                    <p className="text-xs font-medium text-gray-900">{data.totalPoints} pts</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Appeal Modal */}
        {showAppealModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Appeal Incident</h3>
                <button
                  onClick={() => setShowAppealModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {selectedIncident && (
                <>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-2"><strong>Incident:</strong></p>
                    <p className="text-gray-900">{selectedIncident.description}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Date: {new Date(selectedIncident.date).toLocaleDateString()} | Points: {selectedIncident.points}
                    </p>
                  </div>
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Appeal</label>
                      <textarea
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        rows={4}
                        placeholder="Explain why you believe this incident should be reviewed..."
                      ></textarea>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowAppealModal(false)}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                      >
                        Submit Appeal
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
