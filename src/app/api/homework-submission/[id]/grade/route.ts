// app/api/homework-submission/[submissionid]/grade/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import prisma from '@/src/app/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: { submissionid: string } } // Make sure this matches your folder structure
) {
  try {
    // Log received parameters for debugging
    console.log('Grading submission with ID:', params.submissionid);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teacherProfile: true
      }
    });
    
    if (!user?.teacherProfile) {
      return NextResponse.json(
        { error: 'Only teachers can grade submissions' },
        { status: 403 }
      );
    }
    
    const teacherId = user.teacherProfile.id;
    
    // Get the submission ID from params
    const submissionId = params.submissionid;
    
    // Check if submissionId is valid
    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submission ID' },
        { status: 400 }
      );
    }
    
    // Get the submission
    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: submissionId },
      include: {
        homework: {
          include: {
            lecture: {
              include: {
                curriculum: {
                  select: { teacherId: true }
                }
              }
            }
          }
        }
      }
    });
    
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }
    
    // Check if the submission belongs to the teacher's curriculum
    if (submission.homework.lecture.curriculum.teacherId !== teacherId) {
      return NextResponse.json(
        { error: 'You can only grade submissions for your own curriculums' },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    const { grade, feedback } = body;
    
    console.log('Received grading data:', { grade, feedback });
    
    // Validate grade
    if (grade !== null && (isNaN(Number(grade)) || Number(grade) < 0 || Number(grade) > 100)) {
      return NextResponse.json(
        { error: 'Grade must be a number between 0 and 100' },
        { status: 400 }
      );
    }
    
    // Update the submission with the grade
    try {
      const updatedSubmission = await prisma.homeworkSubmission.update({
        where: { id: submissionId },
        data: {
          grade: grade === null ? null : Number(grade),
          feedback: feedback || null
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Submission graded successfully',
        submission: updatedSubmission
      });
    } catch (dbError: any) {
      console.error('Database error while updating grade:', dbError);
      return NextResponse.json(
        { error: 'Failed to update grade', details: dbError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error grading submission:', error);
    
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}