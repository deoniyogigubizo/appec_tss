'use client';

import Link from 'next/link';
import { 
  GraduationCap, 
  Users, 
  Shield, 
  BookOpen, 
  UserCog,
  Headphones
} from 'lucide-react';

const roles = [
  {
    title: 'Student Portal',
    description: 'View results, manage profile, and track academic progress',
    href: '/dashboard/student',
    icon: GraduationCap,
    color: 'from-teal-500 to-cyan-600',
  },
  {
    title: 'Teacher Portal',
    description: 'Enter marks, manage classes, and track student performance',
    href: '/dashboard/teacher',
    icon: BookOpen,
    color: 'from-blue-500 to-indigo-600',
  },
  {
    title: 'Secretary Portal',
    description: 'Manage users, courses, and verify student registrations',
    href: '/dashboard/secretary',
    icon: UserCog,
    color: 'from-purple-500 to-pink-600',
  },
  {
    title: 'DOS Portal',
    description: 'Approve marks, publish results, and manage academic operations',
    href: '/dashboard/dos',
    icon: Users,
    color: 'from-orange-500 to-red-600',
  },
  {
    title: 'DOD Portal',
    description: 'Manage discipline records and student behavior',
    href: '/dashboard/dod',
    icon: Shield,
    color: 'from-yellow-500 to-amber-600',
  },
  {
    title: 'HOD Portal',
    description: 'Full oversight of all system activities and reports',
    href: '/dashboard/hod',
    icon: Headphones,
    color: 'from-green-500 to-emerald-600',
  },
];

export default function RoleCards() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {roles.map((role) => (
        <Link
          key={role.title}
          href={role.href}
          className="group bg-white rounded-xl border border-green-200 p-6 hover:shadow-xl hover:border-teal-300 transition-all"
        >
          <div className={`w-14 h-14 bg-gradient-to-br ${role.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            <role.icon className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-bold text-black mb-2 group-hover:text-teal-600 transition-colors">
            {role.title}
          </h3>
          <p className="text-black/70 text-sm">
            {role.description}
          </p>
        </Link>
      ))}
    </div>
  );
}
