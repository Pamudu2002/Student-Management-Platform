'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentPortal() {
  const [indexNumber, setIndexNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!indexNumber || indexNumber.length !== 7) {
      setError('Please enter a valid 7-digit index number');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/students/${indexNumber}`);

      if (response.ok) {
        router.push(`/student/results/${indexNumber}`);
      } else {
        setError('Student not found. Please check your index number.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/assets/bgp.png')] md:bg-[url('/assets/bg.png')] bg-cover bg-center bg-no-repeat bg-fixed font-sans">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-md mx-4 relative overflow-hidden group">
        
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-400/30 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-400/30 rounded-full blur-2xl"></div>

        <div className="text-center mb-10 relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight drop-shadow-lg">
            Student Portal
          </h1>
          <p className="text-blue-50 text-lg font-medium drop-shadow-md">
            View your results and progress
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          <div className="relative">
            <label
              htmlFor="indexNumber"
              className="block text-sm font-semibold text-white/90 mb-2 uppercase tracking-widest"
            >
              Index Number
            </label>
            <input
              id="indexNumber"
              type="text"
              value={indexNumber}
              onChange={(e) =>
                setIndexNumber(e.target.value.replace(/\D/g, '').slice(0, 7))
              }
              className="w-full bg-white/20 border-2 border-white/30 text-white placeholder-white/50 text-center text-3xl font-bold tracking-[0.2em] rounded-xl focus:outline-none focus:border-orange-400 focus:bg-white/30 transition-all duration-300 py-4 shadow-inner"
              placeholder="0000000"
              maxLength={7}
              required
              disabled={loading}
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/50 text-white px-4 py-3 rounded-xl text-sm font-medium text-center shadow-lg animate-pulse">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xl font-bold py-4 rounded-xl shadow-lg hover:shadow-orange-500/30 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none border border-orange-400/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking...
              </span>
            ) : (
              'View Results'
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/10 pt-6">
          <a
            href="/admin/login"
            className="text-sm text-blue-100 hover:text-white transition-colors font-medium hover:underline decoration-orange-400 decoration-2 underline-offset-4"
          >
            Are you an Admin? Login here
          </a>
        </div>
      </div>
      
      {/* Footer text */}
      <div className="fixed bottom-4 text-center w-full text-white/40 text-xs font-light">
        © {new Date().getFullYear()} Paper Class. All rights reserved.
      </div>
    </div>
  );
}
