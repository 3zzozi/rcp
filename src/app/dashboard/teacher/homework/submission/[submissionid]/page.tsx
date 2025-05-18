// app/dashboard/teacher/homework/submission/[submissionid]/page.tsx
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import prisma from '@/src/app/lib/db';
import { ChevronLeft, Download, User, Clock } from 'lucide-react';
import GradeSubmissionForm from '@/src/app/components/curriculum/GradeSubmissionForm';
import PDFViewer from '@/src/app/components/PDFViewer';

// Helper function to format date
function formatDate(date: Date | null | undefined) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function getSubmissionDetails(submissionId: string, teacherId: string) {
  // Validate parameters
  if (!submissionId || !submissionId.trim()) {
    console.error('submissionId is undefined or empty');
    return null;
  }

  if (!teacherId) {
    console.error('teacherId is undefined');
    return null;
  }

  console.log('Getting submission with ID:', submissionId);
  console.log('Teacher ID:', teacherId);

  try {
    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: submissionId },
      include: {
        homework: {
          include: {
            lecture: {
              include: {
                curriculum: {
                  select: {
                    id: true,
                    title: true,
                    teacherId: true,
                  }
                }
              }
            }
          }
        },
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        }
      }
    });

    if (!submission) {
      console.error('Submission not found with ID:', submissionId);
      return null;
    }

    // Verify the submission belongs to this teacher
    if (submission.homework.lecture.curriculum.teacherId !== teacherId) {
      console.error('Submission does not belong to this teacher');
      return null;
    }

    return submission;
  } catch (error) {
    console.error('Error fetching submission:', error);
    return null;
  }
}

export default async function SubmissionGradingPage({
  params,
}: {
  params: { submissionid: string };
}) {
  console.log('Submission page params:', params);
  
  // Validate that submissionid exists in params
  if (!params || !params.submissionid) {
    console.error('Missing submission ID in URL parameters');
    return notFound();
  }

  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return redirect('/auth/signin');
  }
  
  // Get user information
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      teacherProfile: true
    }
  });
  
  if (!user?.teacherProfile) {
    return redirect('/dashboard/student');
  }
  
  const teacherId = user.teacherProfile.id;
  
  // Get submission details
  const submission = await getSubmissionDetails(params.submissionid, teacherId);
  
  if (!submission) {
    return notFound();
  }
  
  const homework = submission.homework;
  const safeFileUrl = submission.fileUrl || ''; // Ensure fileUrl is never undefined
  const isPDF = safeFileUrl.toLowerCase().endsWith('.pdf');
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link
          href={`/dashboard/teacher/homework/${homework.id}`}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to All Submissions
        </Link>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Grade Submission
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <p>
            Assignment: {homework.title}
          </p>
          <p>
            Curriculum: {homework.lecture.curriculum.title}
          </p>
          {homework.dueDate && (
            <p className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Due: {formatDate(homework.dueDate)}
            </p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Student Submission</h2>
            
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-indigo-100 rounded-full">
                <User className="h-6 w-6 text-indigo-500" />
              </div>
              <div className="ml-4">
                <p className="text-lg font-medium">{submission.student.user.name}</p>
                <p className="text-sm text-gray-500">{submission.student.user.email}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-1">Submitted on:</p>
              <p className="font-medium">{formatDate(submission.submittedAt)}</p>
              
              {homework.dueDate && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-1">Status:</p>
                  {new Date(submission.submittedAt) > new Date(homework.dueDate) ? (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Late
                    </span>
                  ) : (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      On Time
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {safeFileUrl && (
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-3">Submitted File:</p>
                <div className="flex items-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {safeFileUrl.split('/').pop()}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <a
                      href={safeFileUrl}
                      download
                      className="font-medium text-indigo-600 hover:text-indigo-900 flex items-center"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </a>
                  </div>
                </div>
                
                {isPDF && (
                  <div className="mt-6 relative">
                    {/* Use a client component for PDF viewer */}
                    <PDFViewer fileUrl={safeFileUrl} />
                  </div>
                )}
              </div>
            )}
            
            {submission.content && (
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-3">Submitted Text:</p>
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="whitespace-pre-wrap">{submission.content}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6 sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Grade Submission</h2>
            {submission && submission.id ? (
              <GradeSubmissionForm 
                submissionId={submission.id} 
                currentGrade={submission.grade || null} 
                homeworkId={homework.id}
              />
            ) : (
              <p className="text-gray-500">Cannot load grading form. Submission ID is missing.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}