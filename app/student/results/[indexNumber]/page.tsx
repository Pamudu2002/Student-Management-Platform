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
    <div className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed bg-[url('/assets/bgp.png')] md:bg-[url('/assets/bg.png')] font-sans pb-12 relative">
      
      {/* Back Button */}
      <button
        onClick={() => router.push('/student')}
        className="fixed top-6 left-6 z-50 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 p-3 rounded-full text-white shadow-lg transition-all duration-300 group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 group-hover:-translate-x-1 transition-transform">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
      </button>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-2">
        
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-10">
          <div className="flex p-1 bg-white/20 backdrop-blur-md rounded-2xl w-full md:w-auto md:inline-flex border border-white/20 shadow-lg overflow-x-auto no-scrollbar">
            {['recent', 'past', 'top'].map((tab) => (
              <button
                key={tab}
                onClick={() => handleViewChange(tab as any)}
                className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold transition-all duration-300 text-sm md:text-base whitespace-nowrap ${
                  view === tab
                    ? 'bg-white text-blue-600 shadow-md transform scale-[1.02]'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab === 'recent' && 'Recent Result'}
                {tab === 'past' && 'Past Results'}
                {tab === 'top' && 'Top Rankings'}
              </button>
            ))}
          </div>
        </div>

{/* Recent Result View */}
        {view === 'recent' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-md mx-auto">
            
            {recentResults.length > 0 ? (
              recentResults.map((result) => (
                <div key={result._id} className="bg-white/95 backdrop-blur-3xl rounded-[2rem] shadow-2xl p-6 md:p-8 border border-white/60 relative overflow-hidden group hover:shadow-blue-200/50 transition-all duration-300">
                  {/* Elegant Decorative Gradients */}
                  <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-50/80 to-transparent pointer-events-none"></div>
                  <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-100/40 rounded-full blur-3xl pointer-events-none mix-blend-multiply"></div>

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100/80">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200 ring-4 ring-blue-50">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.585 51.37 51.37 0 00-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800 leading-tight">Academic Report</h2>
                        <p className="text-xs text-blue-500 font-bold uppercase tracking-widest mt-0.5">Latest Result</p>
                      </div>
                    </div>
                    
                    {/* Details List */}
                    <div className="space-y-4">
                      {/* Student Info Group */}
                      <div className="bg-gray-50/80 rounded-2xl p-5 space-y-3.5 border border-gray-100/80">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-sm font-semibold">Full Name</span>
                          <span className="text-gray-900 font-bold text-sm text-right max-w-[60%] truncate">{student.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-sm font-semibold">Index Number</span>
                          <span className="text-gray-800 font-mono font-bold text-xs bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm">{student.indexNumber}</span>
                        </div>
                         <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-sm font-semibold">Grade</span>
                          <span className="text-gray-900 font-bold text-sm bg-white w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 shadow-sm">{student.grade}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-sm font-semibold">Class</span>
                          <span className="text-gray-900 font-bold text-sm">{student.classId.name}</span>
                        </div>
                      </div>

                      {/* Result Info Group */}
                      <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl p-5 space-y-4 border border-blue-100/60 shadow-inner">
                        <div className="flex items-start justify-between">
                          <span className="text-blue-900/60 text-sm font-bold uppercase tracking-wide mt-1">Paper</span>
                          <div className="text-right flex flex-col items-end">
                            <span className="text-gray-900 font-black text-lg leading-tight">{result.paperId.name}</span>
                            {result.paperId.isMainPaper && (
                              <span className="mt-1.5 text-[10px] bg-blue-600 text-white px-2.5 py-0.5 rounded-full shadow-md shadow-blue-200 uppercase tracking-wider font-bold">
                                Main Paper
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 mt-1 border-t border-blue-200/40">
                           <div className="flex items-center justify-between">
                            <span className="text-blue-900/60 font-bold text-sm uppercase tracking-wide">Total Marks</span>
                            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 drop-shadow-sm">
                              {result.paperId.isMainPaper ? result.totalMarks : result.marks}
                            </span>
                          </div>
                        </div>
                        
                        {result.paperId.isMainPaper && (
                           <div className="grid grid-cols-2 gap-3 mt-1">
                             <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100 text-center shadow-sm">
                               <span className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5">Part 1</span>
                               <span className="text-lg font-black text-gray-700">{result.part1Marks}</span>
                             </div>
                             <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100 text-center shadow-sm">
                               <span className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5">Part 2</span>
                               <span className="text-lg font-black text-gray-700">{result.part2Marks}</span>
                             </div>
                           </div>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-gray-400 font-medium uppercase tracking-widest opacity-80">
                       <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                       Result Released on {new Date(result.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg p-12 text-center border border-white/50">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg font-medium">
                  No recent results available
                </p>
              </div>
            )}
          </div>
        )}

        {/* Past Results View */}
        {view === 'past' && (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 border border-white/50">
            {/* Filter Toggle for Grade 5 */}
            {student.grade === 5 && pastResults.length > 0 && (
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setPastFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                      pastFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    All Papers
                  </button>
                  <button
                    onClick={() => setPastFilter('main')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                      pastFilter === 'main'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Main Papers
                  </button>
                  <button
                    onClick={() => setPastFilter('normal')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                      pastFilter === 'normal'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Normal Papers
                  </button>
                </div>
              </div>
            )}
            
            {pastResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-blue-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">
                        Paper Name
                      </th>
                      {student.grade === 5 && (
                        <>
                          <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">
                            Part 1
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">
                            Part 2
                          </th>
                        </>
                      )}
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">
                        {student.grade === 5 ? 'Total Marks' : 'Marks'}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-600 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pastResults
                      .filter((result) => {
                        if (student.grade !== 5 || pastFilter === 'all') return true;
                        if (pastFilter === 'main') return result.paperId.isMainPaper;
                        return !result.paperId.isMainPaper;
                      })
                      .map((result) => (
                        <tr
                          key={result._id}
                          className="hover:bg-blue-50/30 transition-colors group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                            {result.paperId.name}
                            {result.paperId.isMainPaper && (
                              <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                                MAIN
                              </span>
                            )}
                          </td>
                          {student.grade === 5 && result.paperId.isMainPaper && (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                {result.part1Marks}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                {result.part2Marks}
                              </td>
                            </>
                          )}
                          {student.grade === 5 && !result.paperId.isMainPaper && (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                -
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                -
                              </td>
                            </>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 group-hover:text-blue-700">
                            {result.paperId.isMainPaper
                              ? result.totalMarks
                              : result.marks}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 border border-white/50">
            {/* Filter Toggle for Grade 5 */}
            {student.grade === 5 && topResults.length > 0 && (
              <div className="p-6 border-b border-gray-100">
                <div className="flex gap-2">
                  <button
                    onClick={() => setTopFilter('main')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                      topFilter === 'main'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Main Paper
                  </button>
                  <button
                    onClick={() => setTopFilter('normal')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                      topFilter === 'normal'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Normal Papers
                  </button>
                </div>
              </div>
            )}
            
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-orange-500">🏆</span> Top {topLimit} Students
              </h2>
              {getFilteredTopResults().length > 0 ? (
                <div className="space-y-3">
                  {getFilteredTopResults().map((result, index, allResults) => {
                    const rank =
                      allResults.findIndex(
                        (r) => r.totalMarks === result.totalMarks
                      ) + 1;
                    const isCurrentStudent =
                      result.studentId.indexNumber === params.indexNumber;
                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                          isCurrentStudent
                            ? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 shadow-md transform scale-[1.01]'
                            : 'bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm border-2 ${
                              rank === 1
                                ? 'bg-yellow-400 text-white border-yellow-300'
                                : rank === 2
                                ? 'bg-gray-300 text-gray-700 border-gray-200'
                                : rank === 3
                                ? 'bg-orange-400 text-white border-orange-300'
                                : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}
                          >
                            {rank}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 flex items-center gap-2">
                              {result.studentId.name}
                              {isCurrentStudent && (
                                <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500 font-mono">
                              {result.studentId.indexNumber}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-gray-800">
                            {result.totalMarks}
                          </p>
                          {result.part1Marks !== undefined &&
                            result.part2Marks !== undefined && (
                              <p className="text-xs text-gray-500 font-medium mt-1">
                                <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">P1: {result.part1Marks}</span>
                                <span className="mx-1 text-gray-300">|</span>
                                <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">P2: {result.part2Marks}</span>
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
