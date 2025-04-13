// app/api/homework-submission/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import prisma from '@/src/app/lib/db';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'STUDENT' || !session.user.studentId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse form data
    const formData = await request.formData();
    const homeworkId = formData.get('homeworkId') as string;
    const file = formData.get('file') as File | null;
    
    if (!homeworkId) {
      return NextResponse.json(
        { error: 'Homework ID is required' },
        { status: 400 }
      );
    }
    
    if (!file) {
      return NextResponse.json(
        { error: 'PDF file is required' },
        { status: 400 }
      );
    }
    
    // Verify file is a PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are accepted' },
        { status: 400 }
      );
    }
    
    // Get the homework
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        lecture: {
          select: {
            curriculumId: true
          }
        }
      }
    });
    
    if (!homework) {
      return NextResponse.json(
        { error: 'Homework not found' },
        { status: 404 }
      );
    }
    
    // Check if student is enrolled in the curriculum
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_curriculumId: {
          studentId: session.user.studentId,
          curriculumId: homework.lecture.curriculumId
        }
      }
    });
    
    if (!enrollment) {
      return NextResponse.json(
        { error: 'You are not enrolled in this curriculum' },
        { status: 403 }
      );
    }
    
    // Check if past due date
    if (homework.dueDate && new Date() > new Date(homework.dueDate)) {
      return NextResponse.json(
        { error: 'The due date for this homework has passed' },
        { status: 400 }
      );
    }
    
    // Handle PDF file upload
    // This is a placeholder - you would need to implement actual file storage
    // In a real application, you would use a service like AWS S3, Azure Blob Storage, etc.
    const fileName = `homework_${homeworkId}_${session.user.studentId}_${Date.now()}.pdf`;
    const fileUrl = `/uploads/${fileName}`; // Placeholder URL
    
    // Check if already submitted
    const existingSubmission = await prisma.homeworkSubmission.findUnique({
      where: {
        studentId_homeworkId: {
          studentId: session.user.studentId,
          homeworkId
        }
      }
    });
    
    let submission;
    
    if (existingSubmission) {
      // Update existing submission
      submission = await prisma.homeworkSubmission.update({
        where: {
          id: existingSubmission.id
        },
        data: {
          fileUrl: fileUrl,
          content: null, // Clear any previous text content
          updatedAt: new Date()
        }
      });
    } else {
      // Create new submission
      submission = await prisma.homeworkSubmission.create({
        data: {
          studentId: session.user.studentId,
          homeworkId,
          fileUrl: fileUrl,
          content: null // No text content needed
        }
      });
    }
    
    return NextResponse.json(submission);
  } catch (error) {
    console.error('Error submitting homework:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}