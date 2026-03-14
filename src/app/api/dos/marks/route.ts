import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import connectDB from '@/lib/db/connect';
import AcademicMark from '@/models/AcademicMark';
import AcademicTerm from '@/models/AcademicTerm';
import Course from '@/models/Course';
import Student from '@/models/Student';
import User from '@/models/User';
import mongoose from 'mongoose';

// GET - Fetch all submitted marks for DOS review
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get active term
    const terms = await AcademicTerm.find().sort({ createdAt: -1 });
    const activeTerm = terms.find(t => t.isActive);
    const currentTermName = activeTerm?.name || terms[0]?.name || 'Term 1';

    // Fetch all submitted marks (draft marks are not shown to DOS)
    // Include marks that are: submitted, approved, rejected, or published
    const allMarks = await AcademicMark.find({
      submitted: true
    })
    .populate('courseId', 'name code level trade department')
    .populate('studentId', 'name email')
    .populate('teacherId', 'name email')
    .sort({ submittedAt: -1 });

    // Transform the data to match what DOS page expects
    const formattedMarks = await Promise.all(
      allMarks.map(async (mark: any) => {
        // Get student details
        const student = await Student.findOne({ userId: mark.studentId._id });
        
        // Get course details
        const course = mark.courseId;

        // Calculate total marks
        const totalScore = mark.marks.reduce((sum: number, m: any) => sum + (m.score / m.maxScore) * 100, 0);

        // Determine status based on submitted, approved, published flags
        let status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'published' = 'submitted';
        if (mark.published) {
          status = 'published';
        } else if (mark.approved) {
          status = 'approved';
        } else if (!mark.submitted) {
          status = 'draft';
        }

        // Extract individual assessment marks
        const marksObj: {
          midterm?: number;
          finalExam?: number;
          labWork?: number;
        } = {};
        
        mark.marks.forEach((m: any) => {
          const assessmentLower = m.assessment.toLowerCase();
          if (assessmentLower.includes('midterm')) {
            marksObj.midterm = m.score;
          } else if (assessmentLower.includes('final')) {
            marksObj.finalExam = m.score;
          } else if (assessmentLower.includes('lab')) {
            marksObj.labWork = m.score;
          }
        });

        return {
          _id: mark._id.toString(),
          studentId: mark.studentId._id.toString(),
          studentName: mark.studentId.name || 'Unknown',
          registrationNumber: student?.registrationNumber || 'N/A',
          course: course?.name || 'Unknown',
          courseId: course?._id?.toString() || '',
          term: mark.term,
          level: course?.level || '',
          trade: course?.trade || '',
          marks: marksObj,
          marksDetails: mark.marks, // Full marks details
          totalScore: Math.round(totalScore),
          status,
          submittedBy: mark.teacherId?.name || 'Unknown',
          submittedAt: mark.submittedAt?.toISOString() || null,
          approvedBy: mark.approved ? 'DOS' : null,
          approvedAt: mark.approvedAt?.toISOString() || null,
          createdAt: mark.createdAt.toISOString(),
          updatedAt: mark.updatedAt.toISOString()
        };
      })
    );

    return NextResponse.json(formattedMarks);
  } catch (error) {
    console.error('Error fetching DOS marks:', error);
    return NextResponse.json({ error: 'Failed to fetch marks data' }, { status: 500 });
  }
}

// PUT - Approve or reject marks
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { markId, action, rejectionReason } = body;

    if (!markId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    const mark = await AcademicMark.findById(markId);
    
    if (!mark) {
      return NextResponse.json({ error: 'Mark not found' }, { status: 404 });
    }

    if (action === 'approve') {
      mark.approved = true;
      mark.approvedAt = new Date();
      await mark.save();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Mark approved successfully',
        mark 
      });
    } else if (action === 'reject') {
      // Rejection means the marks need to be revised
      // Reset submitted status so teacher can edit
      mark.submitted = false;
      mark.submittedAt = undefined;
      mark.rejectionReason = rejectionReason;
      await mark.save();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Mark rejected - teacher can now revise',
        mark 
      });
    } else if (action === 'publish') {
      mark.published = true;
      await mark.save();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Marks published successfully',
        mark 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating marks:', error);
    return NextResponse.json({ error: 'Failed to update marks' }, { status: 500 });
  }
}
