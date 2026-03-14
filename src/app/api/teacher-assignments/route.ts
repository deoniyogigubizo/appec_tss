import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import connectDB from '@/lib/db/connect';
import TeacherAssignment from '@/models/TeacherAssignment';
import Course from '@/models/Course';
import Teacher from '@/models/Teacher';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term') || 'current';
    const permissionFilter = searchParams.get('permission');
    const teacherFilter = searchParams.get('teacherId');
    const courseFilter = searchParams.get('courseId');
    
    const query: any = { term: { $in: [term, 'current'] } };
    
    if (teacherFilter) {
      query.teacherId = teacherFilter;
    }
    if (courseFilter) {
      query.courseId = courseFilter;
    }
    
    // Fetch assignments without population to avoid strictPopulate issues
    const assignments = await TeacherAssignment.find(query)
      .populate('teacherId', 'name email department')
      .populate('courseId', 'name code trade level')
      .lean();
    
    let formattedAssignments = assignments
      .filter((assignment: any) => assignment.teacherId != null && assignment.courseId != null)
      .map((assignment: any) => {
        const teacher = assignment.teacherId || {};
        const course = assignment.courseId || {};
        
        return {
          _id: assignment._id.toString(),
          teacherId: teacher._id?.toString() || teacher.toString() || '',
          teacher: {
            _id: teacher._id?.toString() || teacher.toString() || '',
            name: teacher.name || 'Unknown Teacher',
            email: teacher.email || '',
            department: teacher.department || ''
          },
          courseId: {
            _id: course._id?.toString() || course.toString(),
            name: course.name || '',
            code: course.code || '',
            trade: course.trade || '',
            level: course.level || ''
          },
          course: assignment.course ? {
            name: assignment.course.name || '',
            code: assignment.course.code || '',
            trade: assignment.course.trade || '',
            level: assignment.course.level || ''
          } : null,
          classId: assignment.classId ? {
            _id: assignment.classId.toString(),
            name: '',
            level: ''
          } : null,
          term: assignment.term,
          permissionGranted: assignment.permissionGranted,
          grantedBy: null,
          grantedAt: assignment.grantedAt,
          revokedBy: null,
          revokedAt: assignment.revokedAt,
          createdAt: assignment.createdAt,
          updatedAt: assignment.updatedAt
        };
      });
    
    // Filter by permission if specified
    if (permissionFilter === 'granted') {
      formattedAssignments = formattedAssignments.filter((a: any) => a.permissionGranted);
    } else if (permissionFilter === 'not_granted') {
      formattedAssignments = formattedAssignments.filter((a: any) => !a.permissionGranted);
    }
    
    return NextResponse.json(formattedAssignments, { status: 200 });
  } catch (error) {
    console.error('Error fetching teacher assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch teacher assignments' }, { status: 500 });
  }
}

// PUT - Update permission for an assignment
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const body = await request.json();
    const { assignmentId, permissionGranted, reason } = body;
    
    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }
    
    // Find current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Find the assignment
    const assignment = await TeacherAssignment.findById(assignmentId);
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }
    
    const wasGranted = assignment.permissionGranted;
    assignment.permissionGranted = permissionGranted;
    
    if (permissionGranted) {
      assignment.grantedBy = currentUser._id;
      assignment.grantedAt = new Date();
      assignment.revokedBy = null;
      assignment.revokedAt = null;
    } else {
      assignment.revokedBy = currentUser._id;
      assignment.revokedAt = new Date();
    }
    
    await assignment.save();
    
    // Populate the updated assignment for response
    await assignment.populate('teacherId', 'name email');
    await assignment.populate('courseId', 'name code');
    await assignment.populate('grantedBy', 'name');
    await assignment.populate('revokedBy', 'name');
    
    return NextResponse.json({
      success: true,
      message: permissionGranted ? 'Permission granted successfully' : 'Permission revoked successfully',
      assignment: {
        _id: assignment._id.toString(),
        permissionGranted: assignment.permissionGranted,
        grantedAt: assignment.grantedAt,
        grantedBy: assignment.grantedBy,
        revokedAt: assignment.revokedAt,
        revokedBy: assignment.revokedBy
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating permission:', error);
    return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 });
  }
}

// POST - Create new assignment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const body = await request.json();
    const { teacherId, courseId, classId, term, permissionGranted } = body;
    
    if (!teacherId || !courseId || !term) {
      return NextResponse.json({ error: 'Teacher, Course, and Term are required' }, { status: 400 });
    }
    
    // Check if assignment already exists
    const existing = await TeacherAssignment.findOne({
      teacherId: new mongoose.Types.ObjectId(teacherId),
      courseId: new mongoose.Types.ObjectId(courseId),
      term: term
    });
    
    if (existing) {
      return NextResponse.json({ error: 'Assignment already exists' }, { status: 409 });
    }
    
    // Fetch course details for embedding
    const courseDoc = await Course.findById(courseId);
    if (!courseDoc) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Create new assignment with embedded course
    const assignment = await TeacherAssignment.create({
      teacherId: new mongoose.Types.ObjectId(teacherId),
      courseId: new mongoose.Types.ObjectId(courseId),
      course: {
        name: courseDoc.name,
        code: courseDoc.code || '',
        trade: courseDoc.trade || '',
        level: courseDoc.level || ''
      },
      classId: classId ? new mongoose.Types.ObjectId(classId) : null,
      term: term,
      permissionGranted: permissionGranted || false
    });

    // Also update the teacher's subjects array to include this course
    const teacher = await Teacher.findById(teacherId);
    if (teacher) {
      // Add course name to teacher's subjects if not already present
      if (!teacher.subjects.includes(courseDoc.name)) {
        teacher.subjects = [...teacher.subjects, courseDoc.name];
        await teacher.save();
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Assignment created successfully',
      assignment: {
        _id: assignment._id.toString(),
        teacherId: assignment.teacherId.toString(),
        courseId: assignment.courseId.toString(),
        course: assignment.course,
        term: assignment.term,
        permissionGranted: assignment.permissionGranted
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}
