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
    
    // Check if user is a teacher
    if (session.user.role !== 'TEACHER' || !session.user.teacherId) {
      return NextResponse.json(
        { error: 'Only teachers can create notes' },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    const { content, expiryDate, curriculumId } = body;
    
    if (!content || !curriculumId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if the curriculum exists and belongs to the teacher
    const curriculum = await prisma.curriculum.findUnique({
      where: {
        id: curriculumId,
      },
    });
    
    if (!curriculum) {
      return NextResponse.json(
        { error: 'Curriculum not found' },
        { status: 404 }
      );
    }
    
    if (curriculum.teacherId !== session.user.teacherId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Create the note
    const note = await prisma.note.create({
      data: {
        content,
        expiryDate: expiryDate || null,
        curriculumId,
      },
    });
    
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
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
    const curriculumId = searchParams.get('curriculumId');
    
    if (!curriculumId) {
      return NextResponse.json(
        { error: 'Curriculum ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the user has access to this curriculum
    let hasAccess = false;
    
    if (session.user.role === 'TEACHER' && session.user.teacherId) {
      // Check if teacher owns the curriculum
      const curriculum = await prisma.curriculum.findUnique({
        where: {
          id: curriculumId,
        },
      });
      
      if (curriculum && curriculum.teacherId === session.user.teacherId) {
        hasAccess = true;
      }
    } else if (session.user.role === 'STUDENT' && session.user.studentId) {
      // Check if student is enrolled in the curriculum
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_curriculumId: {
            studentId: session.user.studentId,
            curriculumId,
          },
        },
      });
      
      if (enrollment) {
        hasAccess = true;
      }
    }
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get active notes for the curriculum
    const notes = await prisma.note.findMany({
      where: {
        curriculumId,
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: new Date() } },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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
        { error: 'Only teachers can delete notes' },
        { status: 403 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('id');
    
    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the note exists
    const note = await prisma.note.findUnique({
      where: {
        id: noteId,
      },
      include: {
        curriculum: true,
      },
    });
    
    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }
    
    // Check if the teacher owns the curriculum
    if (note.curriculum.teacherId !== session.user.teacherId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Delete the note
    await prisma.note.delete({
      where: {
        id: noteId,
      },
    });
    
    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}