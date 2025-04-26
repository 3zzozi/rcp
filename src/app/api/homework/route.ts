// src/app/api/homework/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import prisma from '@/src/app/lib/db';
import { HomeworkType } from '@prisma/client';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user information
    console.log('Fetching user with ID:', session.user.id);
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teacherProfile: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user is a teacher
    if (!user.teacherProfile) {
      return NextResponse.json(
        { error: 'Only teachers can create homework' },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    const { title, description, dueDate, type, lectureId } = body;
    
    // Log received data for debugging
    console.log('Received homework data:', { title, description, dueDate, type, lectureId });
    
    // Validate required fields
    if (!title || !type || !lectureId) {
      return NextResponse.json(
        { error: 'Missing required fields: title, type, and lectureId are required' },
        { status: 400 }
      );
    }
    
    // Validate homework type - ensure it's a valid enum value
    if (!Object.values(HomeworkType).includes(type)) {
      return NextResponse.json(
        { 
          error: `Invalid homework type: ${type}. Must be one of: ${Object.values(HomeworkType).join(', ')}`,
          validTypes: Object.values(HomeworkType)
        },
        { status: 400 }
      );
    }
    
    // Check if the lecture exists
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
    
    // Check ownership
    if (lecture.curriculum.teacherId !== user.teacherProfile.id) {
      return NextResponse.json(
        { error: 'You can only add homework to your own lectures' },
        { status: 403 }
      );
    }
    
    // Process the due date with error handling
    let processedDueDate = null;
    if (dueDate) {
      try {
        processedDueDate = new Date(dueDate);
        // Check if the date is valid
        if (isNaN(processedDueDate.getTime())) {
          console.warn('Invalid date format received:', dueDate);
          processedDueDate = null;
        }
      } catch (dateError) {
        console.error('Error parsing date:', dateError);
        processedDueDate = null;
      }
    }
    
    // Create the homework
    const homework = await prisma.homework.create({
      data: {
        title,
        description: description || null,
        dueDate: processedDueDate,
        type, // Will be validated against the HomeworkType enum by Prisma
        lectureId
      }
    });
    
    return NextResponse.json(homework, { status: 201 });
  } catch (error: any) { 
    console.error('Error creating homework:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      meta: error?.meta
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error?.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? {
          name: error?.name,
          code: error?.code,
          meta: error?.meta
        } : undefined
      },
      { status: 500 }
    );
  }
}