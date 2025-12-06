import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Result from '@/models/Result';
import Student from '@/models/Student';

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

    const pastResults = await Result.find({
      studentId: student._id,
    })
      .populate('paperId')
      .populate('classId')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        student,
        results: pastResults,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch past results' },
      { status: 500 }
    );
  }
}
