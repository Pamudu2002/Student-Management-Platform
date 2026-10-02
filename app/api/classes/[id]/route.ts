import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Class from '@/models/Class';
import Student from '@/models/Student';
import Paper from '@/models/Paper';
import Result from '@/models/Result';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const classData = await Class.findById(params.id);

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    return NextResponse.json({ class: classData }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch class' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { name, grade } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (![3, 4, 5].includes(grade)) {
      return NextResponse.json(
        { error: 'Grade must be 3, 4, or 5' },
        { status: 400 }
      );
    }

    const classData = await Class.findById(params.id);

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    const gradeChanged = classData.grade !== grade;

    // Main papers (Part 1 / Part 2) only exist for Grade 5 classes
    if (gradeChanged && grade !== 5) {
      const hasMainPapers = await Paper.exists({
        classId: params.id,
        isMainPaper: true,
      });

      if (hasMainPapers) {
        return NextResponse.json(
          {
            error:
              'This class has main papers, which are only allowed for Grade 5. Delete them before changing the grade.',
          },
          { status: 400 }
        );
      }
    }

    classData.name = name.trim();
    classData.grade = grade;
    await classData.save();

    // Students, papers and results store their own copy of the grade
    if (gradeChanged) {
      await Promise.all([
        Student.updateMany({ classId: params.id }, { grade }),
        Paper.updateMany({ classId: params.id }, { grade }),
        Result.updateMany({ classId: params.id }, { grade }),
      ]);
    }

    return NextResponse.json(
      { message: 'Class updated successfully', class: classData },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update class' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    await Class.findByIdAndDelete(params.id);
    await Student.deleteMany({ classId: params.id });

    return NextResponse.json(
      { message: 'Class deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete class' },
      { status: 500 }
    );
  }
}
