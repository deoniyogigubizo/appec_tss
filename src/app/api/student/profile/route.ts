import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import connectToDatabase from '@/lib/db/connect';
import Student from '@/models/Student';
import User from '@/models/User';
import Demonessa from '@/models/Demonessa';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Find user by email
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find student by userId
    const student = await Student.findOne({ userId: user._id });

    // If no student record, check for demonessa record
    if (!student) {
      const demonessa = await Demonessa.findOne({ email: session.user.email });
      
      if (demonessa) {
        // Return demonessa data in student format
        return NextResponse.json({ 
          student: {
            _id: demonessa._id,
            registrationNumber: demonessa.examinationCode,
            class: demonessa.admittedSchool,
            level: demonessa.level,
            trade: demonessa.admittedTrade,
            dateOfBirth: demonessa.dateOfBirth,
            gender: demonessa.gender,
            address: demonessa.address,
            phoneNumber: demonessa.phone,
            isDemonessa: true,
            fullname: demonessa.fullname,
            admissionLetterStatus: 'confirmed',
            createdAt: demonessa.createdAt,
          },
          demonessa: true
        });
      }
      
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      student: {
        _id: student._id,
        registrationNumber: student.registrationNumber,
        class: student.class,
        level: student.level,
        trade: student.trade,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        address: student.address,
        phoneNumber: student.phoneNumber,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        admissionLetterStatus: student.admissionLetterStatus,
        createdAt: student.createdAt,
      },
      demonessa: false
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
