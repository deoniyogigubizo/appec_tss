import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Demonessa from '@/models/Demonessa';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'fullname',
      'email',
      'examinationCode',
      'phone',
      'address',
      'dateOfBirth',
      'gender',
      'nationality',
      'previousSchool',
      'admittedSchool',
      'admittedTrade',
      'level',
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate marks
    if (!body.result || !body.result.marks) {
      return NextResponse.json(
        { success: false, error: 'Missing marks data' },
        { status: 400 }
      );
    }

    const requiredMarks = [
      'biology',
      'math',
      'kinyarwanda',
      'chemistry',
      'history',
      'geography',
      'english',
      'entrepreneurship',
      'physics',
    ];

    for (const mark of requiredMarks) {
      if (body.result.marks[mark] === undefined || body.result.marks[mark] === null) {
        return NextResponse.json(
          { success: false, error: `Missing mark for: ${mark}` },
          { status: 400 }
        );
      }
    }

    // Check if email or examination code already exists
    const existingByEmail = await Demonessa.findOne({ email: body.email.toLowerCase() });
    if (existingByEmail) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      );
    }

    const existingByCode = await Demonessa.findOne({ examinationCode: body.examinationCode });
    if (existingByCode) {
      return NextResponse.json(
        { success: false, error: 'Examination code already used' },
        { status: 409 }
      );
    }

    // Create new record
    const demonessaRecord = await Demonessa.create({
      fullname: body.fullname.trim(),
      email: body.email.toLowerCase().trim(),
      examinationCode: body.examinationCode.trim(),
      phone: body.phone.trim(),
      address: body.address.trim(),
      dateOfBirth: new Date(body.dateOfBirth),
      gender: body.gender.toLowerCase(),
      nationality: body.nationality.trim(),
      previousSchool: body.previousSchool.trim(),
      admittedSchool: body.admittedSchool.trim(),
      admittedTrade: body.admittedTrade?.trim() || '',
      level: body.level?.trim() || '',
      program: body.program ? body.program.trim() : undefined,
      result: {
        marks: {
          biology: parseInt(body.result.marks.biology) || 0,
          math: parseInt(body.result.marks.math) || 0,
          kinyarwanda: parseInt(body.result.marks.kinyarwanda) || 0,
          chemistry: parseInt(body.result.marks.chemistry) || 0,
          history: parseInt(body.result.marks.history) || 0,
          geography: parseInt(body.result.marks.geography) || 0,
          english: parseInt(body.result.marks.english) || 0,
          entrepreneurship: parseInt(body.result.marks.entrepreneurship) || 0,
          physics: parseInt(body.result.marks.physics) || 0,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Record created successfully',
        data: demonessaRecord,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Demonessa API error:', error);

    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        { success: false, error: `${field} already exists` },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create record',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');
    const email = searchParams.get('email');

    let query: any = {};

    if (email) {
      query.email = email.toLowerCase();
    }

    const records = await Demonessa.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Demonessa.countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        data: records,
        pagination: {
          total,
          limit,
          skip,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Demonessa GET error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch records',
      },
      { status: 500 }
    );
  }
}
