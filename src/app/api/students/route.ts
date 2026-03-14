import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import connectToDatabase from '@/lib/db/connect';
import Student from '@/models/Student';
import mongoose from 'mongoose';

interface PopulatedUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
}

interface PopulatedStudent {
  _id: mongoose.Types.ObjectId;
  userId: PopulatedUser | null;
  registrationNumber: string;
  class: string;
  level: string;
  trade: string;
  gender?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: Date;
  admissionLetterStatus: string;
  createdAt: Date;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated (DOS, admin, secretary, etc.)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Fetch all students with their user data (name, email)
    const students = await Student.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Transform the data to match the expected format
    const transformedStudents = students.map((student: PopulatedStudent) => ({
      _id: student._id,
      registrationNumber: student.registrationNumber,
      name: student.userId?.name || '',
      email: student.userId?.email || '',
      class: student.class,
      level: student.level,
      trade: student.trade,
      gender: student.gender,
      phoneNumber: student.phoneNumber,
      address: student.address,
      dateOfBirth: student.dateOfBirth,
      admissionLetterStatus: student.admissionLetterStatus,
      createdAt: student.createdAt,
    }));

    return NextResponse.json(transformedStudents);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
