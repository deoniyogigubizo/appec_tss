'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function DODDashboard() {
  const { data: session } = useSession();

  const menuItems = [
    { title: 'Discipline Records', href: '/dashboard/dod/records', description: 'Enter and manage discipline marks' },
    { title: 'Search Student', href: '/dashboard/dod/search', description: 'Find students by registration number or name' },
    { title: 'Discipline Overview', href: '/dashboard/dod/overview', description: 'View summary of discipline records' },
  ];

  return (
    <div className="min-h-screen bg-antiquewhite">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            APPEC TSS - Director of Discipline (DOD) Dashboard
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
