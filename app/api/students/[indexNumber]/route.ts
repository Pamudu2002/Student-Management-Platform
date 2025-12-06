import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';

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

    return NextResponse.json({ student }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch student' },
      { status: 500 }
    );
  }
}
