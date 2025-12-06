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
    _id: string;
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
  paperId?: {
    _id: string;
    name: string;
    isMainPaper: boolean;
  };
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
  const [recentResults, setRecentResults] = useState<Result[]>([]);
  const [pastResults, setPastResults] = useState<Result[]>([]);
  const [topResults, setTopResults] = useState<TopResult[]>([]);
  const [view, setView] = useState<'recent' | 'past' | 'top'>('recent');
  const [pastFilter, setPastFilter] = useState<'all' | 'main' | 'normal'>('all');
  const [topFilter, setTopFilter] = useState<'all' | 'main' | 'normal'>('all');
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
        `/api/results/past/${params.indexNumber}`
      );
      if (response.ok) {
        const data = await response.json();
        // Get the most recent results (could be multiple if added at same time)
        const sortedResults = data.results.sort(
          (a: Result, b: Result) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        // For Grade 5, show recent main and recent normal
        if (data.student.grade === 5) {
          const recentMain = sortedResults.find((r: Result) => r.paperId.isMainPaper);
          const recentNormal = sortedResults.find((r: Result) => !r.paperId.isMainPaper);
          const recent = [];
          if (recentMain) recent.push(recentMain);
          if (recentNormal) recent.push(recentNormal);
          setRecentResults(recent);
        } else {
          // For Grade 3 and 4, show just the most recent
          setRecentResults(sortedResults.length > 0 ? [sortedResults[0]] : []);
        }
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
        console.log('Top results data:', data);
        console.log('Top results array:', data.topResults);
        setTopResults(data.topResults || []);
        setTopLimit(data.limit);
      } else {
        console.error('Failed to fetch top results:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch top results:', error);
    }
  };

  const getFilteredTopResults = () => {
    let filtered = topResults;
    
    // For Grade 5, filter by paper type
    if (student?.grade === 5 && topFilter !== 'all') {
      filtered = topResults.filter((result) => {
        const isMain = result.paperId?.isMainPaper === true;
        console.log('Result:', result.studentId?.name, 'isMain:', isMain, 'paperId:', result.paperId);
        if (topFilter === 'main') return isMain;
        return !isMain;
      });
    }
    
    // Group by student and keep their best result in the filtered set
    const studentBestResults = new Map();
    for (const result of filtered) {
      const studentIndexNumber = result.studentId?.indexNumber;
      if (studentIndexNumber) {
        if (!studentBestResults.has(studentIndexNumber) || 
            result.totalMarks > studentBestResults.get(studentIndexNumber).totalMarks) {
          studentBestResults.set(studentIndexNumber, result);
        }
      }
    }
    
    // Convert to array and sort by total marks, then limit
    const uniqueResults = Array.from(studentBestResults.values())
      .sort((a, b) => b.totalMarks - a.totalMarks)
      .slice(0, topLimit || 5);
    
    console.log(`Filtered results for ${topFilter}:`, uniqueResults.length);
    return uniqueResults;
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
          <div className="space-y-6">
            {recentResults.length > 0 ? (
              recentResults.map((result) => (
                <div key={result._id} className="bg-white rounded-xl shadow-md p-8">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {result.paperId.name}
                    </h2>
                    {result.paperId.isMainPaper && (
                      <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                        Main Paper
                      </span>
                    )}
                  </div>
                  {result.paperId.isMainPaper ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-6 rounded-lg border border-primary-200">
                        <p className="text-sm text-gray-600 mb-2 font-medium">Part 1 Marks</p>
                        <p className="text-4xl font-bold text-primary-700">
                          {result.part1Marks}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-6 rounded-lg border border-primary-200">
                        <p className="text-sm text-gray-600 mb-2 font-medium">Part 2 Marks</p>
                        <p className="text-4xl font-bold text-primary-700">
                          {result.part2Marks}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-primary-100 to-primary-200 p-6 rounded-lg border-2 border-primary-400">
                        <p className="text-sm text-gray-700 mb-2 font-medium">Total Marks</p>
                        <p className="text-4xl font-bold text-primary-800">
                          {result.totalMarks}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <div className="bg-gradient-to-br from-primary-100 to-primary-200 p-8 rounded-lg border-2 border-primary-400 min-w-[250px] text-center">
                        <p className="text-sm text-gray-700 mb-2 font-medium">Your Marks</p>
                        <p className="text-5xl font-bold text-primary-800">
                          {result.marks}
                        </p>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-4">
                    Date: {new Date(result.createdAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-md p-8">
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    No recent results available
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Past Results View */}
        {view === 'past' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Filter Toggle for Grade 5 */}
            {student.grade === 5 && pastResults.length > 0 && (
              <div className="p-6 border-b border-gray-200">
                <div className="flex gap-2">
                  <button
                    onClick={() => setPastFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      pastFilter === 'all'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Papers
                  </button>
                  <button
                    onClick={() => setPastFilter('main')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      pastFilter === 'main'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Main Papers Only
                  </button>
                  <button
                    onClick={() => setPastFilter('normal')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      pastFilter === 'normal'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Normal Papers Only
                  </button>
                </div>
              </div>
            )}
            
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
                    {pastResults
                      .filter((result) => {
                        if (student.grade !== 5 || pastFilter === 'all') return true;
                        if (pastFilter === 'main') return result.paperId.isMainPaper;
                        return !result.paperId.isMainPaper;
                      })
                      .map((result) => (
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
                            {new Date(result.createdAt).toLocaleDateString('en-GB')}
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
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Filter Toggle for Grade 5 */}
            {student.grade === 5 && topResults.length > 0 && (
              <div className="p-6 border-b border-gray-200">
                <div className="flex gap-2">
                  <button
                    onClick={() => setTopFilter('main')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      topFilter === 'main'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Main Paper
                  </button>
                  <button
                    onClick={() => setTopFilter('normal')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      topFilter === 'normal'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Normal Papers
                  </button>
                </div>
              </div>
            )}
            
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Top {topLimit} Students - Recent Paper
              </h2>
              {getFilteredTopResults().length > 0 ? (
                <div className="space-y-3">
                  {getFilteredTopResults().map((result, index) => {
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
          </div>
        )}
      </main>
    </div>
  );
}
