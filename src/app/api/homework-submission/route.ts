// app/api/homework-submission/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import prisma from '@/src/app/lib/db';

export async function POST(request: Request) {
  console.log('Homework submission API hit');
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user information with a more flexible approach
    const userId = session.user.id;
    console.log('User ID from session:', userId);
    
    // Get the student profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user is a student
    if (!user.studentProfile) {
      return NextResponse.json(
        { error: 'Only students can submit homework' },
        { status: 403 }
      );
    }
    
    const studentId = user.studentProfile.id;
    
    // Parse form data
    const formData = await request.formData();
    const homeworkId = formData.get('homeworkId') as string;
    const file = formData.get('file') as File | null;
    
    console.log('Received submission for homework:', homeworkId);
    console.log('File received:', file ? file.name : 'No file');
    
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
          studentId: studentId,
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
    
    // IMPORTANT: This is a placeholder for file upload
    // In a production environment, you should use a proper storage service
    const fileName = `homework_${homeworkId}_${studentId}_${Date.now()}.pdf`;
    const fileUrl = `/uploads/${fileName}`;
    
    // In a real implementation, you would read the file and upload it:
    // const fileBuffer = await file.arrayBuffer();
    // const fileBytes = new Uint8Array(fileBuffer);
    // await uploadToYourStorage(fileBytes, fileName);
    
    console.log('File would be saved as:', fileName);
    
    // Check if already submitted
    const existingSubmission = await prisma.homeworkSubmission.findUnique({
      where: {
        studentId_homeworkId: {
          studentId: studentId,
          homeworkId
        }
      }
    });
    
    let submission;
    
    try {
      if (existingSubmission) {
        // Update existing submission
        submission = await prisma.homeworkSubmission.update({
          where: {
            id: existingSubmission.id
          },
          data: {
            fileUrl: fileUrl,
            submittedAt: new Date() // Update submission time
          }
        });
      } else {
        // Create new submission
        submission = await prisma.homeworkSubmission.create({
          data: {
            studentId: studentId,
            homeworkId,
            fileUrl: fileUrl
          }
        });
      }
      
      return NextResponse.json({ 
        success: true,
        message: 'Homework submitted successfully',
        submission 
      });
    } catch (dbError: any) {
      console.error('Database error during submission:', dbError);
      return NextResponse.json(
        { 
          error: 'Failed to save submission',
          details: dbError.message
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error submitting homework:', {
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    );
  }
}