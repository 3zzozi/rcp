// app/dashboard/student/homework/[homeworkid]/page.tsx

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { requireStudent } from '@/src/app/lib/auth';
import prisma from '@/src/app/lib/db';
import { ChevronLeft, Clock, Download } from 'lucide-react';
import HomeworkSubmissionForm from '@/src/app/components/curriculum/HomeworkSubmissionForm';

async function getHomeworkForStudent(homeworkId: string, studentId: string) {
  // First get the homework
  const homework = await prisma.homework.findUnique({
    where: {
      id: homeworkId,
    },
    include: {
      lecture: {
        select: {
          id: true,
          title: true,
          curriculum: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  if (!homework) {
    return null;
  }

  // Check if student is enrolled in the curriculum
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_curriculumId: {
        studentId,
        curriculumId: homework.lecture.curriculum.id,
      },
    },
  });

  if (!enrollment) {
    return null;
  }

  // Get the student's submission if it exists
  const submission = await prisma.homeworkSubmission.findUnique({
    where: {
      studentId_homeworkId: {
        studentId,
        homeworkId,
      },
    },
  });

  return {
    homework,
    submission,
  };
}

export default async function StudentHomeworkView({
  params,
}: {
  params: { homeworkid: string };
}) {
  // Check if user is a student
  const user = await requireStudent();

  if (!user.studentId) {
    return redirect('/dashboard/teacher');
  }

  // Get homework and submission
  const result = await getHomeworkForStudent(params.homeworkid, user.studentId);

  if (!result) {
    return notFound();
  }

  const { homework, submission } = result;

  // Format due date
  const formattedDueDate = homework.dueDate 
    ? new Date(homework.dueDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  // Check if past due date
  const isPastDue = homework.dueDate ? new Date() > new Date(homework.dueDate) : false;
  
  // Check if already submitted
  const hasSubmitted = !!submission;

  return (
    <div>
      <div className="mb-6">
        <Link 
          href={`/dashboard/student/curriculum/${homework.lecture.curriculum.id}/lecture/${homework.lecture.id}`} 
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Lecture
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{homework.title}</h1>
        <p className="mt-2 text-sm text-gray-500">
          From {homework.lecture.curriculum.title} &gt; {homework.lecture.title}
        </p>
        
        {homework.dueDate && (
          <div className={`mt-4 flex items-center ${isPastDue ? 'text-red-600' : 'text-amber-600'}`}>
            <Clock className="h-5 w-5 mr-2" />
            <span>
              {isPastDue ? 'Due date passed: ' : 'Due: '}
              {formattedDueDate}
            </span>
          </div>
        )}

        {homework.description && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Instructions</h2>
            <div className="prose max-w-none">
              <p>{homework.description}</p>
            </div>
          </div>
        )}

        <div className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Your Submission</h2>
          
          {hasSubmitted ? (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                <p className="text-green-800">
                  You have submitted this homework on{' '}
                  {new Date(submission.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              
              {submission.fileUrl && (
                <div className="mt-4">
                  <h3 className="text-md font-medium mb-2">Your Submitted PDF:</h3>
                  <a 
                    href={submission.fileUrl}
                    download
                    className="flex items-center text-indigo-600 hover:text-indigo-900"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Your PDF Submission
                  </a>
                </div>
              )}
              
              {!isPastDue && (
                <div className="mt-6">
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    Submit New PDF
                  </button>
                  <p className="text-sm text-gray-500 mt-1">
                    Submitting a new file will replace your previous submission.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              {isPastDue ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800">
                    The due date for this homework has passed. You cannot submit anymore.
                  </p>
                </div>
              ) : (
                <HomeworkSubmissionForm 
                  homeworkId={homework.id}
                  lectureId={homework.lecture.id}
                  curriculumId={homework.lecture.curriculum.id}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}