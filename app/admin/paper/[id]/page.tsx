'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Paper {
  _id: string;
  name: string;
  classId: {
    _id: string;
    name: string;
    grade: number;
  };
  grade: number;
  isMainPaper: boolean;
}

interface Student {
  _id: string;
  name: string;
  indexNumber: string;
}

interface Result {
  _id?: string;
  studentId: {
    _id: string;
    name: string;
    indexNumber: string;
  };
  marks?: number;
  part1Marks?: number;
  part2Marks?: number;
  totalMarks: number;
}

export default function PaperDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { status } = useSession();
  const router = useRouter();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [sortBy, setSortBy] = useState<'total' | 'part1' | 'part2'>('total');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPaperData();
    }
  }, [status]);

  useEffect(() => {
    if (paper) {
      sortResults();
    }
  }, [sortBy, paper]);

  const fetchPaperData = async () => {
    try {
      const paperResponse = await fetch(`/api/papers?classId=${params.id}`);
      const paperData = await paperResponse.json();
      const currentPaper = paperData.papers.find(
        (p: Paper) => p._id === params.id
      );

      if (!currentPaper) {
        const allPapersResponse = await fetch('/api/papers');
        const allPapersData = await allPapersResponse.json();
        const foundPaper = allPapersData.papers.find(
          (p: Paper) => p._id === params.id
        );
        setPaper(foundPaper);

        const studentsResponse = await fetch(
          `/api/students?classId=${foundPaper.classId._id}`
        );
        const studentsData = await studentsResponse.json();
        setStudents(studentsData.students);

        const resultsResponse = await fetch(
          `/api/results?paperId=${params.id}`
        );
        const resultsData = await resultsResponse.json();
        setResults(resultsData.results);
      } else {
        setPaper(currentPaper);

        const studentsResponse = await fetch(
          `/api/students?classId=${currentPaper.classId._id || currentPaper.classId}`
        );
        const studentsData = await studentsResponse.json();
        setStudents(studentsData.students);

        const resultsResponse = await fetch(
          `/api/results?paperId=${params.id}`
        );
        const resultsData = await resultsResponse.json();
        setResults(resultsData.results);
      }
    } catch (error) {
      console.error('Failed to fetch paper data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortResults = () => {
    const sorted = [...results].sort((a, b) => {
      if (sortBy === 'total') {
        return b.totalMarks - a.totalMarks;
      } else if (sortBy === 'part1' && a.part1Marks && b.part1Marks) {
        return b.part1Marks - a.part1Marks;
      } else if (sortBy === 'part2' && a.part2Marks && b.part2Marks) {
        return b.part2Marks - a.part2Marks;
      }
      return 0;
    });
    setResults(sorted);
  };

  const handleMarksUpdate = async (
    studentId: string,
    marks: any
  ) => {
    try {
      const classId = typeof paper?.classId === 'object' ? paper.classId._id : paper?.classId;
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          paperId: params.id,
          classId,
          ...marks,
        }),
      });

      if (response.ok) {
        await fetchPaperData();
      }
    } catch (error) {
      console.error('Failed to update marks:', error);
    }
  };

  if (loading || !paper) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-primary-600">Loading...</div>
      </div>
    );
  }

  const classData = typeof paper.classId === 'object' ? paper.classId : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <button
                onClick={() =>
                  router.push(
                    `/admin/class/${classData?._id || paper.classId}`
                  )
                }
                className="text-primary-600 hover:text-primary-700 mb-2 text-sm"
              >
                ← Back to Class
              </button>
              <h1 className="text-2xl font-bold text-primary-700">
                {paper.name}
                {paper.isMainPaper && (
                  <span className="ml-3 text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
                    Main Paper
                  </span>
                )}
              </h1>
              {classData && (
                <p className="text-gray-600 mt-1">
                  {classData.name} - Grade {classData.grade}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sorting Options */}
        {paper.isMainPaper && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort by
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('total')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  sortBy === 'total'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Total Marks
              </button>
              <button
                onClick={() => setSortBy('part1')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  sortBy === 'part1'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Part 1 Marks
              </button>
              <button
                onClick={() => setSortBy('part2')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  sortBy === 'part2'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Part 2 Marks
              </button>
            </div>
          </div>
        )}

        {/* Students and Marks Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                    Index Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                    Student Name
                  </th>
                  {paper.isMainPaper ? (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                        Part 1 Marks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                        Part 2 Marks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                        Total Marks
                      </th>
                    </>
                  ) : (
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                      Marks
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => {
                  const result = results.find(
                    (r) => r.studentId._id === student._id
                  );
                  return (
                    <StudentRow
                      key={student._id}
                      student={student}
                      result={result}
                      isMainPaper={paper.isMainPaper}
                      onUpdate={handleMarksUpdate}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
          {students.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No students in this class. Add students first.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StudentRow({
  student,
  result,
  isMainPaper,
  onUpdate,
}: {
  student: Student;
  result?: Result;
  isMainPaper: boolean;
  onUpdate: (studentId: string, marks: any) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [marks, setMarks] = useState(result?.marks?.toString() || '');
  const [part1Marks, setPart1Marks] = useState(
    result?.part1Marks?.toString() || ''
  );
  const [part2Marks, setPart2Marks] = useState(
    result?.part2Marks?.toString() || ''
  );

  const handleSave = () => {
    if (isMainPaper) {
      onUpdate(student._id, {
        part1Marks: parseInt(part1Marks) || 0,
        part2Marks: parseInt(part2Marks) || 0,
      });
    } else {
      onUpdate(student._id, {
        marks: parseInt(marks) || 0,
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setMarks(result?.marks?.toString() || '');
    setPart1Marks(result?.part1Marks?.toString() || '');
    setPart2Marks(result?.part2Marks?.toString() || '');
    setIsEditing(false);
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {student.indexNumber}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {student.name}
      </td>
      {isMainPaper ? (
        <>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {isEditing ? (
              <input
                type="number"
                value={part1Marks}
                onChange={(e) => setPart1Marks(e.target.value)}
                className="w-20 px-2 py-1 border border-gray-300 rounded"
                min="0"
              />
            ) : (
              result?.part1Marks ?? '-'
            )}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {isEditing ? (
              <input
                type="number"
                value={part2Marks}
                onChange={(e) => setPart2Marks(e.target.value)}
                className="w-20 px-2 py-1 border border-gray-300 rounded"
                min="0"
              />
            ) : (
              result?.part2Marks ?? '-'
            )}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {result?.totalMarks ?? '-'}
          </td>
        </>
      ) : (
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          {isEditing ? (
            <input
              type="number"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              className="w-20 px-2 py-1 border border-gray-300 rounded"
              min="0"
            />
          ) : (
            result?.marks ?? '-'
          )}
        </td>
      )}
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-700 font-medium"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            {result ? 'Edit' : 'Add'}
          </button>
        )}
      </td>
    </tr>
  );
}
