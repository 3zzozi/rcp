// app/api/homework/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import prisma from '@/src/app/lib/db';

// GET a single homework
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Implementation for fetching a single homework
}

// Update a homework
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const homeworkId = params.id;
    
    // Get the existing homework
    const existingHomework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        lecture: {
          select: {
            curriculum: {
              select: { teacherId: true }
            }
          }
        }
      }
    });
    
    if (!existingHomework) {
      return NextResponse.json(
        { error: 'Homework not found' },
        { status: 404 }
      );
    }
    
    // Check ownership
    if (existingHomework.lecture.curriculum.teacherId !== session.user.teacherId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    const { title, description, dueDate, type } = body;
    
    // Update the homework
    const updatedHomework = await prisma.homework.update({
      where: { id: homeworkId },
      data: {
        title: title || undefined,
        description: description,
        dueDate: dueDate,
        type: type || undefined
      }
    });
    
    return NextResponse.json(updatedHomework);
  } catch (error) {
    console.error('Error updating homework:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a homework
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Implementation for deleting a homework
}