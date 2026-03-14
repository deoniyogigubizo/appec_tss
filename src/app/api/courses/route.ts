import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Course from '@/models/Course';
import TeacherAssignment from '@/models/TeacherAssignment';
import Teacher from '@/models/Teacher';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectDB();
    
    const courses = await Course.find().lean();
    
    // Get all teacher assignments to find current course teachers
    const assignments = await TeacherAssignment.find()
      .populate('teacherId', 'name email')
      .populate('courseId', 'name code trade level')
      .lean();
    
    // Create a map of courseId -> teacher info (most recent)
    const courseTeacherMap: Record<string, { teacherName: string; teacherId: string }> = {};
    assignments.forEach((assignment: any) => {
      // Only process assignments with both teacher and course
      if (assignment.teacherId && assignment.courseId) {
        const courseId = assignment.courseId._id?.toString() || assignment.courseId.toString();
        const teacher = assignment.teacherId;
        if (teacher.name) {
          courseTeacherMap[courseId] = {
            teacherName: teacher.name,
            teacherId: teacher._id?.toString() || teacher.toString()
          };
        }
      }
    });
    
    const formattedCourses = courses.map((course: any) => ({
      _id: course._id.toString(),
      code: course.code,
      name: course.name,
      description: course.description || '',
      credits: course.credits,
      department: course.department,
      trade: course.trade || '',
      level: course.level || '',
      currentTeacher: courseTeacherMap[course._id.toString()] || null,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    }));
    
    return NextResponse.json(formattedCourses, { status: 200 });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { code, name, description, credits, department, trade, level } = body;
    
    // Check if course code already exists
    const existingCourse = await Course.findOne({ code: code.toUpperCase() });
    if (existingCourse) {
      return NextResponse.json({ error: 'Course with this code already exists' }, { status: 400 });
    }
    
    const course = await Course.create({
      code: code.toUpperCase(),
      name,
      description: description || '',
      credits: credits || 3,
      department,
      trade: trade || '',
      level: level || ''
    });
    
    return NextResponse.json({
      message: 'Course created successfully',
      course: {
        _id: course._id.toString(),
        code: course.code,
        name: course.name,
        description: course.description,
        credits: course.credits,
        department: course.department,
        trade: course.trade,
        level: course.level
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}

// PUT - Assign courses to teacher
export async function PUT(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { teacherId, courseIds, term, replaceExisting, classId } = body;
    
    console.log('Assign courses request:', { teacherId, courseIds, term });
    
    if (!teacherId || !courseIds || !courseIds.length) {
      return NextResponse.json({ error: 'Teacher ID and course IDs are required' }, { status: 400 });
    }
    
    // Get the teacher
    const teacher = await Teacher.findById(teacherId);
    console.log('Teacher found:', teacher);
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }
    
    const results = {
      assigned: [] as string[],
      replaced: [] as string[],
      errors: [] as string[]
    };
    
    // Process each course
    for (const courseId of courseIds) {
      try {
        // Check if there's an existing assignment for this course
        const existingAssignment = await TeacherAssignment.findOne({ 
          courseId: courseId,
          term: term || 'current'
        });
        
        if (existingAssignment) {
          // Check if it's a different teacher
          if (existingAssignment.teacherId && existingAssignment.teacherId.toString() !== teacherId) {
            // Course is already assigned to another teacher
            results.errors.push(`Course is already assigned to another teacher`);
            continue;
          } else if (existingAssignment.teacherId && existingAssignment.teacherId.toString() === teacherId) {
            // Same teacher already has this course
            results.errors.push(`Course is already assigned to this teacher`);
            continue;
          } else if (!existingAssignment.teacherId) {
            // If there's an assignment but no teacher, assign it
            existingAssignment.teacherId = new mongoose.Types.ObjectId(teacherId);
            await existingAssignment.save();
            results.assigned.push(courseId);
            console.log('Updated assignment for course:', courseId, 'to teacher:', teacherId);
          }
        } else {
          // Create new assignment - ensure proper ObjectId conversion
          const courseObjectId = new mongoose.Types.ObjectId(courseId);
          const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
          
          // Get course details for embedding
          const courseDetails = await Course.findById(courseId);
          
          await TeacherAssignment.create({
            teacherId: teacherObjectId,
            courseId: courseObjectId,
            course: courseDetails ? {
              name: courseDetails.name,
              code: courseDetails.code,
              trade: courseDetails.trade,
              level: courseDetails.level
            } : undefined,
            classId: classId ? new mongoose.Types.ObjectId(classId) : null,
            term: term || 'current',
            permissionGranted: false
          });
          results.assigned.push(courseId);
          console.log('Created new assignment for course:', courseId, 'to teacher:', teacherId);
        }
      } catch (err) {
        console.error('Error assigning course:', err);
        results.errors.push(`Failed to assign course`);
      }
    }
    
    // If any courses were assigned/replaced, activate the teacher and update subjects
    console.log('Before activation check - isActive:', teacher.isActive, 'assigned:', results.assigned.length);
    if ((results.assigned.length > 0 || results.replaced.length > 0) && teacher.isActive === false) {
      teacher.isActive = true;
      await teacher.save();
      console.log('Teacher activated successfully');
    }
    
    // Update teacher's subjects array with assigned course names
    if (results.assigned.length > 0 || results.replaced.length > 0) {
      // Convert string IDs to MongoDB ObjectIds
      const assignedObjectIds = [...results.assigned, ...results.replaced].map(id => new mongoose.Types.ObjectId(id));
      
      const assignedCourseDetails = await Course.find({ _id: { $in: assignedObjectIds } });
      const courseNames = assignedCourseDetails.map(c => c.name);
      
      // Add new subjects to teacher's array, avoiding duplicates
      const currentSubjects = teacher.subjects || [];
      const newSubjects = [...new Set([...currentSubjects, ...courseNames])];
      teacher.subjects = newSubjects;
      await teacher.save();
      console.log('Teacher subjects updated:', newSubjects);
    }
    
    return NextResponse.json({
      message: `Assigned ${results.assigned.length} courses, replaced ${results.replaced.length} courses`,
      results
    }, { status: 200 });
  } catch (error) {
    console.error('Error assigning courses:', error);
    return NextResponse.json({ error: 'Failed to assign courses' }, { status: 500 });
  }
}
