import { NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import prisma from '@/src/app/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, university, role, program, bio } = body;

    // Validate input
    if (!name || !email || !password || !university || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user based on role
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        university,
        role,
      },
    });

    // Create profile based on role
    if (role === 'TEACHER') {
      await prisma.teacher.create({
        data: {
          userId: user.id,
          bio: bio || null,
        },
      });
    } else if (role === 'STUDENT') {
      await prisma.student.create({
        data: {
          userId: user.id,
          program: program || null,
        },
      });
    }

    return NextResponse.json(
      { message: 'User created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}