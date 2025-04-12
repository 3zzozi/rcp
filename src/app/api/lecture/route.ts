import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import prisma from '@/src/app/lib/db';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { mkdir } from 'fs/promises';

// Function to save the uploaded PDF file
async function savePdfFile(file: File): Promise<string> {
  // Create a unique filename
  const fileName = `${uuidv4()}.pdf`;
  
  // Define the upload directory
  const uploadDir = join(process.cwd(), 'public/uploads/lectures');
  
  try {
    // Ensure the upload directory exists
    await mkdir(uploadDir, { recursive: true });
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Write the file to the upload directory
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);
    
    // Return the relative path to access the file
    return `/uploads/lectures/${fileName}`;
  } catch (error) {
    console.error('Error saving PDF file:', error);
    throw new Error('Failed to save PDF file');
  }
}

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
        { error: 'Only teachers can create lectures' },
        { status: 403 }
      );
    }
    
    // Parse the multipart form data
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const weekNumber = parseInt(formData.get('weekNumber') as string);
    const curriculumId = formData.get('curriculumId') as string;
    const pdfFile = formData.get('pdfFile') as File;
    
    if (!title || !curriculumId || !pdfFile) {
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
    
    // Save the PDF file
    const pdfFilePath = await savePdfFile(pdfFile);
    
    // Create the lecture with file path
    const lecture = await prisma.lecture.create({
      data: {
        title,
        weekNumber: weekNumber || 1,
        content: pdfFilePath, // Store the file path in the content field
        curriculumId,
      },
    });
    
    // Create an attachment entry for the PDF
    await prisma.attachment.create({
      data: {
        title: `${title} PDF`,
        fileUrl: pdfFilePath,
        lectureId: lecture.id,
      },
    });
    
    return NextResponse.json(lecture, { status: 201 });
  } catch (error) {
    console.error('Error creating lecture:', error);
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
    const weekNumber = searchParams.get('weekNumber') 
      ? parseInt(searchParams.get('weekNumber')!)
      : undefined;
    
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
    
    // Set up filters
    const where: any = { curriculumId };
    
    if (weekNumber !== undefined) {
      where.weekNumber = weekNumber;
    }
    
    // Get lectures
    const lectures = await prisma.lecture.findMany({
      where,
      include: {
        homeworks: true,
        attachments: true,
      },
      orderBy: {
        weekNumber: 'asc',
      },
    });
    
    return NextResponse.json(lectures);
  } catch (error) {
    console.error('Error fetching lectures:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}