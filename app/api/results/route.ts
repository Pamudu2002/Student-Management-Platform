import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Result from '@/models/Result';
import Paper from '@/models/Paper';
import Student from '@/models/Student';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { studentId, paperId, classId, marks, part1Marks, part2Marks } =
      await request.json();

    if (!studentId || !paperId || !classId) {
      return NextResponse.json(
        { error: 'Student ID, Paper ID, and Class ID are required' },
        { status: 400 }
      );
    }

    const paper = await Paper.findById(paperId);
    const student = await Student.findById(studentId);

    if (!paper || !student) {
      return NextResponse.json(
        { error: 'Paper or Student not found' },
        { status: 404 }
      );
    }

    let totalMarks = 0;
    let resultData: any = {
      studentId,
      paperId,
      classId,
      grade: student.grade,
    };

    if (paper.isMainPaper) {
      if (part1Marks === undefined || part2Marks === undefined) {
        return NextResponse.json(
          { error: 'Part 1 and Part 2 marks are required for main paper' },
          { status: 400 }
        );
      }
      totalMarks = part1Marks + part2Marks;
      resultData.part1Marks = part1Marks;
      resultData.part2Marks = part2Marks;
    } else {
      if (marks === undefined) {
        return NextResponse.json(
          { error: 'Marks are required' },
          { status: 400 }
        );
      }
      totalMarks = marks;
      resultData.marks = marks;
    }

    resultData.totalMarks = totalMarks;

    const existingResult = await Result.findOne({ studentId, paperId });

    if (existingResult) {
      const updatedResult = await Result.findByIdAndUpdate(
        existingResult._id,
        resultData,
        { new: true }
      );

      return NextResponse.json(
        {
          message: 'Result updated successfully',
          result: updatedResult,
        },
        { status: 200 }
      );
    }

    const newResult = await Result.create(resultData);

    return NextResponse.json(
      {
        message: 'Result created successfully',
        result: newResult,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save result' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const paperId = searchParams.get('paperId');
    const classId = searchParams.get('classId');

    let filter: any = {};
    if (studentId) filter.studentId = studentId;
    if (paperId) filter.paperId = paperId;
    if (classId) filter.classId = classId;

    const results = await Result.find(filter)
      .populate('studentId')
      .populate('paperId')
      .populate('classId')
      .sort({ totalMarks: -1 });

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}
