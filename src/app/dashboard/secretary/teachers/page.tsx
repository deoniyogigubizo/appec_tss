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
  phoneNumber: string;
  gender: string;
  address: string;
  isActive: boolean;
  assignedToDos: boolean;
  userId: {
    _id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
}

export default function ManageTeachers() {
  const { data: session } = useSession();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: '',
    department: '',
    phoneNumber: '',
    gender: '',
    address: ''
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers');
      if (response.ok) {
        const data = await response.json();
        setTeachers(data);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const teacherData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      employeeId: formData.employeeId,
      department: formData.department,
      phoneNumber: formData.phoneNumber,
      gender: formData.gender,
      address: formData.address
    };

    try {
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(teacherData)
      });

      if (response.ok) {
        fetchTeachers();
        setShowModal(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create teacher');
      }
    } catch (error) {
      console.error('Error creating teacher:', error);
      alert('Failed to create teacher');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      employeeId: '',
      department: '',
      phoneNumber: '',
      gender: '',
      address: ''
    });
    setEditingTeacher(null);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.userId?.name || '',
      email: teacher.userId?.email || '',
      password: '',
      employeeId: teacher.employeeId,
      department: teacher.department,
      phoneNumber: teacher.phoneNumber || '',
      gender: teacher.gender || '',
      address: teacher.address || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (teacherId: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    
    try {
      const response = await fetch(`/api/teachers?id=${teacherId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchTeachers();
      } else {
        alert('Failed to delete teacher');
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
    }
  };

  return (
    <div className="min-h-screen bg-antiquewhite">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/secretary" className="text-sky-600 hover:text-sky-800">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Manage Teachers
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
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Teacher Management
              </h2>
              <p className="text-gray-600 mt-2">
                Add, edit, and manage teacher accounts
              </p>
            </div>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="bg-sky-600 text-white px-6 py-2 rounded-md hover:bg-sky-700"
            >
              + Add Teacher
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-600">Loading teachers...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg shadow">
            <p className="text-gray-600">No teachers found. Click &quot;Add Teacher&quot; to create one.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teachers.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {teacher.employeeId}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {teacher.userId?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {teacher.isActive ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                          Waiting for Courses
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openEditModal(teacher)}
                        className="text-sky-600 hover:text-sky-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(teacher._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal for Add/Edit Teacher */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
            </h2>
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4 text-sm">
              <p><strong>Note:</strong> After creating a teacher, they will be automatically assigned to DOS. The DOS will assign courses, and only then will the teacher be able to login.</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={!!editingTeacher}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingTeacher ? 'New Password (leave blank to keep current)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingTeacher}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700"
                >
                  {editingTeacher ? 'Update Teacher' : 'Add Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
