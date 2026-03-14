import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import connectDB from '@/lib/db/connect';
import Teacher from '@/models/Teacher';
import TeacherAssignment from '@/models/TeacherAssignment';
import Course from '@/models/Course';
import Student from '@/models/Student';
import User from '@/models/User';
import AcademicMark from '@/models/AcademicMark';
import AcademicTerm from '@/models/AcademicTerm';
import mongoose from 'mongoose';

// GET - Fetch teacher's assignments and student marks
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find teacher by userId
    const teacher = await Teacher.findOne({ userId: user._id });
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Get active term
    const terms = await AcademicTerm.find().sort({ createdAt: -1 });
    const activeTerm = terms.find(t => t.isActive);
    const currentTermName = activeTerm?.name || terms[0]?.name || 'Term 1';

    // Get teacher's assignments (all, not just with permission)
    // TeacherAssignment.teacherId stores the Teacher document's _id (not User's _id)
    // Also check for assignments with teacher.userId (User's _id) in case of data inconsistency
    const searchTerm = currentTermName || 'current';
    console.log('Fetching assignments for teacher._id:', teacher._id, 'teacher.userId:', teacher.userId, 'term:', searchTerm);
    
    let assignments = await TeacherAssignment.find({
      $or: [
        { teacherId: teacher._id },
        { teacherId: teacher.userId }
      ],
      term: { $in: [searchTerm, 'current'] }
    }).populate('courseId');
    
    console.log('Found assignments:', assignments.length);

    // If no assignments found, check teacher's subjects and create virtual assignments
    if (assignments.length === 0 && teacher.subjects && teacher.subjects.length > 0) {
      console.log('No assignments found, checking teacher subjects:', teacher.subjects);
      
      // Find courses that match teacher's subjects by name
      const courses = await Course.find({ 
        name: { $in: teacher.subjects }
      });
      
      console.log('Found matching courses:', courses.length);
      
      // Create virtual assignments from teacher's subjects
      if (courses.length > 0) {
        assignments = courses.map((course: any) => ({
          _id: `virtual-${course._id}`,
          teacherId: teacher.userId,
          courseId: course,
          course: {
            name: course.name,
            code: course.code,
            trade: course.trade,
            level: course.level
          },
          classId: null,
          term: searchTerm,
          permissionGranted: true,
          isVirtual: true
        }));
      }
    }

    // Format assignments with students and marks
    const formattedAssignments = await Promise.all(
      assignments.map(async (assignment: any) => {
        // Resolve the course document: prefer populated courseId, fall back to embedded course
        let course = assignment.isVirtual ? assignment.course : assignment.courseId;

        // If the populated courseId is missing or has no trade/level, fetch it directly
        if (!course || !course.trade || !course.level) {
          const rawCourseId = assignment.courseId?._id || assignment.courseId;
          if (rawCourseId) {
            const fetchedCourse = await Course.findById(rawCourseId).lean();
            if (fetchedCourse) course = fetchedCourse;
          }
        }

        // Also try the embedded course object as a last resort
        if (!course || !course.trade || !course.level) {
          const embedded = assignment.course;
          if (embedded && (embedded.trade || embedded.level)) {
            course = { ...course, ...embedded };
          }
        }

        // classId is not populated (to avoid MissingSchemaError); only use it if it has a name property
        const classInfo = assignment.classId && typeof assignment.classId === 'object' && assignment.classId.name
          ? assignment.classId
          : null;
        const courseData = course || null;
        
        // Find students for this course using trade and level from course
        let students = [];
        if (courseData && courseData.trade && courseData.level) {
          // Use trade and level from the course to fetch students
          students = await Student.find({
            trade: courseData.trade,
            level: courseData.level,
            admissionLetterStatus: 'confirmed'
          }).populate('userId', 'name email');
        } else if (classInfo) {
          // Fallback to class-based lookup (only when classId was populated)
          students = await Student.find({
            class: classInfo.name,
            level: classInfo.level,
            admissionLetterStatus: 'confirmed'
          }).populate('userId', 'name email');
        }

        // Get marks for all students in this course (only if we have a valid course)
        const courseObjectId = course?._id;
        const studentMarks = courseObjectId ? await AcademicMark.find({
          courseId: courseObjectId,
          term: currentTermName
        }) : [];

        // Map students with their marks
        const studentsWithMarks = students.map((student: any) => {
          const markRecord = studentMarks.find(
            m => m.studentId.toString() === student.userId._id.toString()
          );
          
          return {
            _id: student._id,
            registrationNumber: student.registrationNumber,
            name: student.userId?.name || 'Unknown',
            email: student.userId?.email || '',
            marks: markRecord?.marks || [],
            status: markRecord ? 
              (markRecord.published ? 'published' : 
               markRecord.approved ? 'approved' : 
               markRecord.submitted ? 'submitted' : 'draft') : 'draft',
            submittedAt: markRecord?.submittedAt,
            rejectionReason: markRecord?.rejectionReason || null,
            updatedAt: markRecord?.updatedAt
          };
        });

        return {
          _id: assignment._id.toString(),
          course: {
            _id: course?._id?.toString() || '',
            name: course?.name || 'Unknown',
            code: course?.code || '',
            trade: course?.trade || '',
            level: course?.level || ''
          },
          class: classInfo ? {
            _id: classInfo._id.toString(),
            name: classInfo.name,
            level: classInfo.level
          } : null,
          permissionGranted: assignment.permissionGranted,
          students: studentsWithMarks,
          totalStudents: studentsWithMarks.length,
          marksEntered: studentsWithMarks.filter(s => s.marks.length > 0).length
        };
      })
    );

    return NextResponse.json({
      assignments: formattedAssignments,
      term: currentTermName,
      teacher: {
        _id: teacher._id,
        name: user.name,
        department: teacher.department
      }
    });
  } catch (error) {
    console.error('Error fetching teacher marks:', error);
    return NextResponse.json({ error: 'Failed to fetch marks data' }, { status: 500 });
  }
}

// POST - Save or submit marks
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, studentMarks, action, term } = body;

    if (!courseId || !Array.isArray(studentMarks) || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find teacher by userId
    const teacher = await Teacher.findOne({ userId: user._id });
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Check if teacher has an assignment for this course and if permission is granted
    // Teachers can only enter marks if permission is granted by DOS
    // TeacherAssignment.teacherId stores the Teacher document's _id (not User's _id)
    // Also check for assignments with teacher.userId in case of data inconsistency
    let assignment = await TeacherAssignment.findOne({
      $or: [
        { teacherId: teacher._id },
        { teacherId: teacher.userId }
      ],
      courseId: new mongoose.Types.ObjectId(courseId),
      term: { $in: [term, 'current'] }
    });

    // If no assignment found, check if this is a virtual assignment (teacher's subject)
    if (!assignment) {
      if (teacher.subjects && teacher.subjects.length > 0) {
        const course = await Course.findById(courseId);
        if (course && teacher.subjects.includes(course.name)) {
          // For virtual assignments (teacher's subject without explicit assignment),
          // require explicit permission from DOS - default to false
          assignment = { _id: `virtual-${course._id}`, permissionGranted: false } as any;
        }
      }
    }

    if (!assignment) {
      return NextResponse.json({ error: 'You are not assigned to this course' }, { status: 403 });
    }

    // Check if permission is granted - if assignment has permissionGranted field, check it
    if (assignment.permissionGranted === false) {
      return NextResponse.json({ error: 'Permission denied. Please contact DOS to get permission to enter marks for this course.' }, { status: 403 });
    }

    // Check if already submitted and trying to edit
    const existingMarks = await AcademicMark.findOne({
      courseId: new mongoose.Types.ObjectId(courseId),
      term: term
    });

    if (existingMarks?.submitted && action === 'save') {
      // Allow saving draft if rejected (has rejection reason) or not yet approved/published
      if (existingMarks.rejectionReason || (!existingMarks.approved && !existingMarks.published)) {
        // Can edit draft
      } else {
        return NextResponse.json({ error: 'Marks already submitted and approved. Cannot edit.' }, { status: 403 });
      }
    }

    // Process each student's marks
    const results = {
      saved: 0,
      errors: [] as string[]
    };

    for (const studentMark of studentMarks) {
      try {
        const { studentId, marks } = studentMark;

        // studentId from frontend is the Student document's _id.
        // AcademicMark.studentId references User, so we need the student's userId.
        const studentDoc = await Student.findById(studentId).select('userId');
        if (!studentDoc) {
          results.errors.push(`Student not found: ${studentId}`);
          continue;
        }
        const studentUserId = studentDoc.userId;

        // If marks is empty or undefined, use default empty marks
        const processedMarks = (marks && marks.length > 0 ? marks : []).map((mark: any) => ({
          ...mark,
          score: mark.score === '' || mark.score === null || mark.score === undefined ? 0 : Number(mark.score)
        }));

        // Validate marks
        for (const mark of processedMarks) {
          if (mark.score < 0 || mark.score > mark.maxScore) {
            results.errors.push(`Invalid score for ${mark.assessment}: ${mark.score}/${mark.maxScore}`);
            continue;
          }
        }

        // Find existing mark record or create new one
        let markRecord = await AcademicMark.findOne({
          studentId: studentUserId,
          courseId: new mongoose.Types.ObjectId(courseId),
          term: term
        });

        if (markRecord) {
          // Update existing record
          markRecord.marks = processedMarks;
          markRecord.teacherId = teacher.userId;
          
          if (action === 'submit') {
            markRecord.submitted = true;
            markRecord.submittedAt = new Date();
          }
          
          await markRecord.save();
        } else {
          // Create new record for save or submit actions (even if marks are all zeros)
          await AcademicMark.create({
            studentId: studentUserId,
            courseId: new mongoose.Types.ObjectId(courseId),
            teacherId: teacher.userId,
            term: term,
            marks: processedMarks,
            submitted: action === 'submit',
            approved: false,
            published: false,
            submittedAt: action === 'submit' ? new Date() : undefined
          });
        }
        
        results.saved++;
      } catch (err: any) {
        results.errors.push(`Error saving marks for student: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: action === 'submit' ? 'Marks submitted successfully' : 'Draft saved successfully',
      results
    });
  } catch (error) {
    console.error('Error saving marks:', error);
    return NextResponse.json({ error: 'Failed to save marks' }, { status: 500 });
  }
}
