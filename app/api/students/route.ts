import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import Class from '@/models/Class';
import { authOptions } from '@/lib/auth';

async function generateIndexNumber(grade: number): Promise<string> {
  const lastStudent = await Student.findOne({ grade }).sort({ indexNumber: -1 });

  let startingIndex = '0000001'; // Default fallback

  switch (grade) {
    case 3:
      startingIndex = '2804286';
      break;
    case 4:
      startingIndex = '2704286';
      break;
    case 5:
      startingIndex = '2604286';
      break;
    default:
      // Keep existing default or maybe throw error if only 3/4/5 allowed?
      // For now, let's stick to a safe default if not one of these specific grades,
      // or maybe just start at 1 if undefined behavior wasn't strictly specified for others.
      // But looking at previous code, it was 0000001.
      startingIndex = '0000001';
  }

  if (!lastStudent) {
    return startingIndex;
  }

  const lastNumber = parseInt(lastStudent.indexNumber);
  const newNumber = lastNumber + 1;

  return newNumber.toString().padStart(7, '0');
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { name, classId } = await request.json();

    if (!name || !classId) {
      return NextResponse.json(
        { error: 'Name and class ID are required' },
        { status: 400 }
      );
    }

    const classData = await Class.findById(classId);

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    const indexNumber = await generateIndexNumber(classData.grade);

    const newStudent = await Student.create({
      name,
      indexNumber,
      classId,
      grade: classData.grade,
    });

    return NextResponse.json(
      {
        message: 'Student added successfully',
        student: newStudent,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding student:', error);
    return NextResponse.json(
      { error: 'Failed to add student' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    let filter = {};
    if (classId) {
      filter = { classId };
    }

    const students = await Student.find(filter)
      .populate('classId')
      .sort({ indexNumber: 1 });

    return NextResponse.json({ students }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
