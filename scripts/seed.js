#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
let mongoUri = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/MONGODB_URI=(.+)/);
  if (match && match[1]) {
    mongoUri = match[1].trim();
  }
} catch (error) {
  console.error('❌ Error reading .env.local:', error.message);
  process.exit(1);
}

if (!mongoUri) {
  console.error('❌ Error: MONGODB_URI not found in .env.local');
  process.exit(1);
}

console.log('📦 Starting database seed process...');

// Core subjects available for all trades and levels
const CORE_SUBJECTS = [
  'Mathematics',
  'Physics',
  'English',
  'Kiswahili',
  'French',
  'Computer Skills',
];

// Trade-specific courses by level
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

// Define schemas
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['admin', 'secretary', 'dos', 'dod', 'teacher', 'student', 'hod'],
    required: true,
  },
}, {
  timestamps: true,
});

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
  },
  class: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
  trade: {
    type: String,
    required: true,
  },
  admissionLetterStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected'],
    default: 'pending',
  },
  admissionToken: {
    type: String,
    unique: true,
    sparse: true,
  },
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
  },
  address: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  parentName: {
    type: String,
  },
  parentPhone: {
    type: String,
  },
}, {
  timestamps: true,
});

const teacherSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
  },
  department: {
    type: String,
    required: true,
  },
  subjects: [{
    type: String,
  }],
  phoneNumber: {
    type: String,
  },
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
  },
  address: {
    type: String,
  },
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);
const Student = mongoose.model('Student', studentSchema);
const Teacher = mongoose.model('Teacher', teacherSchema);

// Define Course schema
const courseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  credits: {
    type: Number,
    required: true,
    default: 3,
  },
  department: {
    type: String,
    required: true,
  },
  trade: {
    type: String,
    enum: ['CSA', 'BDC', 'ACC', 'SWD'],
  },
  level: {
    type: String,
    enum: ['L3', 'L4', 'L5'],
  },
}, {
  timestamps: true,
});

const Course = mongoose.model('Course', courseSchema);

// Define DisciplineMark schema
const disciplineMarkSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  term: {
    type: String,
    required: true,
  },
  incidents: [{
    date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  }],
  totalPoints: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

const DisciplineMark = mongoose.model('DisciplineMark', disciplineMarkSchema);

// Define AcademicMark schema
const academicMarkSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  term: {
    type: String,
    required: true,
  },
  marks: [{
    assessment: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    maxScore: {
      type: Number,
      required: true,
    },
  }],
  submitted: {
    type: Boolean,
    default: false,
  },
  approved: {
    type: Boolean,
    default: false,
  },
  published: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const AcademicMark = mongoose.model('AcademicMark', academicMarkSchema);

// Student names data
const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica',
  'James', 'Maria', 'Daniel', 'Lisa', 'William', 'Anna', 'Richard', 'Jennifer',
  'Joseph', 'Mary', 'Thomas', 'Patricia', 'Charles', 'Barbara', 'Christopher', 'Nancy',
  'Matthew', 'Karen', 'Mark', 'Betty', 'Donald', 'Margaret', 'Steven', 'Sandra'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Young', 'Allen'
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

async function seed() {
  try {
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB successfully');

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Check if users already exist
    let createdUsers = await User.find({ role: { $ne: 'student' } });
    const existingUsers = await User.countDocuments();
    
    if (existingUsers === 0) {
      // Create users
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
      ];

      console.log('Creating users...');
      createdUsers = await User.insertMany(users);
      console.log(`✓ Created ${createdUsers.length} users`);
    } else {
      console.log(`ℹ️ Database already has ${existingUsers} users (skipping user creation).`);
    }

    // Find teacher and student users
    const teacherUser = createdUsers.find(u => u.email === 'teacher@appec.edu');

    // Create Teacher profile if not exists
    const existingTeacher = await Teacher.findOne({ userId: teacherUser?._id });
    if (teacherUser && !existingTeacher) {
      await Teacher.create({
        userId: teacherUser._id,
        employeeId: 'EMP001',
        department: 'Science',
        subjects: ['Mathematics', 'Physics'],
        phoneNumber: '+1234567890',
        gender: 'Female',
        address: '123 Teacher Street',
      });
      console.log('✓ Created teacher profile');
    }

    // Seed Courses
    console.log('\n📚 Seeding courses...');
    const coursesArray = [];

    // Create core subjects for all trades and levels
    for (const [tradeKey, tradeData] of Object.entries(TRADE_COURSES)) {
      for (const level of ['L3', 'L4', 'L5']) {
        // Add core subjects
        for (const subject of CORE_SUBJECTS) {
          const code = `CORE-${tradeKey}-${level}-${subject.substring(0, 3).toUpperCase()}`;
          coursesArray.push({
            code,
            name: subject,
            description: `${subject} for ${tradeData.name} Level ${level}`,
            credits: 3,
            department: 'General Education',
            trade: tradeKey,
            level,
          });
        }

        // Add trade-specific courses
        if (tradeData[level]) {
          for (const course of tradeData[level]) {
            coursesArray.push({
              code: course.code,
              name: course.name,
              description: `${course.name} for ${tradeData.name} Level ${level}`,
              credits: 3,
              department: tradeData.name,
              trade: tradeKey,
              level,
            });
          }
        }
      }
    }

    // Insert courses if they don't exist
    const existingCourses = await Course.countDocuments();
    if (existingCourses === 0) {
      await Course.insertMany(coursesArray);
      console.log(`✓ Created ${coursesArray.length} courses across all trades and levels`);
    } else {
      console.log(`⚠️ Courses already exist (${existingCourses} found). Skipping course creation...`);
    }

    // Seed Students - At least 10 per trade level
    console.log('\n👨‍🎓 Seeding students (10+ per trade level)...');
    const existingStudents = await Student.countDocuments();
    
    if (existingStudents === 0) {
      const trades = ['CSA', 'ACC', 'SWD', 'BDC'];
      const levels = ['L3', 'L4', 'L5'];
      const usersToCreate = [];

      // Check if student users already exist
      const studentUsersCount = await User.countDocuments({ role: 'student' });
      console.log(`Found ${studentUsersCount} existing student users`);

      let createdStudentUsers;

      // Create 15 students per trade-level combination if they don't exist
      if (studentUsersCount === 0) {
        // Create 15 students per trade-level (total: 4 * 3 * 15 = 180 students)
        for (const trade of trades) {
          for (const level of levels) {
            for (let i = 1; i <= 15; i++) {
              const tradeCode = trade.toLowerCase();
              const email = `st${tradeCode}${level.toLowerCase()}${String(i).padStart(3, '0')}@appec.edu`;
              
              usersToCreate.push({
                email,
                password: hashedPassword,
                name: getRandomName(),
                role: 'student',
              });
            }
          }
        }

        // Insert all users first
        console.log(`Creating ${usersToCreate.length} student user accounts...`);
        createdStudentUsers = await User.insertMany(usersToCreate);
        console.log(`✓ Created ${createdStudentUsers.length} student users`);
      } else {
        console.log(`Loading ${studentUsersCount} existing student users...`);
        createdStudentUsers = await User.find({ role: 'student' });
        console.log(`✓ Loaded ${createdStudentUsers.length} student users`);
      }

      // Create student profiles
      let userIndex = 0;
      const studentsData = [];
      const academicMarksData = [];
      const disciplineMarksData = [];
      const termsToCreate = ['Term 1 2026', 'Term 2 2026', 'Term 3 2026'];

      for (const trade of trades) {
        for (const level of levels) {
          for (let i = 1; i <= 15; i++) {
            const studentUser = createdStudentUsers[userIndex];
            const tradeCode = trade.toLowerCase();
            const regNumber = `${tradeCode}${level.toLowerCase()}${String(i).padStart(3, '0')}`;
            const gender = getRandomGender();
            const dob = getRandomDOB();

            // Create student profile
            studentsData.push({
              userId: studentUser._id,
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
                  enteredBy: createdUsers.find(u => u.role === 'dod')?._id || createdStudentUsers[0]._id,
                });
                remainingPoints -= incidentPoints;
              }

              disciplineMarksData.push({
                studentId: studentUser._id,
                term: term,
                incidents: incidents,
                totalPoints: 40,
              });
            }

            // Create academic marks for courses
            const tradeCourses = TRADE_COURSES[trade];
            if (tradeCourses && tradeCourses[level]) {
              // Get the teacher user for marks assignment
              const teacherUserForMarks = createdUsers.find(u => u.role === 'teacher');

              for (const term of termsToCreate) {
                // Core subjects
                for (const subject of CORE_SUBJECTS) {
                  const courseCode = `CORE-${trade}-${level}-${subject.substring(0, 3).toUpperCase()}`;
                  const course = await Course.findOne({ code: courseCode });
                  if (course && teacherUserForMarks) {
                    academicMarksData.push({
                      studentId: studentUser._id,
                      courseId: course._id,
                      teacherId: teacherUserForMarks._id,
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
                for (const course of tradeCourses[level]) {
                  const dbCourse = await Course.findOne({ code: course.code });
                  if (dbCourse && teacherUserForMarks) {
                    academicMarksData.push({
                      studentId: studentUser._id,
                      courseId: dbCourse._id,
                      teacherId: teacherUserForMarks._id,
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

      // Insert all student profiles
      if (studentsData.length > 0) {
        await Student.insertMany(studentsData);
        console.log(`✓ Created ${studentsData.length} student profiles`);
      }

      // Insert discipline marks in batches
      if (disciplineMarksData.length > 0) {
        await DisciplineMark.insertMany(disciplineMarksData);
        console.log(`✓ Created ${disciplineMarksData.length} discipline mark records`);
      }

      // Insert academic marks in batches
      if (academicMarksData.length > 0) {
        await AcademicMark.insertMany(academicMarksData);
        console.log(`✓ Created ${academicMarksData.length} academic mark records`);
      }

      console.log(`\n✅ Successfully created ${createdStudentUsers.length} students with:`);
      console.log(`   - ${disciplineMarksData.length} discipline mark records`);
      console.log(`   - ${academicMarksData.length} academic mark records ready for DOS publishing`);
    } else {
      console.log(`⚠️ Students already exist (${existingStudents} found). Skipping student creation...`);
    }

    console.log('\n✓ Database seeded successfully!\n');
    console.log('Demo Credentials:');
    console.log('━'.repeat(50));
    console.log('Admin Users:');
    console.log('  admin@appec.edu / password123');
    console.log('  secretary@appec.edu / password123');
    console.log('  dos@appec.edu / password123');
    console.log('  dod@appec.edu / password123');
    console.log('  hod@appec.edu / password123');
    console.log('\nTest Users:');
    console.log('  teacher@appec.edu / password123');
    console.log('  student@appec.edu / password123');
    console.log('\nSample Student Logins:');
    console.log('  stcsa-l3-001@appec.edu / password123');
    console.log('  stacc-l4-001@appec.edu / password123');
    console.log('  stswd-l5-001@appec.edu / password123');
    console.log('  stbdc-l3-001@appec.edu / password123');
    console.log('━'.repeat(50));

    await mongoose.disconnect();
    console.log('\n✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
