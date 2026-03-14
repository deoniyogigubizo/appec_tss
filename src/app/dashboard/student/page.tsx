'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function StudentDashboard() {
  const { data: session } = useSession();

  const menuItems = [
    { title: 'My Profile', href: '/dashboard/student/profile', description: 'View your profile information' },
    { title: 'Academic Results', href: '/dashboard/student/results', description: 'View your published academic results' },
    { title: 'Discipline Record', href: '/dashboard/student/discipline', description: 'View your discipline record' },
  ];

  return (
    <div className="min-h-screen bg-antiquewhite">
      <header className="bg-sky-500 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">
            APPEC TSS - Student Portal
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-white">{session?.user?.name}</span>
            <button
              onClick={() => signOut()}
              className="bg-white text-sky-600 px-4 py-2 rounded-md hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {session?.user?.name}!
          </h2>
          <p className="text-gray-600">
            Access your academic records, results, and discipline information.
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
