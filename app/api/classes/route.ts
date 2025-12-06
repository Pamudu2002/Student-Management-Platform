import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Class from '@/models/Class';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { name, grade } = await request.json();

    if (!name || !grade) {
      return NextResponse.json(
        { error: 'Name and grade are required' },
        { status: 400 }
      );
    }

    if (![3, 4, 5].includes(grade)) {
      return NextResponse.json(
        { error: 'Grade must be 3, 4, or 5' },
        { status: 400 }
      );
    }

    const newClass = await Class.create({
      name,
      grade,
    });

    return NextResponse.json(
      {
        message: 'Class created successfully',
        class: newClass,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create class' },
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
    const grade = searchParams.get('grade');

    let filter = {};
    if (grade) {
      filter = { grade: parseInt(grade) };
    }

    const classes = await Class.find(filter).sort({ grade: 1, name: 1 });

    return NextResponse.json({ classes }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}
