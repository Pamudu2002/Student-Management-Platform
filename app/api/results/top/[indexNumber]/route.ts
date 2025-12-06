import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Result from '@/models/Result';
import Student from '@/models/Student';
import Paper from '@/models/Paper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ indexNumber: string }> }
) {
  try {
    await dbConnect();
    const { indexNumber } = await params;

    const student = await Student.findOne({
      indexNumber: indexNumber,
    }).populate('classId');

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Count total students in the class
    const totalStudents = await Student.countDocuments({
      classId: student.classId,
    });

    // Determine the limit for top results
    const limit = totalStudents > 10 ? 10 : 5;

    // For Grade 5, get all papers to show rankings for both main and normal papers
    // For other grades, just get the most recent paper
    let papers;
    if (student.grade === 5) {
      papers = await Paper.find({ classId: student.classId })
        .sort({ createdAt: -1 })
        .limit(10); // Get up to 10 most recent papers
    } else {
      papers = await Paper.findOne({ classId: student.classId })
        .sort({ createdAt: -1 })
        .limit(1);
      papers = papers ? [papers] : [];
    }

    if (!papers || papers.length === 0) {
      return NextResponse.json(
        { error: 'No papers found for this class' },
        { status: 404 }
      );
    }

    // Get the most recent paper for reference
    const recentPaper = papers[0];

    // Get paper IDs
    const paperIds = papers.map(p => p._id);

    // Get top results for all these papers
    const allResults = await Result.find({
      paperId: { $in: paperIds },
      classId: student.classId,
    })
      .populate('studentId')
      .populate('paperId')
      .sort({ totalMarks: -1 });

    // For Grade 5, we want to keep separate rankings for main and normal papers
    // So we don't group by student - we keep all their results
    // The frontend will filter based on paper type
    let topResults;
    if (student.grade === 5) {
      // Just take top results without grouping by student
      topResults = allResults.slice(0, limit * 3); // Give more results for filtering
    } else {
      // For other grades, group by student and keep only their best result
      const studentBestResults = new Map();
      for (const result of allResults) {
        const studentId = result.studentId._id.toString();
        if (!studentBestResults.has(studentId) || 
            result.totalMarks > studentBestResults.get(studentId).totalMarks) {
          studentBestResults.set(studentId, result);
        }
      }
      // Convert to array and sort by total marks
      topResults = Array.from(studentBestResults.values())
        .sort((a, b) => b.totalMarks - a.totalMarks)
        .slice(0, limit);
    }

    return NextResponse.json(
      {
        student,
        paper: recentPaper,
        topResults: topResults,
        limit,
        totalStudents,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch top results' },
      { status: 500 }
    );
  }
}
