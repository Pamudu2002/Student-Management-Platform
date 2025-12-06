'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentPortal() {
  const [indexNumber, setIndexNumber] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!indexNumber || indexNumber.length !== 7) {
      setError('Please enter a valid 7-digit index number');
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
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-700 mb-2">
            Student Portal
          </h1>
          <p className="text-gray-600">
            Enter your index number to view your results
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="indexNumber"
              className="block text-sm font-medium text-gray-700 mb-2"
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
              className="input-field text-center text-lg tracking-wider"
              placeholder="0000000"
              maxLength={7}
              required
            />
            <p className="mt-2 text-sm text-gray-500 text-center">
              Enter your 7-digit index number
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button type="submit" className="w-full btn-primary text-lg py-3">
            View Results
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/admin/login"
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Admin Login
          </a>
        </div>
      </div>
    </div>
  );
}
