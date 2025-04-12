import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import prisma from '@/src/app/lib/db';
import { generateUniqueCode } from '@/src/app/lib/auth';

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
    
    // Check if user is a teacher
    if (session.user.role !== 'TEACHER' || !session.user.teacherId) {
      return NextResponse.json(
        { error: 'Only teachers can create curriculums' },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    const { title, description } = body;
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    // Generate a unique code for the curriculum
    let uniqueCode = generateUniqueCode();
    let existingCurriculum = await prisma.curriculum.findUnique({
      where: {
        uniqueCode,
      },
    });
    
    // Regenerate code if it already exists
    while (existingCurriculum) {
      uniqueCode = generateUniqueCode();
      existingCurriculum = await prisma.curriculum.findUnique({
        where: {
          uniqueCode,
        },
      });
    }
    
    // Create the curriculum
    const curriculum = await prisma.curriculum.create({
      data: {
        title,
        description: description || null,
        uniqueCode,
        teacherId: session.user.teacherId,
      },
    });
    
    return NextResponse.json(curriculum, { status: 201 });
  } catch (error) {
    console.error('Error creating curriculum:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    
    // Set up filter
    const where = teacherId ? { teacherId } : {};
    
    // Get curriculums
    const curriculums = await prisma.curriculum.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            lectures: true,
            enrollments: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    
    return NextResponse.json(curriculums);
  } catch (error) {
    console.error('Error fetching curriculums:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}