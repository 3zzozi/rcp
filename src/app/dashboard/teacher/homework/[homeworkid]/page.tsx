// app/dashboard/teacher/homework/[homeworkid]/page.tsx
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import prisma from '@/src/app/lib/db';
import { ChevronLeft, Download, FileText, User, Clock, Edit } from 'lucide-react';
import DeleteButtonWrapper from '@/src/app/components/curriculum/DeleteButtonWrapper';

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

async function getHomeworkWithSubmissions(homeworkId: string, teacherId: string) {
  // Make sure homeworkId is not undefined
  if (!homeworkId) {
    console.error('homeworkId is undefined');
    return null;
  }

  // Log the received parameters for debugging
  console.log('Getting homework with ID:', homeworkId);
  console.log('Teacher ID:', teacherId);

  try {
    const homework = await prisma.homework.findUnique({
      where: { 
        id: homeworkId  // This should now be a valid string
      },
      include: {
        submissions: {
          include: {
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
          },
          orderBy: { submittedAt: 'desc' }
        },
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
    });

    if (!homework) {
      console.error('Homework not found with ID:', homeworkId);
      return null;
    }

    // Verify the homework belongs to this teacher
    if (homework.lecture.curriculum.teacherId !== teacherId) {
      console.error('Homework does not belong to teacher');
      return null;
    }

    return homework;
  } catch (error) {
    console.error('Error fetching homework:', error);
    return null;
  }
}

export default async function HomeworkSubmissionsPage({
  params,
}: {
  params: { homeworkid: string }; // Changed from 'id' to 'homeworkid' to match route parameter
}) {
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
  
  // Debug: log params
  console.log('Page params:', params);
  
  // Get homework details with submissions - using params.homeworkid
  const homework = await getHomeworkWithSubmissions(params.homeworkid, teacherId);
  
  if (!homework) {
    return notFound();
  }
  
  const curriculumId = homework.lecture.curriculum.id;
  const lectureId = homework.lecture.id;
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link
          href={`/dashboard/teacher/curriculum/${homework.lecture.curriculum.id}/lecture/${homework.lecture.id}`}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Lecture
        </Link>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {homework.title} - Submissions
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <p>
                From curriculum: {homework.lecture.curriculum.title}
              </p>
              <p>
                Lecture: {homework.lecture.title}
              </p>
              {homework.dueDate && (
                <p className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Due: {formatDate(homework.dueDate)}
                </p>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-4">
            <Link
              href={`/dashboard/teacher/homework/${params.homeworkid}/edit`}
              className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Link>
            
            <DeleteButtonWrapper 
              homeworkId={params.homeworkid}
              curriculumId={curriculumId}
              lectureId={lectureId}
            />
          </div>
        </div>
        
        {homework.description && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-2">Description:</h3>
            <p className="text-gray-700">{homework.description}</p>
          </div>
        )}
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-6">Student Submissions</h2>
        
        {homework.submissions.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Students haven't submitted any work for this assignment yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {homework.submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 rounded-full">
                          <User className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {submission.student.user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.student.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(submission.submittedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {homework.dueDate && new Date(submission.submittedAt) > new Date(homework.dueDate) ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Late
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          On Time
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {submission.grade !== null ? (
                        <span className="text-sm text-gray-900">{submission.grade}/100</span>
                      ) : (
                        <span className="text-sm text-gray-500">Not graded</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {submission.fileUrl && (
                          <a
                            href={submission.fileUrl}
                            download
                            className="text-indigo-600 hover:text-indigo-900 flex items-center"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </a>
                        )}
                        <Link
                          href={`/dashboard/teacher/homework/submission/${submission.id}`}
                          className="text-green-600 hover:text-green-900 ml-3"
                        >
                          Grade
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}