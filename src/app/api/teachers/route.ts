import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db/connect';
import Teacher from '@/models/Teacher';
import User from '@/models/User';

// Trade and Level types
type TradeType = 'CSA' | 'BDC' | 'ACC' | 'SWD';
type LevelType = 'L3' | 'L4' | 'L5';

export async function GET() {
  try {
    await connectDB();
    
    const teachers = await Teacher.find().populate('userId', 'name email').lean();
    
    // Format the teachers data
    const formattedTeachers = teachers.map((teacher: any) => ({
      _id: teacher._id.toString(),
      employeeId: teacher.employeeId,
      department: teacher.department,
      trade: teacher.trade || '',
      level: teacher.level || '',
      subjects: teacher.subjects || [],
      phoneNumber: teacher.phoneNumber || '',
      gender: teacher.gender || '',
      address: teacher.address || '',
      isActive: teacher.isActive || false,
      assignedToDos: teacher.assignedToDos || false,
      userId: teacher.userId ? {
        _id: teacher.userId._id?.toString() || teacher.userId.toString(),
        name: teacher.userId.name,
        email: teacher.userId.email
      } : null,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt
    }));
    
    return NextResponse.json(formattedTeachers, { status: 200 });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { name, email, password, employeeId, department, phoneNumber, gender, address } = body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }
    
    // Check if employeeId already exists
    const existingTeacher = await Teacher.findOne({ employeeId });
    if (existingTeacher) {
      return NextResponse.json({ error: 'Teacher with this employee ID already exists' }, { status: 400 });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user first - default isActive to false so they can't login until assigned courses
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'teacher'
    });
    
    // Create teacher profile with default isActive to false
    // Automatically assign to DOS so they can add courses
    const teacher = await Teacher.create({
      userId: user._id,
      employeeId,
      department,
      phoneNumber: phoneNumber || '',
      gender: gender || '',
      address: address || '',
      isActive: false, // Cannot login until assigned courses by DOS
      assignedToDos: true // Automatically assigned to DOS for course assignment
    });
    
    return NextResponse.json({
      message: 'Teacher created successfully. Teacher has been assigned to DOS for course assignment.',
      teacher: {
        _id: teacher._id.toString(),
        employeeId: teacher.employeeId,
        department: teacher.department,
        isActive: teacher.isActive,
        assignedToDos: teacher.assignedToDos,
        userId: {
          _id: user._id.toString(),
          name: user.name,
          email: user.email
        }
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 });
  }
}

// PUT - Update teacher or assign to DOS
export async function PUT(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { teacherId, action, ...updateData } = body;
    
    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 });
    }
    
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }
    
    // Handle different actions
    if (action === 'assignToDos') {
      // Mark teacher as assigned to DOS
      teacher.assignedToDos = true;
      await teacher.save();
      
      return NextResponse.json({
        message: 'Teacher assigned to DOS successfully',
        teacher: {
          _id: teacher._id.toString(),
          assignedToDos: teacher.assignedToDos
        }
      }, { status: 200 });
    }
    
    if (action === 'activate') {
      // Activate teacher (allow login) - only after courses are assigned
      teacher.isActive = true;
      await teacher.save();
      
      return NextResponse.json({
        message: 'Teacher activated successfully. Teacher can now login.',
        teacher: {
          _id: teacher._id.toString(),
          isActive: teacher.isActive
        }
      }, { status: 200 });
    }
    
    if (action === 'deactivate') {
      // Deactivate teacher (disallow login)
      teacher.isActive = false;
      await teacher.save();
      
      return NextResponse.json({
        message: 'Teacher deactivated successfully',
        teacher: {
          _id: teacher._id.toString(),
          isActive: teacher.isActive
        }
      }, { status: 200 });
    }
    
    // Default: update teacher fields
    if (updateData.trade) {
      const validTrades = ['CSA', 'BDC', 'ACC', 'SWD'];
      if (!validTrades.includes(updateData.trade)) {
        return NextResponse.json({ error: 'Invalid trade' }, { status: 400 });
      }
      teacher.trade = updateData.trade;
    }
    
    if (updateData.level) {
      const validLevels = ['L3', 'L4', 'L5'];
      if (!validLevels.includes(updateData.level)) {
        return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
      }
      teacher.level = updateData.level;
    }
    
    if (updateData.department) teacher.department = updateData.department;
    if (updateData.subjects) teacher.subjects = updateData.subjects;
    if (updateData.phoneNumber !== undefined) teacher.phoneNumber = updateData.phoneNumber;
    if (updateData.gender !== undefined) teacher.gender = updateData.gender;
    if (updateData.address !== undefined) teacher.address = updateData.address;
    
    await teacher.save();
    
    return NextResponse.json({
      message: 'Teacher updated successfully',
      teacher: {
        _id: teacher._id.toString(),
        employeeId: teacher.employeeId,
        department: teacher.department,
        trade: teacher.trade,
        level: teacher.level,
        subjects: teacher.subjects,
        isActive: teacher.isActive,
        assignedToDos: teacher.assignedToDos
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating teacher:', error);
    return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 });
  }
}

// DELETE - Remove teacher
export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('id');
    
    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 });
    }
    
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }
    
    // Delete the associated user as well
    if (teacher.userId) {
      await User.findByIdAndDelete(teacher.userId);
    }
    
    await Teacher.findByIdAndDelete(teacherId);
    
    return NextResponse.json({ message: 'Teacher deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json({ error: 'Failed to delete teacher' }, { status: 500 });
  }
}
