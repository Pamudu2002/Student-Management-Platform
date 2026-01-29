'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Download, Printer } from 'lucide-react';

interface Class {
  _id: string;
  name: string;
  grade: number;
}

interface Student {
  _id: string;
  name: string;
  indexNumber: string;
  classId: string;
  grade: number;
}

interface Paper {
  _id: string;
  name: string;
  classId: string;
  grade: number;
  isMainPaper: boolean;
  createdAt: string;
}

export default function ClassDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { status } = useSession();
  const router = useRouter();
  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [activeTab, setActiveTab] = useState<'students' | 'papers'>('students');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddPaper, setShowAddPaper] = useState(false);
  const [showEditStudent, setShowEditStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchClassData();
      fetchStudents();
      fetchPapers();
    }
  }, [status]);

  const fetchClassData = async () => {
    try {
      const response = await fetch(`/api/classes/${params.id}`);
      const data = await response.json();
      setClassData(data.class);
    } catch (error) {
      console.error('Failed to fetch class:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/students?classId=${params.id}`);
      const data = await response.json();
      setStudents(data.students);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const handlePrintResults = async (paper: Paper) => {
    try {
      // Fetch paper results
      const response = await fetch(`/api/results?paperId=${paper._id}`);
      const data = await response.json();
      const results: any[] = data.results;

      // Filter and Sort
      const validResults = results.filter((r) => r.totalMarks !== -1 && r.totalMarks !== undefined);
      
      // Calculate ranks
      const sortedResults = validResults.sort((a, b) => b.totalMarks - a.totalMarks);
      
      const rankedResults = sortedResults.map((result, index, arr) => {
         const rank = arr.findIndex(r => r.totalMarks === result.totalMarks) + 1;
         return { ...result, rank };
      });

      // Limit
      const limit = rankedResults.length < 10 ? 5 : 10;
      const topResults = rankedResults.slice(0, limit);

      // Create Print Window
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to print results');
        return;
      }

      const showParts = classData?.grade === 5 && paper.isMainPaper;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${paper.name} - Top ${limit}</title>
          <style>
            body { font-family: 'Noto Sans Sinhala', sans-serif, Arial; padding: 20px; text-align: center; }
            .header { margin-bottom: 20px; margin-top: 100px;}
            .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .subtitle { font-size: 20px; margin-bottom: 5px; }
            .paper-name { font-size: 20px; margin-bottom: 10px; }
            .top-label { font-size: 20px; font-weight: bold; text-decoration: underline; margin-bottom: 15px; }
            table { width: ${showParts ? '70%' : '60%'}; margin: 0 auto; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; }
            th { text-align: center; background-color: #f0f0f0; }
            td.rank { font-size: 20px; text-align: center; width: 50px; }
            td.name { font-size: 20px; text-align: left; width: 200px; }
            td.marks { font-size: 20px; text-align: center; width: 50px; font-weight: bold; }
            .footer { font-size: 20px; margin-top: 30px; }
            .quote { margin-bottom: 5px; font-style: italic; }
            .author { margin-top: 15px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">ශිෂ්‍යත්වයට ගණිත ගැටලු - දුලාංජන රණවීර</div>
            <div class="subtitle">${classData?.grade} ශ්‍රේණිය</div>
            <div class="paper-name">${paper.name}</div>
            <div class="title">Top ${limit}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                ${showParts ? '<th>Part I</th><th>Part II</th>' : ''}
                <th>Marks</th>
              </tr>
            </thead>
            <tbody>
              ${topResults.map(r => `
                <tr>
                  <td class="rank">${r.rank}</td>
                  <td class="name">${r.studentId.name}</td>
                  ${showParts ? `<td class="marks" style="font-weight: normal;">${r.part1Marks ?? '-'}</td><td class="marks" style="font-weight: normal;">${r.part2Marks ?? '-'}</td>` : ''}
                  <td class="marks">${r.totalMarks}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <div class="quote">ප්‍රතිඵල මත ගොඩනැගෙන විශිෂ්ටත්වය -</div>
            <div class="quote">විශිෂ්ටත්වය මත ගොඩනැගෙන විශ්වාසය</div>
            <div class="author">-දුලාංජන රණවීර-</div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

    } catch (error) {
      console.error("Failed to print results", error);
      alert("Failed to print results");
    }
  };

  const fetchPapers = async () => {
    try {
      const response = await fetch(`/api/papers?classId=${params.id}`);
      const data = await response.json();
      setPapers(data.papers);
    } catch (error) {
      console.error('Failed to fetch papers:', error);
    }
  };

  const handlePaperClick = (paperId: string) => {
    router.push(`/admin/paper/${paperId}`);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setShowEditStudent(true);
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete ${studentName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchStudents();
      } else {
        alert('Failed to delete student');
      }
    } catch (error) {
      console.error('Failed to delete student:', error);
      alert('Failed to delete student');
    }
  };

  if (loading || !classData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-primary-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="text-primary-600 hover:text-primary-700 mb-2 text-sm"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-primary-700">
                {classData.name} - Grade {classData.grade}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'students'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Students
          </button>
          <button
            onClick={() => setActiveTab('papers')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'papers'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Papers & Marks
          </button>
        </div>

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div>
            <div className="mb-6">
              <button
                onClick={() => setShowAddStudent(true)}
                className="btn-primary"
              >
                + Add Student
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-primary-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                        Index Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr
                        key={student._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.indexNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          Grade {student.grade}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditStudent(student)}
                              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student._id, student.name)}
                              className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {students.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    No students added yet. Add your first student to get
                    started.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Papers Tab */}
        {activeTab === 'papers' && (
          <div>
            <div className="mb-6">
              <button
                onClick={() => setShowAddPaper(true)}
                className="btn-primary"
              >
                + Add Paper
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {papers.map((paper) => (
                <div
                  key={paper._id}
                  className="card group relative hover:scale-105 transition-transform"
                >
                  <div
                    onClick={() => handlePaperClick(paper._id)}
                    className="cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {paper.name}
                      </h3>
                      {paper.isMainPaper && (
                        <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-medium">
                          Main Paper
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">
                      Click to manage marks
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrintResults(paper);
                    }}
                    className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 hover:text-primary-600 transition-colors opacity-0 group-hover:opacity-100"
                    title="Print Results"
                  >
                    <Printer size={20} />
                  </button>
                </div>
              ))}
            </div>

            {papers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No papers added yet. Create your first paper to get started.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Student Modal */}
      {showAddStudent && (
        <AddStudentModal
          classId={params.id}
          onClose={() => setShowAddStudent(false)}
          onSuccess={() => {
            setShowAddStudent(false);
            fetchStudents();
          }}
        />
      )}

      {/* Edit Student Modal */}
      {showEditStudent && editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => {
            setShowEditStudent(false);
            setEditingStudent(null);
          }}
          onSuccess={() => {
            setShowEditStudent(false);
            setEditingStudent(null);
            fetchStudents();
          }}
        />
      )}

      {/* Add Paper Modal */}
      {showAddPaper && (
        <AddPaperModal
          classId={params.id}
          grade={classData.grade}
          onClose={() => setShowAddPaper(false)}
          onSuccess={() => {
            setShowAddPaper(false);
            fetchPapers();
          }}
        />
      )}
    </div>
  );
}

function AddStudentModal({
  classId,
  onClose,
  onSuccess,
}: {
  classId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, classId }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to add student');
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
          Add New Student
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Enter student name"
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Index number will be auto-generated
            </p>
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
              {loading ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditStudentModal({
  student,
  onClose,
  onSuccess,
}: {
  student: Student;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(student.name);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/students/${student._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to update student');
      }
    } catch (error) {
      console.error('Failed to update student:', error);
      setError('Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Student</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Enter student name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Index Number
            </label>
            <input
              type="text"
              value={student.indexNumber}
              className="input-field bg-gray-100"
              disabled
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
              {loading ? 'Updating...' : 'Update Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddPaperModal({
  classId,
  grade,
  onClose,
  onSuccess,
}: {
  classId: string;
  grade: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [isMainPaper, setIsMainPaper] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, classId, isMainPaper }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to add paper');
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
          Add New Paper
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paper Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="e.g., Mathematics Test"
              required
            />
          </div>
          {grade === 5 && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isMainPaper"
                checked={isMainPaper}
                onChange={(e) => setIsMainPaper(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <label
                htmlFor="isMainPaper"
                className="ml-2 text-sm text-gray-700"
              >
                This is a Main Paper (with Part 1 and Part 2)
              </label>
            </div>
          )}
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
              {loading ? 'Adding...' : 'Add Paper'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
