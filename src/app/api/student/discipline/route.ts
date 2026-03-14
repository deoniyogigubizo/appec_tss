import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import connectToDatabase from '@/lib/db/connect';
import Student from '@/models/Student';
import User from '@/models/User';
import DisciplineMark from '@/models/DisciplineMark';

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

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Get all discipline records
    const discipline = await DisciplineMark.find({ studentId: user._id })
      .sort({ createdAt: -1 })
      .populate('incidents.enteredBy', 'name role');

    const formattedDiscipline = discipline.map(d => ({
      _id: d._id,
      term: d.term,
      incidents: d.incidents.map(i => ({
        date: i.date,
        description: i.description,
        points: i.points,
        enteredBy: (i.enteredBy as unknown as { role?: string })?.role || 'DOD',
        feedback: i.description.includes('community service') || i.points > 0 
          ? 'Great job! Keep up the positive behavior.' 
          : 'Please maintain better conduct in the future.'
      })),
      totalPoints: d.totalPoints
    }));

    return NextResponse.json({ 
      discipline: formattedDiscipline
    });
  } catch (error) {
    console.error('Error fetching discipline data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
