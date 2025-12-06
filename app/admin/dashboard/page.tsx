'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface Class {
  _id: string;
  name: string;
  grade: number;
  createdAt: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchClasses();
    }
  }, [status]);

  useEffect(() => {
    if (selectedGrade === null) {
      setFilteredClasses(classes);
    } else {
      setFilteredClasses(classes.filter((c) => c.grade === selectedGrade));
    }
  }, [selectedGrade, classes]);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      const data = await response.json();
      setClasses(data.classes);
      setFilteredClasses(data.classes);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassClick = (classId: string) => {
    router.push(`/admin/class/${classId}`);
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/admin/login' });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-primary-600">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary-700">
              Student Management Platform
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">
                Welcome, {session.user.username}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowAddAdmin(true)}
            className="btn-primary"
          >
            + Add Admin
          </button>
          <button
            onClick={() => setShowAddClass(true)}
            className="btn-primary"
          >
            + Add Class
          </button>
        </div>

        {/* Grade Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Grade
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedGrade(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedGrade === null
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Grades
            </button>
            <button
              onClick={() => setSelectedGrade(3)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedGrade === 3
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Grade 3
            </button>
            <button
              onClick={() => setSelectedGrade(4)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedGrade === 4
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Grade 4
            </button>
            <button
              onClick={() => setSelectedGrade(5)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedGrade === 5
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Grade 5
            </button>
          </div>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((classItem) => (
            <div
              key={classItem._id}
              onClick={() => handleClassClick(classItem._id)}
              className="card cursor-pointer hover:scale-105 transition-transform"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-gray-800">
                  {classItem.name}
                </h3>
                <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                  Grade {classItem.grade}
                </span>
              </div>
              <p className="text-gray-600 text-sm">
                Click to manage students and papers
              </p>
            </div>
          ))}
        </div>

        {filteredClasses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No classes found. Create your first class to get started.
            </p>
          </div>
        )}
      </main>

      {/* Add Admin Modal */}
      {showAddAdmin && (
        <AddAdminModal
          onClose={() => setShowAddAdmin(false)}
          onSuccess={() => {
            setShowAddAdmin(false);
          }}
        />
      )}

      {/* Add Class Modal */}
      {showAddClass && (
        <AddClassModal
          onClose={() => setShowAddClass(false)}
          onSuccess={() => {
            setShowAddClass(false);
            fetchClasses();
          }}
        />
      )}
    </div>
  );
}

function AddAdminModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to create admin');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-primary-700 mb-6">
          Add New Admin
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddClassModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState(3);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, grade }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to create class');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-primary-700 mb-6">
          Add New Class
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="e.g., Class A"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(parseInt(e.target.value))}
              className="input-field"
            >
              <option value={3}>Grade 3</option>
              <option value={4}>Grade 4</option>
              <option value={5}>Grade 5</option>
            </select>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
