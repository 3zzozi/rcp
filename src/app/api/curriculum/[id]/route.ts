import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import prisma from '@/src/app/lib/db';

// GET a specific curriculum
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const curriculumId = params.id;
    
    // Get the curriculum
    const curriculum = await prisma.curriculum.findUnique({
      where: {
        id: curriculumId,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        lectures: {
          orderBy: {
            weekNumber: 'asc',
          },
          include: {
            homeworks: true,
            attachments: true,
          },
        },
        notes: {
          where: {
            OR: [
              { expiryDate: null },
              { expiryDate: { gt: new Date() } },
            ],
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });
    
    if (!curriculum) {
      return NextResponse.json(
        { error: 'Curriculum not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access to this curriculum
    if (session.user.role === 'TEACHER') {
      // Teachers should only access their own curriculums
      if (curriculum.teacherId !== session.user.teacherId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'STUDENT') {
      // Students should only access curriculums they're enrolled in
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_curriculumId: {
            studentId: session.user.studentId!,
            curriculumId,
          },
        },
      });
      
      if (!enrollment) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(curriculum);
  } catch (error) {
    console.error('Error fetching curriculum:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// UPDATE a curriculum
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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
        { error: 'Only teachers can update curriculums' },
        { status: 403 }
      );
    }
    
    const curriculumId = params.id;
    
    // Check if the curriculum exists and belongs to the teacher
    const existingCurriculum = await prisma.curriculum.findUnique({
      where: {
        id: curriculumId,
      },
    });
    
    if (!existingCurriculum) {
      return NextResponse.json(
        { error: 'Curriculum not found' },
        { status: 404 }
      );
    }
    
    if (existingCurriculum.teacherId !== session.user.teacherId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    const { title, description } = body;
    
    // Update the curriculum
    const updatedCurriculum = await prisma.curriculum.update({
      where: {
        id: curriculumId,
      },
      data: {
        title: title || undefined,
        description: description === undefined ? undefined : description,
      },
    });
    
    return NextResponse.json(updatedCurriculum);
  } catch (error) {
    console.error('Error updating curriculum:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE a curriculum
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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
        { error: 'Only teachers can delete curriculums' },
        { status: 403 }
      );
    }
    
    const curriculumId = params.id;
    
    // Check if the curriculum exists and belongs to the teacher
    const existingCurriculum = await prisma.curriculum.findUnique({
      where: {
        id: curriculumId,
      },
    });
    
    if (!existingCurriculum) {
      return NextResponse.json(
        { error: 'Curriculum not found' },
        { status: 404 }
      );
    }
    
    if (existingCurriculum.teacherId !== session.user.teacherId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Delete the curriculum (cascading delete will handle related records)
    await prisma.curriculum.delete({
      where: {
        id: curriculumId,
      },
    });
    
    return NextResponse.json({ message: 'Curriculum deleted successfully' });
  } catch (error) {
    console.error('Error deleting curriculum:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}