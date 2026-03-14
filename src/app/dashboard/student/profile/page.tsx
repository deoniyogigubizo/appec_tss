'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { connectToDatabase } from '@/lib/db/connect';

interface StudentData {
  _id: string;
  registrationNumber: string;
  class: string;
  level: string;
  trade: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  phoneNumber?: string;
  parentName?: string;
  parentPhone?: string;
  admissionLetterStatus: string;
  createdAt: Date;
}

export default function StudentProfile() {
  const { data: session } = useSession();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(0);

  useEffect(() => {
    async function fetchStudentData() {
      try {
        const response = await fetch('/api/student/profile');
        if (response.ok) {
          const data = await response.json();
          setStudentData(data.student);
          calculateProfileCompletion(data.student);
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.email) {
      fetchStudentData();
    }
  }, [session]);

  const calculateProfileCompletion = (data: StudentData) => {
    const fields = [
      data.registrationNumber,
      data.class,
      data.level,
      data.trade,
      data.dateOfBirth,
      data.gender,
      data.address,
      data.phoneNumber,
      data.parentName,
      data.parentPhone,
    ];
    const filledFields = fields.filter(field => field !== undefined && field !== null && field !== '').length;
    setProfileCompletion(Math.round((filledFields / fields.length) * 100));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
            <div className="h-48 bg-gray-200 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
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
            <p className="text-sky-100 text-sm mt-1">My Profile</p>
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
        {/* Profile Completion Indicator */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Profile Completion</h3>
              <p className="text-sm text-gray-600">Keep your profile updated for better service</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-32 bg-gray-200 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${profileCompletion}%` }}
                ></div>
              </div>
              <span className="text-lg font-bold text-gray-800">{profileCompletion}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Personal Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Details Card */}
            <div className="bg-white rounded-lg shadow-md border-2 border-transparent hover:border-sky-400 transition-all p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-gray-900 font-semibold">{session?.user?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email Address</label>
                  <p className="text-gray-900">{session?.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Registration Number</label>
                  <p className="text-gray-900 font-semibold">{studentData?.registrationNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                  <p className="text-gray-900">
                    {studentData?.dateOfBirth
                      ? new Date(studentData.dateOfBirth).toLocaleDateString()
                      : 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Gender</label>
                  <p className="text-gray-900">{studentData?.gender || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                  <p className="text-gray-900">{studentData?.phoneNumber || 'Not set'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900">{studentData?.address || 'Not set'}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Request Profile Update
                </button>
              </div>
            </div>

            {/* Academic Info Card */}
            <div className="bg-white rounded-lg shadow-md border-2 border-transparent hover:border-sky-400 transition-all p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Academic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Current Class</label>
                  <p className="text-gray-900 font-semibold">{studentData?.class || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Level</label>
                  <p className="text-gray-900">{studentData?.level || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Trade/Department</label>
                  <p className="text-gray-900">{studentData?.trade || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Admission Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(studentData?.admissionLetterStatus || 'pending')}`}>
                    {studentData?.admissionLetterStatus === 'confirmed' ? 'Enrolled' : 
                     studentData?.admissionLetterStatus === 'pending' ? 'Pending' : 'Rejected'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Admission Date</label>
                  <p className="text-gray-900">
                    {studentData?.createdAt
                      ? new Date(studentData.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact & Emergency Info Card */}
            <div className="bg-white rounded-lg shadow-md border-2 border-transparent hover:border-sky-400 transition-all p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Contact & Emergency Info
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                  <p className="text-gray-900">{studentData?.phoneNumber || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Parent/Guardian Name</label>
                  <p className="text-gray-900">{studentData?.parentName || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Parent/Guardian Phone</label>
                  <p className="text-gray-900">{studentData?.parentPhone || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900">{studentData?.address || 'Not set'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Profile Picture & Quick Actions */}
          <div className="space-y-6">
            {/* Profile Picture Card */}
            <div className="bg-white rounded-lg shadow-md border-2 border-transparent hover:border-sky-400 transition-all p-6 text-center">
              <div className="w-32 h-32 mx-auto bg-sky-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl font-bold text-sky-600">
                  {session?.user?.name ? getInitials(session.user.name) : '?'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{session?.user?.name}</h3>
              <p className="text-gray-500">{studentData?.registrationNumber || 'N/A'}</p>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(studentData?.admissionLetterStatus || 'pending')}`}>
                  {studentData?.admissionLetterStatus === 'confirmed' ? 'Enrolled' : 
                   studentData?.admissionLetterStatus === 'pending' ? 'Pending' : 'Rejected'}
                </span>
              </div>
            </div>

            {/* QR Code Card */}
            <div className="bg-white rounded-lg shadow-md border-2 border-transparent hover:border-sky-400 transition-all p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-center">
                <svg className="w-5 h-5 mr-2 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Student QR Code
              </h3>
              <div className="flex justify-center">
                <div className="bg-white p-2 border-2 border-gray-200 rounded-lg">
                  {/* QR Code Placeholder - In production, use a QR code library */}
                  <div className="w-40 h-40 bg-gray-100 flex items-center justify-center">
                    <svg className="w-24 h-24 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-gray-500 mt-3">
                Scan to quickly access student record
              </p>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-lg shadow-md border-2 border-transparent hover:border-sky-400 transition-all p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Request Profile Update
                </button>
                <button
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Request Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Request Profile Update</h3>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                Your request will be sent to the secretary for review. Please specify what changes you need.
              </p>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field to Update</label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <option>Select a field</option>
                    <option>Phone Number</option>
                    <option>Address</option>
                    <option>Parent/Guardian Info</option>
                    <option>Date of Birth</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Value</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Enter new value"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    rows={3}
                    placeholder="Explain why you need this update"
                  ></textarea>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
