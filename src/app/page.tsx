'use client';

import Link from 'next/link';
import { useState } from 'react';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Shield, 
  ArrowRight,
  Building,
  Calendar,
  Mail,
  Phone,
  Clock,
  Bell,
  Search,
  ChevronRight,
  X,
  Menu,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  HelpCircle,
  Lock,
  UserPlus,
  AlertCircle
} from 'lucide-react';

// Mock announcements data (would come from MongoDB in production)
const announcements = [
  { id: 1, title: 'Mid-term results to be published on Feb 25th', date: 'Feb 17, 2026' },
  { id: 2, title: 'Staff meeting scheduled for Feb 20th at 2:00 PM', date: 'Feb 17, 2026' },
  { id: 3, title: 'College closed on Feb 22nd for national holiday', date: 'Feb 16, 2026' },
  { id: 4, title: 'New discipline guidelines effective from March 1st', date: 'Feb 15, 2026' },
  { id: 5, title: 'Fee payment deadline extended to Feb 28th', date: 'Feb 14, 2026' },
];

// Mock calendar events
const calendarEvents = [
  { id: 1, date: '20', month: 'Feb', title: 'Staff Meeting', type: 'meeting', color: 'bg-sky' },
  { id: 2, date: '22', month: 'Feb', title: 'National Holiday', type: 'holiday', color: 'bg-red-500' },
  { id: 3, date: '25', month: 'Feb', title: 'Results Publication', type: 'exam', color: 'bg-primary' },
  { id: 4, date: '28', month: 'Feb', title: 'Fee Deadline', type: 'deadline', color: 'bg-amber-500' },
  { id: 5, date: '05', month: 'Mar', title: 'New Term Begins', type: 'event', color: 'bg-purple-500' },
];

// Role cards data
const roles = [
  {
    title: 'Students',
    description: 'View results, download transcripts, track discipline records, and manage your academic profile.',
    icon: GraduationCap,
    href: '/dashboard/student',
    color: 'from-primary to-emerald-600',
  },
  {
    title: 'Teachers',
    description: 'Enter marks, manage classes, track attendance, and communicate with students.',
    icon: BookOpen,
    href: '/dashboard/teacher',
    color: 'from-sky-500 to-sky-600',
  },
  {
    title: 'Administrators',
    description: 'Oversee operations, generate reports, manage users, and configure system settings.',
    icon: Shield,
    href: '/dashboard/hod',
    color: 'from-violet-500 to-purple-600',
  },
  {
    title: 'Parents/Guardians',
    description: 'Monitor student progress, view attendance records, and stay updated on activities.',
    icon: Users,
    href: '/login',
    color: 'from-amber-500 to-orange-500',
  },
];

// Login Panel Component
function LoginPanel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate login - in production, this would call the auth API
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-sky-200">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Welcome Back</h3>
        <p className="text-gray-500 text-sm mt-1">Sign in to access your portal</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email or Registration No.
          </label>
          <input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email or reg. no."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky focus:border-sky-300 transition-all"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky focus:border-sky-300 transition-all"
            required
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2 rounded border-gray-300 text-sky focus:ring-sky" />
            <span className="text-gray-600">Remember me</span>
          </label>
          <Link href="/forgot-password" className="text-sky-600 hover:text-sky-700 font-medium">
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-600 transition-all duration-200 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-3">New student? Register here</p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center w-full py-3 border-2 border-sky-300 text-sky-700 font-semibold rounded-lg hover:bg-sky-50 transition-all"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Register as Student
          </Link>
        </div>
      </div>

      <div className="mt-4 text-center">
        <Link href="/help" className="inline-flex items-center text-sm text-sky-600 hover:text-sky-700">
          <HelpCircle className="w-4 h-4 mr-1" />
          Need Help?
        </Link>
      </div>
    </div>
  );
}

// Quick Result Access Component
function QuickResultAccess() {
  const [regNumber, setRegNumber] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate result lookup
    setTimeout(() => {
      setLoading(false);
      setShowResult(true);
    }, 1500);
  };

  if (showResult) {
    return (
      <div className="bg-antiquewhite-light rounded-xl p-6 border-2 border-primary shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <Search className="w-5 h-5 mr-2 text-primary" />
            Your Results
          </h3>
          <button onClick={() => setShowResult(false)} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">Mathematics</span>
            <span className="font-bold text-primary">85/100</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">Physics</span>
            <span className="font-bold text-primary">78/100</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">Chemistry</span>
            <span className="font-bold text-primary">92/100</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600 font-semibold">Total Average</span>
            <span className="font-bold text-primary text-lg">85%</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">Login for full transcript</p>
      </div>
    );
  }

  return (
    <div className="bg-antiquewhite-light rounded-xl p-6 border-2 border-sky-200 hover:border-sky-300 transition-all">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <GraduationCap className="w-5 h-5 mr-2 text-sky-600" />
        Check Your Results
      </h3>
      <p className="text-sm text-gray-600 mb-4">Quick access without login using PIN</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            value={regNumber}
            onChange={(e) => setRegNumber(e.target.value)}
            placeholder="Registration Number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky focus:border-sky-300 text-sm"
            required
          />
        </div>
        <div>
          <input
            type="text"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="One-Time PIN (sent via SMS)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky focus:border-sky-300 text-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 transition-all text-sm disabled:opacity-50"
        >
          {loading ? 'Looking up...' : 'View Results'}
        </button>
      </form>
    </div>
  );
}

// Announcements Ticker Component
function AnnouncementsTicker() {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<typeof announcements[0] | null>(null);

  return (
    <>
      <div className="bg-white border-b-2 border-sky-200 overflow-hidden">
        <div className="flex items-center">
          <div className="bg-sky-500 text-white px-4 py-3 flex items-center font-bold text-sm whitespace-nowrap">
            <Bell className="w-4 h-4 mr-2" />
            Latest Announcements
          </div>
          <div className="overflow-hidden flex-1 py-3">
            <div className="ticker-animate flex whitespace-nowrap">
              {[...announcements, ...announcements].map((item, idx) => (
                <button
                  key={`${item.id}-${idx}`}
                  onClick={() => setSelectedAnnouncement(item)}
                  className="inline-flex items-center mx-6 text-gray-600 hover:text-sky-600 transition-colors cursor-pointer"
                >
                  <span className="text-xs text-sky-600 mr-2">{item.date}</span>
                  <span className="text-sm">{item.title}</span>
                  <ChevronRight className="w-4 h-4 ml-1 text-sky-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Announcement Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAnnouncement(null)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center mr-3">
                  <Bell className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Announcement</h3>
                  <p className="text-xs text-gray-500">{selectedAnnouncement.date}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAnnouncement(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-700 leading-relaxed">{selectedAnnouncement.title}</p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Academic Calendar Component
function AcademicCalendar() {
  return (
    <div className="bg-white rounded-xl p-6 border-2 border-sky-200">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <Calendar className="w-5 h-5 mr-2 text-sky-600" />
        Key Dates
      </h3>
      <div className="space-y-3">
        {calendarEvents.map((event) => (
          <div key={event.id} className="flex items-center p-2 rounded-lg hover:bg-antiquewhite-light transition-colors">
            <div className={`w-10 h-10 ${event.color} rounded-lg flex flex-col items-center justify-center text-white text-xs font-bold mr-3`}>
              <span className="text-sm">{event.date}</span>
              <span className="text-[10px] uppercase">{event.month}</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800 text-sm">{event.title}</p>
            </div>
          </div>
        ))}
      </div>
      <Link href="/calendar" className="block mt-4 text-center text-sm text-sky-600 hover:text-sky-700 font-medium">
        View Full Calendar →
      </Link>
    </div>
  );
}

// Role Card Component
function RoleCard({ role, index }: { role: typeof roles[0], index: number }) {
  const isEven = index % 2 === 0;
  
  return (
    <div 
      className={`bg-white rounded-xl p-6 border-2 border-gray-100 card-hover relative overflow-hidden ${isEven ? 'rotate-1' : '-rotate-1'} max-md:rotate-0`}
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${role.color} opacity-10 rounded-bl-full`} />
      <div className={`w-14 h-14 bg-gradient-to-br ${role.color} rounded-xl flex items-center justify-center mb-4`}>
        <role.icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{role.title}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{role.description}</p>
      <Link
        href={role.href}
        className="inline-flex items-center text-primary font-semibold hover:text-primary-600 transition-colors"
      >
        Learn More
        <ArrowRight className="w-4 h-4 ml-1" />
      </Link>
    </div>
  );
}

// Contact Section Component
function ContactSection() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="bg-white rounded-xl p-8 border-2 border-sky-200">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Get in Touch</h3>
      
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="flex items-start">
          <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center mr-3">
            <Mail className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="font-medium text-gray-800">Email</p>
            <p className="text-sm text-gray-600">info@appec.edu</p>
          </div>
        </div>
        <div className="flex items-start">
          <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center mr-3">
            <Phone className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="font-medium text-gray-800">Phone</p>
            <p className="text-sm text-gray-600">+250 788 4543</p>
          </div>
        </div>
        <div className="flex items-start">
          <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center mr-3">
            <Clock className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="font-medium text-gray-800">Support Hours</p>
            <p className="text-sm text-gray-600">Mon-Fri: 8AM - 5PM</p>
          </div>
        </div>
        <div className="flex items-start">
          <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center mr-3">
            <HelpCircle className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="font-medium text-gray-800">FAQ</p>
            <Link href="/faq" className="text-sm text-sky-600 hover:text-sky-700">View FAQs →</Link>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Your Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky focus:border-sky-300 text-sm"
          required
        />
        <input
          type="email"
          placeholder="Your Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky focus:border-sky-300 text-sm"
          required
        />
        <textarea
          placeholder="Your Message"
          rows={3}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky focus:border-sky-300 text-sm resize-none"
          required
        />
        <button
          type="submit"
          className="w-full py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition-all"
        >
          {submitted ? 'Message Sent!' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}

// Footer Component
function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-emerald-600 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-lg">APPEC TSS</h4>
                <p className="text-xs text-gray-400">College Management</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Streamlining education management for a brighter future.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sky-400">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors text-sm">About Us</Link></li>
              <li><Link href="/admissions" className="text-gray-400 hover:text-white transition-colors text-sm">Admissions</Link></li>
              <li><Link href="/academics" className="text-gray-400 hover:text-white transition-colors text-sm">Academics</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sky-400">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Use</Link></li>
              <li><Link href="/sitemap" className="text-gray-400 hover:text-white transition-colors text-sm">Sitemap</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sky-400">Connect With Us</h4>
            <div className="flex space-x-3">
              <a href="#" className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center hover:bg-sky-500 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center hover:bg-sky-500 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center hover:bg-sky-500 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center hover:bg-sky-500 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">© {currentYear} APPEC TSS College. All rights reserved.</p>
          <p className="text-gray-500 text-xs mt-2">Comprehensive Academic Management System v2.0</p>
        </div>
      </div>
    </footer>
  );
}

// Mobile Menu Component
function MobileMenu({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={onClose}>
      <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <span className="font-bold text-lg">Menu</span>
            <button onClick={onClose} className="p-2">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="space-y-3">
            <Link href="/about" className="block py-2 text-gray-700 hover:text-sky-600" onClick={onClose}>About</Link>
            <Link href="/academics" className="block py-2 text-gray-700 hover:text-sky-600" onClick={onClose}>Academics</Link>
            <Link href="/admissions" className="block py-2 text-gray-700 hover:text-sky-600" onClick={onClose}>Admissions</Link>
            <Link href="/contact" className="block py-2 text-gray-700 hover:text-sky-600" onClick={onClose}>Contact</Link>
            <hr className="my-4" />
            <Link href="/login" className="block py-2 text-sky-600 font-semibold" onClick={onClose}>Login</Link>
            <Link href="/register" className="block py-2 px-4 bg-primary text-white text-center rounded-lg" onClick={onClose}>Register</Link>
          </nav>
        </div>
      </div>
    </div>
  );
}

// Main Home Page Component
export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-antiquewhite bg-pattern">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b-2 border-sky-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-emerald-600 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-800">APPEC TSS</h1>
                <p className="text-xs text-sky-600 -mt-1">College Management</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              <Link href="/about" className="text-gray-600 hover:text-sky-600 font-medium transition-colors">About</Link>
              <Link href="/academics" className="text-gray-600 hover:text-sky-600 font-medium transition-colors">Academics</Link>
              <Link href="/admissions" className="text-gray-600 hover:text-sky-600 font-medium transition-colors">Admissions</Link>
              <Link href="/contact" className="text-gray-600 hover:text-sky-600 font-medium transition-colors">Contact</Link>
              <Link href="/login" className="flex items-center px-4 py-2 text-sky-600 font-semibold hover:text-sky-700">
                <Lock className="w-4 h-4 mr-2" />
                Login
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition-all hover:scale-105"
              >
                Register
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden p-2"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </nav>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Announcements Ticker */}
      <AnnouncementsTicker />

      {/* Hero Section - Asymmetric Split Layout */}
      <header className="relative geometric-bg">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Value Proposition */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 bg-sky-100 rounded-full mb-6">
                <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
                <span className="text-sm font-medium text-sky-700">Modern College Management</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-800 leading-tight mb-6">
                Streamlining
                <span className="text-primary block">Education</span>
                Management
              </h2>
              
              <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
                A comprehensive digital platform for managing student admissions, coursework, grades, and academic performance. Designed for excellence.
              </p>

              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <Link
                  href="/login"
                  className="inline-flex items-center px-8 py-4 text-lg font-bold text-white bg-primary rounded-xl hover:bg-primary-600 transition-all hover:scale-105 shadow-lg"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <button className="inline-flex items-center px-8 py-4 text-lg font-bold text-sky-700 bg-white border-2 border-sky-300 rounded-xl hover:bg-sky-50 transition-all">
                  Learn More
                </button>
              </div>

              {/* Quick Result Access */}
              <div className="mt-10 max-w-sm mx-auto lg:mx-0">
                <QuickResultAccess />
              </div>
            </div>

            {/* Right Side - Login Panel */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-sky-200 to-primary/20 rounded-2xl blur-2xl opacity-50" />
              <div className="relative">
                <LoginPanel />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Role-Based Information Cards */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Who Are You?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose your portal to access personalized features and tools tailored to your role
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {roles.map((role, index) => (
              <RoleCard key={role.title} role={role} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Calendar & Contact Section */}
      <section className="py-20 bg-antiquewhite-light">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Academic Calendar */}
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-8">Academic Calendar</h2>
              <AcademicCalendar />
            </div>

            {/* Contact Section */}
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-8">Contact & Support</h2>
              <ContactSection />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-emerald-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2 text-white">2,500+</div>
              <div className="text-emerald-100">Active Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 text-white">150+</div>
              <div className="text-emerald-100">Faculty Members</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 text-white">98%</div>
              <div className="text-emerald-100">Pass Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 text-white">24/7</div>
              <div className="text-emerald-100">System Availability</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of students and staff who trust our comprehensive 
            academic management system for their educational journey.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-4 text-lg font-bold text-white bg-primary rounded-xl hover:bg-primary-600 transition-all shadow-lg hover:scale-105"
            >
              Login to Your Account
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center px-8 py-4 text-lg font-bold text-sky-700 bg-white border-2 border-sky-300 rounded-xl hover:bg-sky-50 transition-all"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              New Student Admission
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
