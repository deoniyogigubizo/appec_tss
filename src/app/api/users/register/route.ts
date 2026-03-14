import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db/connect';
import User from '@/models/User';
import Student from '@/models/Student';
import AdmissionLetter from '@/models/AdmissionLetter';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      email,
      password,
      name,
      registrationNumber,
      class: studentClass,
      level,
      department,
      admissionToken,
    } = body;

    // Validate required fields
    if (!email || !password || !name || !registrationNumber || !studentClass || !level || !department) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify admission token if provided
    if (admissionToken) {
      const letter = await AdmissionLetter.findOne({
        token: admissionToken,
        status: 'issued',
      });

      if (!letter) {
        return NextResponse.json(
          { error: 'Invalid or expired admission token' },
          { status: 400 }
        );
      }

      // Mark token as used
      letter.status = 'used';
      await letter.save();
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Check if registration number already exists
    const existingStudent = await Student.findOne({ registrationNumber });
    if (existingStudent) {
      return NextResponse.json(
        { error: 'Registration number already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role: 'student',
    });

    // Create student profile
    await Student.create({
      userId: user._id,
      registrationNumber,
      class: studentClass,
      level,
      department,
      admissionLetterStatus: 'confirmed',
      admissionToken: admissionToken || undefined,
    });

    return NextResponse.json(
      { message: 'Student registered successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
