import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import prisma from '@/src/app/lib/db';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { mkdir } from 'fs/promises';

// Function to save the uploaded file
async function saveFile(file: File): Promise<string> {
  // Create a unique filename
  const originalName = file.name;
  const extension = originalName.substring(originalName.lastIndexOf('.') || 0);
  const fileName = `${uuidv4()}${extension}`;
  
  // Define the upload directory
  const uploadDir = join(process.cwd(), 'public/uploads/attachments');
  
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
    return `/uploads/attachments/${fileName}`;
  } catch (error) {
    console.error('Error saving file:', error);
    throw new Error('Failed to save file');
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
        { error: 'Only teachers can add attachments' },
        { status: 403 }
      );
    }
    
    // Parse the multipart form data
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const lectureId = formData.get('lectureId') as string;
    const file = formData.get('file') as File;
    
    if (!title || !lectureId || !file) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get the lecture to check if it belongs to the teacher
    const lecture = await prisma.lecture.findUnique({
      where: {
        id: lectureId,
      },
      include: {
        curriculum: true,
      },
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
    
    // Save the file
    const fileUrl = await saveFile(file);
    
    // Create the attachment
    const attachment = await prisma.attachment.create({
      data: {
        title,
        fileUrl,
        lectureId,
      },
    });
    
    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error('Error creating attachment:', error);
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
        { error: 'Only teachers can delete attachments' },
        { status: 403 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('id');
    
    if (!attachmentId) {
      return NextResponse.json(
        { error: 'Attachment ID is required' },
        { status: 400 }
      );
    }
    
    // Get the attachment to check if it belongs to the teacher
    const attachment = await prisma.attachment.findUnique({
      where: {
        id: attachmentId,
      },
      include: {
        lecture: {
          include: {
            curriculum: true,
          },
        },
      },
    });
    
    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }
    
    if (attachment.lecture.curriculum.teacherId !== session.user.teacherId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Delete the attachment
    await prisma.attachment.delete({
      where: {
        id: attachmentId,
      },
    });
    
    // Note: We're not deleting the actual file from the server for simplicity
    // In a production environment, you might want to delete the file as well
    
    return NextResponse.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}