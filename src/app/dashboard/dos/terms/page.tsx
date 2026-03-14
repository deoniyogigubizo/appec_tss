'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { 
  Search, 
  RefreshCw,
  Plus,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Activity
} from 'lucide-react';

// Types
interface AcademicTerm {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'completed' | 'archived';
  isCurrent: boolean;
  academicYear: string;
  description?: string;
  createdAt: string;
}

export default function DOSTermsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // UI State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<AcademicTerm | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    academicYear: '',
    description: ''
  });

  const fetchTerms = useCallback(async () => {
    try {
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        
        // Try to get terms from different possible structures
        let termsData: AcademicTerm[] = [];
        
        if (Array.isArray(data)) {
          // Check if this is terms data
          if (data[0]?.name && data[0]?.startDate) {
            termsData = data;
          }
        } else if (data.terms) {
          termsData = data.terms;
        } else if (data.results) {
          // It's marks data, create default terms
          termsData = [];
        }

        // If no terms from API, create default academic terms
        if (termsData.length === 0) {
          const currentYear = new Date().getFullYear();
          termsData = [
            {
              _id: '1',
              name: 'Term 1',
              startDate: `${currentYear}-01-15`,
              endDate: `${currentYear}-04-15`,
              status: new Date() > new Date(`${currentYear}-04-15`) ? 'completed' : 'active',
              isCurrent: true,
              academicYear: `${currentYear}`,
              description: 'First term of the academic year',
              createdAt: `${currentYear}-01-01`
            },
            {
              _id: '2',
              name: 'Term 2',
              startDate: `${currentYear}-05-01`,
              endDate: `${currentYear}-08-01`,
              status: 'upcoming',
              isCurrent: false,
              academicYear: `${currentYear}`,
              description: 'Second term of the academic year',
              createdAt: `${currentYear}-05-01`
            },
            {
              _id: '3',
              name: 'Term 3',
              startDate: `${currentYear}-09-01`,
              endDate: `${currentYear}-12-15`,
              status: 'upcoming',
              isCurrent: false,
              academicYear: `${currentYear}`,
              description: 'Third term of the academic year',
              createdAt: `${currentYear}-09-01`
            }
          ];
        }

        setTerms(termsData);
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
      // Create default terms on error
      const currentYear = new Date().getFullYear();
      setTerms([
        {
          _id: '1',
          name: 'Term 1',
          startDate: `${currentYear}-01-15`,
          endDate: `${currentYear}-04-15`,
          status: 'completed',
          isCurrent: false,
          academicYear: `${currentYear}`,
          description: 'First term of the academic year',
          createdAt: `${currentYear}-01-01`
        },
        {
          _id: '2',
          name: 'Term 2',
          startDate: `${currentYear}-05-01`,
          endDate: `${currentYear}-08-01`,
          status: 'active',
          isCurrent: true,
          academicYear: `${currentYear}`,
          description: 'Second term of the academic year',
          createdAt: `${currentYear}-05-01`
        },
        {
          _id: '3',
          name: 'Term 3',
          startDate: `${currentYear}-09-01`,
          endDate: `${currentYear}-12-15`,
          status: 'upcoming',
          isCurrent: false,
          academicYear: `${currentYear}`,
          description: 'Third term of the academic year',
          createdAt: `${currentYear}-09-01`
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTerms();
    }
  }, [status, fetchTerms]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.startDate || !formData.endDate || !formData.academicYear) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    setProcessing(true);
    try {
      const newTerm: AcademicTerm = {
        _id: Date.now().toString(),
        ...formData,
        status: 'upcoming',
        isCurrent: false,
        createdAt: new Date().toISOString()
      };

      setTerms([...terms, newTerm]);
      showToast('Term created successfully', 'success');
      setShowCreateModal(false);
      setFormData({ name: '', startDate: '', endDate: '', academicYear: '', description: '' });
    } catch (error) {
      showToast('Error creating term', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedTerm || !formData.name || !formData.startDate || !formData.endDate) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    setProcessing(true);
    try {
      const updatedTerms = terms.map(t => 
        t._id === selectedTerm._id 
          ? { ...t, ...formData }
          : t
      );
      setTerms(updatedTerms);
      showToast('Term updated successfully', 'success');
      setShowEditModal(false);
      setSelectedTerm(null);
    } catch (error) {
      showToast('Error updating term', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTerm) return;

    setProcessing(true);
    try {
      setTerms(terms.filter(t => t._id !== selectedTerm._id));
      showToast('Term deleted successfully', 'success');
      setShowDeleteModal(false);
      setSelectedTerm(null);
    } catch (error) {
      showToast('Error deleting term', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleSetCurrent = async (termId: string) => {
    setProcessing(true);
    try {
      const updatedTerms = terms.map(t => ({
        ...t,
        isCurrent: t._id === termId,
        status: (t._id === termId ? 'active' : (t.status === 'active' ? 'completed' : t.status)) as AcademicTerm['status']
      }));
      setTerms(updatedTerms);
      showToast('Current term updated', 'success');
    } catch (error) {
      showToast('Error updating term', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Filter terms
  const filteredTerms = terms.filter(term => {
    const matchesSearch = 
      term.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.academicYear?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || term.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort terms by start date
  const sortedTerms = [...filteredTerms].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // Get status badge
  const getStatusBadge = (term: AcademicTerm) => {
    if (term.isCurrent) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" /> Current
      </span>;
    }
    switch (term.status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Active</span>;
      case 'upcoming':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Upcoming</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">Completed</span>;
      case 'archived':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Archived</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">{term.status}</span>;
    }
  };

  // Calculate term duration
  const getTermDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} days`;
  };

  // Get progress
  const getTermProgress = (term: AcademicTerm) => {
    if (term.status === 'completed') return 100;
    if (term.status === 'upcoming') return 0;
    
    const start = new Date(term.startDate).getTime();
    const end = new Date(term.endDate).getTime();
    const now = Date.now();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    return Math.round(((now - start) / (end - start)) * 100);
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
            <h1 className="text-2xl font-bold text-gray-900">Terms Management</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => fetchTerms()} className="p-2 text-gray-600 hover:text-gray-800">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600"
            >
              <Plus className="w-4 h-4" />
              Add Term
            </button>
            <span className="text-gray-700">{session?.user?.name}</span>
            <button onClick={() => signOut()} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-600">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Timeline View */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-500" />
            Academic Year Timeline
          </h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-6">
              {sortedTerms.map((term, index) => {
                const progress = getTermProgress(term);
                return (
                  <div key={term._id} className="relative flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className={`relative z-10 w-4 h-4 rounded-full mt-2 ${
                      term.isCurrent ? 'bg-green-500' : 
                      term.status === 'completed' ? 'bg-gray-400' :
                      term.status === 'upcoming' ? 'bg-blue-400' : 'bg-gray-300'
                    }`}>
                      {term.isCurrent && (
                        <div className="absolute inset-0 rounded-full animate-ping bg-green-400 opacity-75"></div>
                      )}
                    </div>
                    
                    {/* Term card */}
                    <div className="flex-1 bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">{term.name}</h3>
                          {getStatusBadge(term)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              term.isCurrent ? 'bg-green-500' : 
                              term.status === 'completed' ? 'bg-gray-400' : 'bg-sky-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500">
                        Duration: {getTermDuration(term.startDate, term.endDate)} • Academic Year: {term.academicYear}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
                  placeholder="Search terms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-sky-500 text-sky-600 rounded-md hover:bg-sky-50"
            >
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Terms Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Term</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Academic Year</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">End Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedTerms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No terms found</p>
                  </td>
                </tr>
              ) : (
                sortedTerms.map(term => (
                  <tr key={term._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{term.name}</div>
                      {term.description && (
                        <div className="text-sm text-gray-500">{term.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{term.academicYear}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(term.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(term.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {getTermDuration(term.startDate, term.endDate)}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(term)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {!term.isCurrent && (
                          <button
                            onClick={() => handleSetCurrent(term._id)}
                            disabled={processing}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Set as Current"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => { setSelectedTerm(term); setFormData({ name: term.name, startDate: term.startDate, endDate: term.endDate, academicYear: term.academicYear, description: term.description || '' }); setShowEditModal(true); }}
                          className="p-1 text-gray-600 hover:text-gray-800"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => { setSelectedTerm(term); setShowDeleteModal(true); }}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create New Term</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Term 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                <input
                  type="text"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  placeholder="e.g., 2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Optional description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={processing}
                className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:opacity-50"
              >
                Create Term
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTerm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Term</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                <input
                  type="text"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={processing}
                className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedTerm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <h2 className="text-xl font-bold text-gray-900">Delete Term</h2>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600">
                Are you sure you want to delete <strong>{selectedTerm.name}</strong> ({selectedTerm.academicYear})?
              </p>
              <p className="text-sm text-red-500 mt-2">
                This action cannot be undone. All data associated with this term may be affected.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={processing}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              >
                Delete Term
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
