import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Paper from '@/models/Paper';
import Class from '@/models/Class';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { name, classId, isMainPaper } = await request.json();

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

    if (isMainPaper && classData.grade !== 5) {
      return NextResponse.json(
        { error: 'Main paper is only available for Grade 5' },
        { status: 400 }
      );
    }

    const newPaper = await Paper.create({
      name,
      classId,
      grade: classData.grade,
      isMainPaper: isMainPaper || false,
    });

    return NextResponse.json(
      {
        message: 'Paper created successfully',
        paper: newPaper,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create paper' },
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

    const papers = await Paper.find(filter)
      .populate('classId')
      .sort({ createdAt: -1 });

    return NextResponse.json({ papers }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch papers' },
      { status: 500 }
    );
  }
}
