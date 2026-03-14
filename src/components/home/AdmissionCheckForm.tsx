'use client';

import { useState } from 'react';

export default function AdmissionCheckForm() {
  const [examCode, setExamCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: string; name: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // Demo result
      setResult({
        status: 'Admitted',
        name: 'Demo Student'
      });
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="examCode" className="block text-sm font-medium text-gray-700 mb-1">
          Examination Code
        </label>
        <input
          id="examCode"
          type="text"
          value={examCode}
          onChange={(e) => setExamCode(e.target.value)}
          placeholder="Enter your exam code"
          className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
      >
        {loading ? 'Checking...' : 'Check Status'}
      </button>
      {result && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Status:</strong> {result.status}
          </p>
          <p className="text-sm text-green-800">
            <strong>Name:</strong> {result.name}
          </p>
        </div>
      )}
    </form>
  );
}
