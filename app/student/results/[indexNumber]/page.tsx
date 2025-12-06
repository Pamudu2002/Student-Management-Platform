'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Student {
  _id: string;
  name: string;
  indexNumber: string;
  grade: number;
  classId: {
    name: string;
    grade: number;
  };
}

interface Result {
  _id: string;
  paperId: {
    name: string;
    isMainPaper: boolean;
  };
  marks?: number;
  part1Marks?: number;
  part2Marks?: number;
  totalMarks: number;
  createdAt: string;
}

interface TopResult {
  studentId: {
    name: string;
    indexNumber: string;
  };
  totalMarks: number;
  marks?: number;
  part1Marks?: number;
  part2Marks?: number;
}

export default function StudentResults({
  params,
}: {
  params: { indexNumber: string };
}) {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [recentResult, setRecentResult] = useState<Result | null>(null);
  const [pastResults, setPastResults] = useState<Result[]>([]);
  const [topResults, setTopResults] = useState<TopResult[]>([]);
  const [view, setView] = useState<'recent' | 'past' | 'top'>('recent');
  const [loading, setLoading] = useState(true);
  const [topLimit, setTopLimit] = useState(10);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const studentResponse = await fetch(
        `/api/students/${params.indexNumber}`
      );

      if (!studentResponse.ok) {
        router.push('/student');
        return;
      }

      const studentData = await studentResponse.json();
      setStudent(studentData.student);

      await fetchRecentResult();
    } catch (error) {
      console.error('Failed to fetch student data:', error);
      router.push('/student');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentResult = async () => {
    try {
      const response = await fetch(
        `/api/results/recent/${params.indexNumber}`
      );
      if (response.ok) {
        const data = await response.json();
        setRecentResult(data.result);
      }
    } catch (error) {
      console.error('Failed to fetch recent result:', error);
    }
  };

  const fetchPastResults = async () => {
    try {
      const response = await fetch(`/api/results/past/${params.indexNumber}`);
      if (response.ok) {
        const data = await response.json();
        setPastResults(data.results);
      }
    } catch (error) {
      console.error('Failed to fetch past results:', error);
    }
  };

  const fetchTopResults = async () => {
    try {
      const response = await fetch(`/api/results/top/${params.indexNumber}`);
      if (response.ok) {
        const data = await response.json();
        setTopResults(data.topResults);
        setTopLimit(data.limit);
      }
    } catch (error) {
      console.error('Failed to fetch top results:', error);
    }
  };

  const handleViewChange = (newView: 'recent' | 'past' | 'top') => {
    setView(newView);
    if (newView === 'past' && pastResults.length === 0) {
      fetchPastResults();
    } else if (newView === 'top' && topResults.length === 0) {
      fetchTopResults();
    }
  };

  if (loading || !student) {
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
              <h1 className="text-2xl font-bold text-primary-700">
                {student.name}
              </h1>
              <p className="text-gray-600">
                Index: {student.indexNumber} | {student.classId.name} - Grade{' '}
                {student.grade}
              </p>
            </div>
            <button
              onClick={() => router.push('/student')}
              className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Buttons */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => handleViewChange('recent')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              view === 'recent'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Recent Result
          </button>
          <button
            onClick={() => handleViewChange('past')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              view === 'past'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Past Results
          </button>
          <button
            onClick={() => handleViewChange('top')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              view === 'top'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Top Rankings
          </button>
        </div>

        {/* Recent Result View */}
        {view === 'recent' && (
          <div className="bg-white rounded-xl shadow-md p-8">
            {recentResult ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {recentResult.paperId.name}
                </h2>
                {recentResult.paperId.isMainPaper ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-primary-50 p-6 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Part 1</p>
                        <p className="text-3xl font-bold text-primary-700">
                          {recentResult.part1Marks}
                        </p>
                      </div>
                      <div className="bg-primary-50 p-6 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Part 2</p>
                        <p className="text-3xl font-bold text-primary-700">
                          {recentResult.part2Marks}
                        </p>
                      </div>
                      <div className="bg-primary-100 p-6 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">
                          Total Marks
                        </p>
                        <p className="text-3xl font-bold text-primary-700">
                          {recentResult.totalMarks}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-primary-50 p-6 rounded-lg inline-block">
                    <p className="text-sm text-gray-600 mb-1">Your Marks</p>
                    <p className="text-4xl font-bold text-primary-700">
                      {recentResult.marks}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No recent results available
                </p>
              </div>
            )}
          </div>
        )}

        {/* Past Results View */}
        {view === 'past' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {pastResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-primary-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                        Paper Name
                      </th>
                      {student.grade === 5 && (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                            Part 1
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                            Part 2
                          </th>
                        </>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                        {student.grade === 5 ? 'Total Marks' : 'Marks'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pastResults.map((result) => (
                      <tr
                        key={result._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {result.paperId.name}
                          {result.paperId.isMainPaper && (
                            <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                              Main
                            </span>
                          )}
                        </td>
                        {student.grade === 5 && result.paperId.isMainPaper && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {result.part1Marks}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {result.part2Marks}
                            </td>
                          </>
                        )}
                        {student.grade === 5 && !result.paperId.isMainPaper && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              -
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              -
                            </td>
                          </>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-700">
                          {result.paperId.isMainPaper
                            ? result.totalMarks
                            : result.marks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(result.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No past results found</p>
              </div>
            )}
          </div>
        )}

        {/* Top Rankings View */}
        {view === 'top' && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Top {topLimit} Students - Recent Paper
            </h2>
            {topResults.length > 0 ? (
              <div className="space-y-3">
                {topResults.map((result, index) => {
                  const isCurrentStudent =
                    result.studentId.indexNumber === params.indexNumber;
                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                        isCurrentStudent
                          ? 'bg-primary-100 border-2 border-primary-600'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            index < 3
                              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
                              : 'bg-gray-300 text-gray-700'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {result.studentId.name}
                            {isCurrentStudent && (
                              <span className="ml-2 text-xs bg-primary-600 text-white px-2 py-1 rounded">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600">
                            {result.studentId.indexNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary-700">
                          {result.totalMarks}
                        </p>
                        {result.part1Marks !== undefined &&
                          result.part2Marks !== undefined && (
                            <p className="text-xs text-gray-600">
                              P1: {result.part1Marks} | P2: {result.part2Marks}
                            </p>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No rankings available yet
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
