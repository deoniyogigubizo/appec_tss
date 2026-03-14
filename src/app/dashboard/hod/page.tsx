'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function HODDashboard() {
  const { data: session } = useSession();

  const menuItems = [
    { title: 'System Overview', href: '/dashboard/hod/overview', description: 'Overview of all system activities' },
    { title: 'All Students', href: '/dashboard/hod/students', description: 'View all student records' },
    { title: 'All Teachers', href: '/dashboard/hod/teachers', description: 'View all teacher information' },
    { title: 'Academic Records', href: '/dashboard/hod/academic-records', description: 'Monitor academic marks and results' },
    { title: 'Discipline Records', href: '/dashboard/hod/discipline-records', description: 'Monitor discipline records' },
    { title: 'Audit Logs', href: '/dashboard/hod/audit', description: 'View system activity logs' },
  ];

  return (
    <div className="min-h-screen bg-antiquewhite">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            APPEC TSS - Head of Department (HOD) Dashboard
          </h1>
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
            Full Oversight Privileges
          </h2>
          <p className="text-gray-600 mt-2">
            You have read-only access to all system data for monitoring and ensuring transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block p-6 bg-white rounded-lg border-2 border-sky-300 hover:border-sky-500 hover:shadow-lg transition-all"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {item.title}
              </h2>
              <p className="text-gray-600">{item.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
