'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { 
  Search, 
  RefreshCw,
  CheckCircle,
  Eye,
  FileText,
  Clock,
  BookOpen,
  Users,
  Download,
  Send,
  RotateCcw,
  AlertTriangle
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
  publishedAt?: string;
  publishedBy?: string;
  createdAt: string;
}

interface PublishLog {
  _id: string;
  course: string;
  term: string;
  level: string;
  trade: string;
  action: 'published' | 'rolled_back';
  count: number;
  performedBy: string;
  performedAt: string;
  notes?: string;
}

interface Stats {
  readyToPublish: number;
  published: number;
  rolledBack: number;
}

export default function DOSPublishPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [marks, setMarks] = useState<AcademicMark[]>([]);
  const [publishLogs, setPublishLogs] = useState<PublishLog[]>([]);
  const [stats, setStats] = useState<Stats>({ readyToPublish: 0, published: 0, rolledBack: 0 });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [termFilter, setTermFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  
  // UI State
  const [selectedGroup, setSelectedGroup] = useState<{course: string; term: string; level: string; trade: string} | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ready' | 'published' | 'history'>('ready');
  const [publishNote, setPublishNote] = useState('');
  const [rollbackReason, setRollbackReason] = useState('');

  // Get unique groups ready to publish
  const getReadyToPublishGroups = useCallback(() => {
    const approvedMarks = marks.filter(m => m.status === 'approved');
    const groups: Record<string, AcademicMark[]> = {};
    
    approvedMarks.forEach(mark => {
      const key = `${mark.course}-${mark.term}-${mark.level}-${mark.trade}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(mark);
    });
    
    return Object.entries(groups).map(([key, groupMarks]) => ({
      key,
      course: groupMarks[0].course,
      term: groupMarks[0].term,
      level: groupMarks[0].level,
      trade: groupMarks[0].trade,
      count: groupMarks.length,
      totalMarks: groupMarks.reduce((sum, m) => sum + ((m.marks?.midterm || 0) + (m.marks?.finalExam || 0) + (m.marks?.labWork || 0)), 0)
    }));
  }, [marks]);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/student/results');
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
        const readyToPublish = marksData.filter(m => m.status === 'approved').length;
        const published = marksData.filter(m => m.status === 'published').length;
        
        setStats({
          readyToPublish,
          published,
          rolledBack: 0
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
    }
  }, [status, fetchData]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Publish marks
  const handlePublish = async () => {
    if (!selectedGroup || !publishNote) return;
    
    setProcessing(true);
    try {
      const groupMarks = marks.filter(m => 
        m.status === 'approved' &&
        m.course === selectedGroup.course &&
        m.term === selectedGroup.term &&
        m.level === selectedGroup.level &&
        m.trade === selectedGroup.trade
      );

      for (const mark of groupMarks) {
        await fetch(`/api/student/results?id=${mark._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'published', 
            publishedAt: new Date().toISOString(),
            publishedBy: session?.user?.name
          })
        });
      }

      const logEntry: PublishLog = {
        _id: Date.now().toString(),
        course: selectedGroup.course,
        term: selectedGroup.term,
        level: selectedGroup.level,
        trade: selectedGroup.trade,
        action: 'published',
        count: groupMarks.length,
        performedBy: session?.user?.name || 'DOS',
        performedAt: new Date().toISOString(),
        notes: publishNote
      };
      
      setPublishLogs(prev => [logEntry, ...prev]);
      showToast(`Published ${groupMarks.length} marks successfully`, 'success');
      
      setShowPublishModal(false);
      setPublishNote('');
      setSelectedGroup(null);
      fetchData();
    } catch (error) {
      showToast('Error publishing marks', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Rollback marks
  const handleRollback = async () => {
    if (!selectedGroup || !rollbackReason) return;
    
    setProcessing(true);
    try {
      const groupMarks = marks.filter(m => 
        m.status === 'published' &&
        m.course === selectedGroup.course &&
        m.term === selectedGroup.term &&
        m.level === selectedGroup.level &&
        m.trade === selectedGroup.trade
      );

      for (const mark of groupMarks) {
        await fetch(`/api/student/results?id=${mark._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'approved',
            rolledBackAt: new Date().toISOString(),
            rolledBackBy: session?.user?.name,
            rollbackReason
          })
        });
      }

      const logEntry: PublishLog = {
        _id: Date.now().toString(),
        course: selectedGroup.course,
        term: selectedGroup.term,
        level: selectedGroup.level,
        trade: selectedGroup.trade,
        action: 'rolled_back',
        count: groupMarks.length,
        performedBy: session?.user?.name || 'DOS',
        performedAt: new Date().toISOString(),
        notes: rollbackReason
      };
      
      setPublishLogs(prev => [logEntry, ...prev]);
      showToast(`Rolled back ${groupMarks.length} marks`, 'success');
      
      setShowRollbackModal(false);
      setRollbackReason('');
      setSelectedGroup(null);
      fetchData();
    } catch (error) {
      showToast('Error rolling back marks', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const readyToPublishGroups = getReadyToPublishGroups();
  
  const publishedGroups = marks.filter(m => m.status === 'published');
  const publishedUniqueGroups = [...new Set(publishedGroups.map(m => `${m.course}-${m.term}-${m.level}-${m.trade}`))].map(key => {
    const [course, term, level, trade] = key.split('-');
    const groupMarks = publishedGroups.filter(m => m.course === course && m.term === term && m.level === level && m.trade === trade);
    return {
      key,
      course,
      term,
      level,
      trade,
      count: groupMarks.length,
      publishedAt: groupMarks[0].publishedAt,
      publishedBy: groupMarks[0].publishedBy
    };
  });

  // Preview data
  const previewMarks = selectedGroup ? marks.filter(m => 
    m.course === selectedGroup.course &&
    m.term === selectedGroup.term &&
    m.level === selectedGroup.level &&
    m.trade === selectedGroup.trade &&
    (activeTab === 'ready' ? m.status === 'approved' : m.status === 'published')
  ) : [];

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
            <h1 className="text-2xl font-bold text-gray-900">Publish Marks</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => fetchData()} className="p-2 text-gray-600 hover:text-gray-800">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
              <Download className="w-4 h-4" />
              Export Log
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div 
            onClick={() => setActiveTab('ready')}
            className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md ${activeTab === 'ready' ? 'ring-2 ring-yellow-500' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{readyToPublishGroups.length}</div>
                <div className="text-sm text-gray-500">Ready to Publish</div>
              </div>
            </div>
          </div>
          <div 
            onClick={() => setActiveTab('published')}
            className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md ${activeTab === 'published' ? 'ring-2 ring-green-500' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{publishedUniqueGroups.length}</div>
                <div className="text-sm text-gray-500">Published Groups</div>
              </div>
            </div>
          </div>
          <div 
            onClick={() => setActiveTab('history')}
            className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md ${activeTab === 'history' ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{publishLogs.length || 0}</div>
                <div className="text-sm text-gray-500">Actions Log</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-4">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('ready')}
              className={`px-6 py-3 font-medium ${activeTab === 'ready' ? 'border-b-2 border-yellow-500 text-yellow-600' : 'text-gray-500'}`}
            >
              Ready to Publish ({readyToPublishGroups.length})
            </button>
            <button
              onClick={() => setActiveTab('published')}
              className={`px-6 py-3 font-medium ${activeTab === 'published' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500'}`}
            >
              Published ({publishedUniqueGroups.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 font-medium ${activeTab === 'history' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Publication History
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
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
            
            <select
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Terms</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Levels</option>
              <option value="L3">Level 3</option>
              <option value="L4">Level 4</option>
              <option value="L5">Level 5</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'ready' && (
          <div className="space-y-4">
            {readyToPublishGroups.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-300" />
                <p>No marks ready to publish. All approved marks have been published.</p>
              </div>
            ) : (
              readyToPublishGroups
                .filter(g => 
                  (termFilter === 'all' || g.term === termFilter) &&
                  (levelFilter === 'all' || g.level === levelFilter) &&
                  (searchTerm === '' || g.course.toLowerCase().includes(searchTerm.toLowerCase()))
                )
                .map(group => (
                  <div key={group.key} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <BookOpen className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{group.course}</h3>
                          <div className="text-sm text-gray-500 flex gap-3">
                            <span>{group.term}</span>
                            <span>•</span>
                            <span>{group.level}</span>
                            <span>•</span>
                            <span>{group.trade}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-sky-600">{group.count}</div>
                          <div className="text-xs text-gray-500">Students</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setSelectedGroup(group); setShowPreviewModal(true); }}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                            title="Preview"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => { setSelectedGroup(group); setShowPublishModal(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                          >
                            <Send className="w-4 h-4" />
                            Publish
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === 'published' && (
          <div className="space-y-4">
            {publishedUniqueGroups.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No marks have been published yet.</p>
              </div>
            ) : (
              publishedUniqueGroups
                .filter(g => 
                  (termFilter === 'all' || g.term === termFilter) &&
                  (levelFilter === 'all' || g.level === levelFilter) &&
                  (searchTerm === '' || g.course.toLowerCase().includes(searchTerm.toLowerCase()))
                )
                .map(group => (
                  <div key={group.key} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{group.course}</h3>
                          <div className="text-sm text-gray-500 flex gap-3">
                            <span>{group.term}</span>
                            <span>•</span>
                            <span>{group.level}</span>
                            <span>•</span>
                            <span>{group.trade}</span>
                          </div>
                          {group.publishedAt && (
                            <div className="text-xs text-gray-400 mt-1">
                              Published {new Date(group.publishedAt).toLocaleDateString()} by {group.publishedBy}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">{group.count}</div>
                          <div className="text-xs text-gray-500">Students</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setSelectedGroup(group); setShowPreviewModal(true); }}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                            title="View"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => { setSelectedGroup(group); setShowRollbackModal(true); }}
                            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Rollback
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Details</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Count</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Performed By</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {publishLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No publication history yet
                    </td>
                  </tr>
                ) : (
                  publishLogs.map(log => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          log.action === 'published' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {log.action === 'published' ? 'Published' : 'Rolled Back'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{log.course}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{log.term}</div>
                        <div className="text-xs text-gray-400">{log.level} - {log.trade}</div>
                      </td>
                      <td className="px-4 py-3">{log.count}</td>
                      <td className="px-4 py-3 text-gray-600">{log.performedBy}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(log.performedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{log.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Preview Modal */}
      {showPreviewModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Preview Marks</h2>
                <p className="text-gray-500">{selectedGroup.course} - {selectedGroup.term} - {selectedGroup.level} - {selectedGroup.trade}</p>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Student</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Reg. No</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Midterm</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Final</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Lab</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {previewMarks.map(mark => {
                    const total = (mark.marks?.midterm || 0) + (mark.marks?.finalExam || 0) + (mark.marks?.labWork || 0);
                    return (
                      <tr key={mark._id}>
                        <td className="px-3 py-2 font-medium">{mark.studentName}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{mark.registrationNumber}</td>
                        <td className="px-3 py-2 text-center">{mark.marks?.midterm ?? '-'}</td>
                        <td className="px-3 py-2 text-center">{mark.marks?.finalExam ?? '-'}</td>
                        <td className="px-3 py-2 text-center">{mark.marks?.labWork ?? '-'}</td>
                        <td className="px-3 py-2 text-center font-bold text-sky-600">{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {showPublishModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">Publish Marks</h2>
              <button onClick={() => setShowPublishModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            
            <div className="mb-4">
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-gray-600">You are about to publish marks for:</p>
                <p className="font-semibold">{selectedGroup.course}</p>
                <p className="text-sm text-gray-500">{selectedGroup.term} - {selectedGroup.level} - {selectedGroup.trade}</p>
                <p className="text-sm text-gray-500">{previewMarks.length} students</p>
              </div>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Publication Note (optional)
              </label>
              <textarea
                value={publishNote}
                onChange={(e) => setPublishNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Add a note about this publication..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Publish Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rollback Modal */}
      {showRollbackModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h2 className="text-xl font-bold text-gray-900">Rollback Marks</h2>
              </div>
              <button onClick={() => setShowRollbackModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            
            <div className="mb-4">
              <div className="bg-red-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-red-600">Warning: This will revert published marks back to approved status. Students will no longer be able to view these marks.</p>
                <p className="font-semibold mt-2">{selectedGroup.course}</p>
                <p className="text-sm text-gray-500">{selectedGroup.term} - {selectedGroup.level} - {selectedGroup.trade}</p>
              </div>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rollback (required)
              </label>
              <textarea
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Explain why these marks are being rolled back..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRollbackModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRollback}
                disabled={!rollbackReason || processing}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                Rollback
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
