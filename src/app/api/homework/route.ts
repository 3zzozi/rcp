// app/api/homework/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import prisma from '@/src/app/lib/db';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    const { title, description, dueDate, type, lectureId } = body;
    
    // Validate required fields
    if (!title || !type || !lectureId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if the lecture exists and belongs to this teacher
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      include: {
        curriculum: {
          select: { teacherId: true }
        }
      }
    });
    
    if (!lecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      );
    }
    
    if (lecture.curriculum.teacherId !== session.user.teacherId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Create the homework
    const homework = await prisma.homework.create({
      data: {
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        type,
        lectureId
      }
    });
    
    return NextResponse.json(homework);
  } catch (error) {
    console.error('Error creating homework:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return more details for debugging
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error.message,
        name: error.name 
      },
      { status: 500 }
    );
  }}