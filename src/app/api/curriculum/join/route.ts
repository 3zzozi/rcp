import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import prisma from '@/src/app/lib/db';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    const { code, studentId } = body;
    
    if (!code || !studentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if student ID matches session user
    if (session.user.studentId !== studentId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Find the curriculum with the given code
    const curriculum = await prisma.curriculum.findUnique({
      where: {
        uniqueCode: code,
      },
    });
    
    if (!curriculum) {
      return NextResponse.json(
        { error: 'Curriculum not found' },
        { status: 404 }
      );
    }
    
    // Check if student is already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_curriculumId: {
          studentId,
          curriculumId: curriculum.id,
        },
      },
    });
    
    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Already enrolled in this curriculum' },
        { status: 409 }
      );
    }
    
    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        curriculumId: curriculum.id,
      },
    });
    
    return NextResponse.json(
      { message: 'Successfully joined curriculum', curriculumId: curriculum.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error joining curriculum:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}