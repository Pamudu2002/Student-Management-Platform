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

    // Get the result for the recent paper
    const recentResult = await Result.findOne({
      studentId: student._id,
      paperId: recentPaper._id,
    })
      .populate('paperId')
      .populate('classId');

    if (!recentResult) {
      return NextResponse.json(
        { error: 'No result found for recent paper' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        student,
        result: recentResult,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch recent result' },
      { status: 500 }
    );
  }
}
