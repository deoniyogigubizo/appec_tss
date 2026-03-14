import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import connectToDatabase from '@/lib/db/connect';
import Student from '@/models/Student';
import User from '@/models/User';
import AcademicMark from '@/models/AcademicMark';
import AcademicTerm from '@/models/AcademicTerm';
import Course from '@/models/Course';
import TeacherAssignment from '@/models/TeacherAssignment';
import Class from '@/models/Class';
import Demonessa from '@/models/Demonessa';
import mongoose from 'mongoose';

function calculateGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'B-';
  if (score >= 60) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 50) return 'C-';
  if (score >= 45) return 'D+';
  if (score >= 40) return 'D';
  if (score >= 35) return 'D-';
  return 'F';
}

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
    let demonessaRecord = null;
    let studentLevel = '';
    let studentTrade = '';
    
    if (!student) {
      demonessaRecord = await Demonessa.findOne({ email: session.user.email });
      if (demonessaRecord) {
        studentLevel = demonessaRecord.level || '';
        studentTrade = demonessaRecord.admittedTrade || '';
      }
    }

    if (!student && !demonessaRecord) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Get level and trade from student or demonessa
    const level = student?.level || studentLevel;
    const trade = student?.trade || studentTrade;

    // Get all academic terms
    const terms = await AcademicTerm.find().sort({ createdAt: -1 });

    // Get active term
    const activeTerm = terms.find(t => t.isActive);
    const currentTermName = activeTerm?.name || terms[0]?.name || 'Term 1';

    // Find courses assigned to student's class
    // First, try to find the class that matches the student's class info
    const classMatch = await Class.findOne({
      name: student?.class,
      level: level
    });

    let assignedCourses: mongoose.Types.ObjectId[] = [];
    
    if (classMatch) {
      // Get teacher assignments for this class
      const teacherAssignments = await TeacherAssignment.find({
        classId: classMatch._id,
        term: currentTermName,
        permissionGranted: true
      }).populate('courseId');

      teacherAssignments.forEach((ta: any) => {
        if (ta.courseId?._id) {
          assignedCourses.push(ta.courseId._id);
        }
      });
    }

    // Also get courses based on level and trade/department
    // Try to match with various level formats
    let levelMatch = level;
    if (level?.includes('Form 1')) levelMatch = 'L3';
    else if (level?.includes('Form 2')) levelMatch = 'L4';
    else if (level?.includes('Form 3')) levelMatch = 'L5';
    
    // If we have a demonessa record with trade/level, use those directly
    if (demonessaRecord && level && trade) {
      levelMatch = level;
    }
    
    const levelCourses = await Course.find({
      $or: [
        { level: levelMatch },
        { trade: trade },
        { department: trade },
        { trade: trade?.toUpperCase() },
      ]
    });

    // Combine unique courses
    const allCourseIds = new Set([
      ...assignedCourses.map((c: mongoose.Types.ObjectId) => c.toString()),
      ...levelCourses.map((c: mongoose.Types.ObjectId) => c._id.toString())
    ]);

    let uniqueCourses;
    if (allCourseIds.size > 0) {
      uniqueCourses = await Course.find({
        _id: { $in: Array.from(allCourseIds) }
      });
    } else {
      // If no courses found based on student criteria, return all available courses
      uniqueCourses = await Course.find({});
    }

    // Get results for each term
    const termsWithResults = await Promise.all(
      terms.map(async (term) => {
        // Get all marks for this student (published or not)
        const allMarks = await AcademicMark.find({
          studentId: user._id,
          term: term.name
        }).populate('courseId');

        // Create a map of courseId to marks
        const marksMap = new Map<string, any>();
        allMarks.forEach(m => {
          const courseId = (m.courseId as any)?._id?.toString();
          if (courseId) {
            marksMap.set(courseId, m);
          }
        });

        // Combine unique courses with marks
        const results = uniqueCourses.map(course => {
          const courseIdStr = course._id.toString();
          const mark = marksMap.get(courseIdStr);
          
          if (mark) {
            const totalScore = mark.marks.reduce((sum: number, m: any) => sum + (m.score / m.maxScore) * 100, 0);
            return {
              _id: mark._id,
              courseName: course.name,
              courseCode: course.code,
              credits: course.credits,
              marks: mark.marks,
              totalScore: Math.round(totalScore),
              grade: calculateGrade(totalScore),
              published: mark.published
            };
          } else {
            // Course assigned but no marks yet
            return {
              _id: course._id,
              courseName: course.name,
              courseCode: course.code,
              credits: course.credits,
              marks: [],
              totalScore: 0,
              grade: '-',
              published: false
            };
          }
        });

        return {
          name: term.name,
          isActive: term.isActive,
          results
        };
      })
    );

    return NextResponse.json({ 
      terms: termsWithResults,
      assignedCourses: uniqueCourses.map(c => ({
        _id: c._id,
        name: c.name,
        code: c.code,
        credits: c.credits
      }))
    });
  } catch (error) {
    console.error('Error fetching student results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
