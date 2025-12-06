import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';

export async function POST() {
  try {
    await dbConnect();

    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    const existingAdmin = await Admin.findOne({ username });

    if (existingAdmin) {
      return NextResponse.json(
        { message: 'Admin already exists' },
        { status: 200 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({
      username,
      password: hashedPassword,
    });

    return NextResponse.json(
      { message: 'Default admin created successfully' },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to initialize admin' },
      { status: 500 }
    );
  }
}
