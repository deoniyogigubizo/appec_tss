#!/usr/bin/env node

const mongoose = require('mongoose');
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

// Define schemas
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'secretary', 'dos', 'dod', 'teacher', 'student', 'hod'], required: true },
}, { timestamps: true });

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  registrationNumber: { type: String, required: true, unique: true },
  class: { type: String, required: true },
  level: { type: String, required: true },
  department: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Student = mongoose.model('Student', studentSchema);
const DisciplineMark = mongoose.model('DisciplineMark', new mongoose.Schema({ studentId: mongoose.Schema.Types.ObjectId, term: String }, { timestamps: true }));
const AcademicMark = mongoose.model('AcademicMark', new mongoose.Schema({ studentId: mongoose.Schema.Types.ObjectId, courseId: mongoose.Schema.Types.ObjectId, term: String }, { timestamps: true }));

async function clearStudentData() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB successfully');

    // Find all student user IDs
    console.log('🔍 Finding all student users...');
    const studentUsers = await User.find({ role: 'student' });
    const studentUserIds = studentUsers.map(u => u._id);
    console.log(`Found ${studentUserIds.length} student users`);

    // Delete student-related data
    console.log('🗑️  Deleting student profiles...');
    const deletedStudents = await Student.deleteMany({ userId: { $in: studentUserIds } });
    console.log(`✓ Deleted ${deletedStudents.deletedCount} student profiles`);

    console.log('🗑️  Deleting discipline marks...');
    const deletedDiscipline = await DisciplineMark.deleteMany({ studentId: { $in: studentUserIds } });
    console.log(`✓ Deleted ${deletedDiscipline.deletedCount} discipline mark records`);

    console.log('🗑️  Deleting academic marks...');
    const deletedAcademic = await AcademicMark.deleteMany({ studentId: { $in: studentUserIds } });
    console.log(`✓ Deleted ${deletedAcademic.deletedCount} academic mark records`);

    console.log('🗑️  Deleting student user accounts...');
    const deletedUsers = await User.deleteMany({ _id: { $in: studentUserIds } });
    console.log(`✓ Deleted ${deletedUsers.deletedCount} student user accounts`);

    console.log('\n✅ All student data cleared successfully!');
    
    await mongoose.disconnect();
    console.log('✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Clear failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

clearStudentData();
