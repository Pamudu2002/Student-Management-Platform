import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Result from '@/models/Result';
import Student from '@/models/Student';
import Paper from '@/models/Paper';

export async function GET(
  request: NextRequest,
  { params }: { params: { indexNumber: string } }
) {
  try {
    await dbConnect();

    const student = await Student.findOne({
      indexNumber: params.indexNumber,
    }).populate('classId');

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get the most recent paper for the student's class
    const recentPaper = await Paper.findOne({ classId: student.classId })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!recentPaper) {
      return NextResponse.json(
        { error: 'No papers found for this class' },
        { status: 404 }
      );
    }

    // Count total students in the class
    const totalStudents = await Student.countDocuments({
      classId: student.classId,
    });

    // Determine the limit for top results
    const limit = totalStudents > 10 ? 10 : 5;

    // Get top results for the recent paper
    const topResults = await Result.find({
      paperId: recentPaper._id,
      classId: student.classId,
    })
      .populate('studentId')
      .populate('paperId')
      .sort({ totalMarks: -1 })
      .limit(limit);

    return NextResponse.json(
      {
        student,
        paper: recentPaper,
        topResults,
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
