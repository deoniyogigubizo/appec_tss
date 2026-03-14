import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db/connect';
import User from '@/models/User';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import Course from '@/models/Course';
import DisciplineMark from '@/models/DisciplineMark';
import AcademicMark from '@/models/AcademicMark';

// Trade configuration
const TRADE_COURSES = {
  SWD: {
    name: 'Software Development',
    L3: [
      { name: 'Website Development', code: 'SWD-L3-WD' },
      { name: 'Game in Vue', code: 'SWD-L3-GV' },
      { name: 'JavaScript', code: 'SWD-L3-JS' },
      { name: 'Project Requirement', code: 'SWD-L3-PR' },
    ],
    L4: [
      { name: 'Database Development', code: 'SWD-L4-DB' },
      { name: 'Node JS', code: 'SWD-L4-NJ' },
      { name: 'Backend System Design', code: 'SWD-L4-BSD' },
    ],
    L5: [
      { name: 'NoSQL Database Development', code: 'SWD-L5-NDB' },
      { name: 'Blockchain', code: 'SWD-L5-BC' },
      { name: 'React Development', code: 'SWD-L5-RD' },
    ],
  },
  ACC: {
    name: 'Professional Accounting',
    L3: [
      { name: 'Financial S4', code: 'ACC-L3-FS4' },
      { name: 'Management S4', code: 'ACC-L3-MS4' },
      { name: 'Taxation S4', code: 'ACC-L3-TS4' },
    ],
    L4: [
      { name: 'Management S5', code: 'ACC-L4-MS5' },
      { name: 'Financial S5', code: 'ACC-L4-FS5' },
      { name: 'Taxation S5', code: 'ACC-L4-TS5' },
    ],
    L5: [
      { name: 'Management S6', code: 'ACC-L5-MS6' },
      { name: 'Taxation S6', code: 'ACC-L5-TS6' },
      { name: 'Financial S6', code: 'ACC-L5-FS6' },
    ],
  },
  CSA: {
    name: 'Computer System and Architecture',
    L3: [
      { name: 'Telephone', code: 'CSA-L3-TEL' },
      { name: 'Maintenance', code: 'CSA-L3-MAINT' },
      { name: 'Firmware', code: 'CSA-L3-FW' },
    ],
    L4: [
      { name: 'Solid Works', code: 'CSA-L4-SW' },
      { name: 'C Programming', code: 'CSA-L4-CP' },
      { name: 'C++ Programming', code: 'CSA-L4-CPP' },
    ],
    L5: [
      { name: 'Hobby Kernel', code: 'CSA-L5-HK' },
      { name: 'Cloud Computing', code: 'CSA-L5-CC' },
      { name: 'Windows Server', code: 'CSA-L5-WS' },
    ],
  },
  BDC: {
    name: 'Building and Construction',
    L3: [
      { name: 'Land Surveying', code: 'BDC-L3-LS' },
      { name: 'Cement', code: 'BDC-L3-CEM' },
      { name: 'Block', code: 'BDC-L3-BLK' },
    ],
    L4: [
      { name: 'Floor Plan', code: 'BDC-L4-FP' },
      { name: 'Drawing', code: 'BDC-L4-DRW' },
      { name: 'Concrete', code: 'BDC-L4-CON' },
    ],
    L5: [
      { name: 'Sand', code: 'BDC-L5-SND' },
      { name: 'Mechanism', code: 'BDC-L5-MCH' },
      { name: 'Quantity', code: 'BDC-L5-QTY' },
    ],
  },
};

const CORE_SUBJECTS = [
  'Mathematics',
  'Physics',
  'English',
  'Kiswahili',
  'French',
  'Computer Skills',
];

const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica',
  'James', 'Maria', 'Daniel', 'Lisa', 'William', 'Anna', 'Richard', 'Jennifer',
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
];

function getRandomName() {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}

function getRandomGender() {
  return Math.random() > 0.5 ? 'Male' : 'Female';
}

function getRandomPhone() {
  return '+254' + Math.random().toString().substring(2, 11);
}

function getRandomDOB() {
  const year = 2005 + Math.floor(Math.random() * 4);
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(year, month, day);
}

export async function GET() {
  try {
    console.log('Starting seed process...');
    await dbConnect();
    console.log('Database connected successfully');

    // Check if users already exist
    const existingUsers = await User.countDocuments();
    console.log('Existing users count:', existingUsers);
    
    if (existingUsers > 0) {
      const studentCount = await Student.countDocuments();
      return NextResponse.json(
        { 
          message: 'Database already seeded', 
          totalUsers: existingUsers,
          totalStudents: studentCount,
        },
        { status: 200 }
      );
    }

    // Create demo users with hashed passwords
    const hashedPassword = await bcrypt.hash('password123', 12);
    console.log('Password hashed successfully');

    // Create admin/staff users
    const users = [
      {
        email: 'admin@appec.edu',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'admin',
      },
      {
        email: 'secretary@appec.edu',
        password: hashedPassword,
        name: 'Mary Johnson',
        role: 'secretary',
      },
      {
        email: 'dos@appec.edu',
        password: hashedPassword,
        name: 'Dr. Robert Smith',
        role: 'dos',
      },
      {
        email: 'dod@appec.edu',
        password: hashedPassword,
        name: 'James Wilson',
        role: 'dod',
      },
      {
        email: 'hod@appec.edu',
        password: hashedPassword,
        name: 'Prof. Michael Brown',
        role: 'hod',
      },
      {
        email: 'teacher@appec.edu',
        password: hashedPassword,
        name: 'Sarah Davis',
        role: 'teacher',
      },
      {
        email: 'student@appec.edu',
        password: hashedPassword,
        name: 'John Student',
        role: 'student',
      },
    ];

    console.log('Inserting users:', users.map(u => u.email));
    
    // Insert users and get their IDs
    const createdUsers = await User.insertMany(users);
    console.log('Users inserted successfully, count:', createdUsers.length);

    // Find the teacher and student users to create profiles
    const teacherUser = createdUsers.find(u => u.email === 'teacher@appec.edu');
    const studentUser = createdUsers.find(u => u.email === 'student@appec.edu');
    const dodUser = createdUsers.find(u => u.email === 'dod@appec.edu');

    // Create Teacher profile
    if (teacherUser) {
      await Teacher.create({
        userId: teacherUser._id,
        employeeId: 'EMP001',
        department: 'Science',
        subjects: ['Mathematics', 'Physics'],
        phoneNumber: '+1234567890',
        gender: 'Female',
        address: '123 Teacher Street',
      });
      console.log('Teacher profile created');
    }

    // Create Student profile
    if (studentUser) {
      await Student.create({
        userId: studentUser._id,
        registrationNumber: 'STU2024001',
        class: 'Class 10-A',
        level: 'Grade 10',
        department: 'Science',
        admissionLetterStatus: 'confirmed',
        dateOfBirth: new Date('2008-05-15'),
        gender: 'Male',
        address: '456 Student Lane',
        phoneNumber: '+0987654321',
        parentName: 'Robert Student Sr.',
        parentPhone: '+1122334455',
      });
      console.log('Student profile created');
    }

    // Seed Courses
    console.log('Seeding courses...');
    const coursesArray: any[] = [];

    // Create core subjects for all trades and levels
    for (const [tradeKey, tradeData] of Object.entries(TRADE_COURSES)) {
      for (const level of ['L3', 'L4', 'L5']) {
        // Add core subjects
        for (const subject of CORE_SUBJECTS) {
          const code = `CORE-${tradeKey}-${level}-${subject.substring(0, 3).toUpperCase()}`;
          coursesArray.push({
            code,
            name: subject,
            description: `${subject} for ${(tradeData as any).name} Level ${level}`,
            credits: 3,
            department: 'General Education',
            trade: tradeKey,
            level,
          });
        }

        // Add trade-specific courses
        if ((tradeData as any)[level]) {
          for (const course of (tradeData as any)[level]) {
            coursesArray.push({
              code: course.code,
              name: course.name,
              description: `${course.name} for ${(tradeData as any).name} Level ${level}`,
              credits: 3,
              department: (tradeData as any).name,
              trade: tradeKey,
              level,
            });
          }
        }
      }
    }

    // Insert courses
    await Course.insertMany(coursesArray);
    console.log(`Courses seeded: ${coursesArray.length}`);

    // Seed comprehensive student data - 15 students per trade level
    console.log('Seeding students...');
    const trades = ['CSA', 'ACC', 'SWD', 'BDC'];
    const levels = ['L3', 'L4', 'L5'];
    const termsToCreate = ['Term 1 2026', 'Term 2 2026', 'Term 3 2026'];
    
    const studentUsers: any[] = [];
    const studentProfiles: any[] = [];
    const disciplineRecords: any[] = [];
    const academicMarkRecords: any[] = [];

    // Create all student users first
    for (const trade of trades) {
      for (const level of levels) {
        for (let i = 1; i <= 15; i++) {
          const tradeCode = trade.toLowerCase();
          const email = `st${tradeCode}${level.toLowerCase()}${String(i).padStart(3, '0')}@appec.edu`;
          
          studentUsers.push({
            email,
            password: hashedPassword,
            name: getRandomName(),
            role: 'student',
          });
        }
      }
    }

    // Insert student users
    const createdStudentUsers = await User.insertMany(studentUsers);
    console.log(`Student users created: ${createdStudentUsers.length}`);

    // Create student profiles and related records
    let userIndex = 0;
    for (const trade of trades) {
      for (const level of levels) {
        for (let i = 1; i <= 15; i++) {
          const studentUserDoc = createdStudentUsers[userIndex];
          const tradeCode = trade.toLowerCase();
          const regNumber = `${tradeCode}${level.toLowerCase()}${String(i).padStart(3, '0')}`;
          const gender = getRandomGender();
          const dob = getRandomDOB();

          // Create student profile
          const studentProfile = await Student.create({
            userId: studentUserDoc._id,
            registrationNumber: regNumber,
            class: `${trade} ${level}`,
            level: level,
            trade: trade,
            admissionLetterStatus: 'confirmed',
            dateOfBirth: dob,
            gender: gender,
            address: `${Math.floor(Math.random() * 1000)} Student Lane, Nairobi`,
            phoneNumber: getRandomPhone(),
            parentName: getRandomName(),
            parentPhone: getRandomPhone(),
          });

          // Create discipline marks for each term (40 points per term)
          for (const term of termsToCreate) {
            const incidents = [];
            let remainingPoints = 40;
            
            // Distribute 40 points across random incidents
            while (remainingPoints > 0) {
              const incidentPoints = Math.min(Math.random() * 15 + 1 | 0, remainingPoints);
              incidents.push({
                date: new Date(2026, Math.random() * 11 | 0, Math.random() * 28 + 1 | 0),
                description: `Discipline Record - ${i}`,
                points: incidentPoints,
                enteredBy: dodUser?._id || createdUsers[0]._id,
              });
              remainingPoints -= incidentPoints;
            }

            await DisciplineMark.create({
              studentId: studentUserDoc._id,
              term: term,
              incidents: incidents,
              totalPoints: 40,
            });
          }

          // Create academic marks for courses
          const tradeCourses = TRADE_COURSES[trade];
          if (tradeCourses && (tradeCourses as any)[level]) {
            for (const term of termsToCreate) {
              // Core subjects
              for (const subject of CORE_SUBJECTS) {
                const courseCode = `CORE-${trade}-${level}-${subject.substring(0, 3).toUpperCase()}`;
                const course = await Course.findOne({ code: courseCode });
                if (course && teacherUser) {
                  await AcademicMark.create({
                    studentId: studentUserDoc._id,
                    courseId: course._id,
                    teacherId: teacherUser._id,
                    term: term,
                    marks: [
                      {
                        assessment: 'Continuous Assessment',
                        score: 0,
                        maxScore: 40,
                      },
                      {
                        assessment: 'Final Exam',
                        score: 0,
                        maxScore: 60,
                      },
                    ],
                    submitted: false,
                    approved: false,
                    published: false,
                  });
                }
              }

              // Trade-specific courses
              for (const course of (tradeCourses as any)[level]) {
                const dbCourse = await Course.findOne({ code: course.code });
                if (dbCourse && teacherUser) {
                  await AcademicMark.create({
                    studentId: studentUserDoc._id,
                    courseId: dbCourse._id,
                    teacherId: teacherUser._id,
                    term: term,
                    marks: [
                      {
                        assessment: 'Continuous Assessment',
                        score: 0,
                        maxScore: 40,
                      },
                      {
                        assessment: 'Final Exam',
                        score: 0,
                        maxScore: 60,
                      },
                    ],
                    submitted: false,
                    approved: false,
                    published: false,
                  });
                }
              }
            }
          }

          userIndex++;
        }
      }
    }

    const disciplineCount = await DisciplineMark.countDocuments();
    const academicCount = await AcademicMark.countDocuments();
    const studentCount = await Student.countDocuments();

    return NextResponse.json(
      { 
        message: 'Database seeded successfully', 
        userCount: createdUsers.length + createdStudentUsers.length,
        studentCount: studentCount,
        disciplineMarkCount: disciplineCount,
        academicMarkCount: academicCount,
        courseCount: coursesArray.length,
        credentials: {
          admin: 'admin@appec.edu / password123',
          secretary: 'secretary@appec.edu / password123',
          dos: 'dos@appec.edu / password123',
          dod: 'dod@appec.edu / password123',
          hod: 'hod@appec.edu / password123',
          teacher: 'teacher@appec.edu / password123',
          student: 'student@appec.edu / password123',
          sampleStudents: 'stcsa-l3-001@appec.edu / password123, stacc-l4-001@appec.edu / password123, stswd-l5-001@appec.edu / password123',
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
