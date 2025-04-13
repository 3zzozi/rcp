import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import prisma from '@/src/app/lib/db';
import { requireStudent } from '@/src/app/lib/auth';
import { ChevronLeft, BookOpen, Clock, Download } from 'lucide-react';


type Attachment = {
    id: string;
    title: string;
    fileUrl: string;
    lectureId: string;
  };
  
  type Homework = {
    id: string;
    title: string;
    description?: string | null;
    dueDate?: Date | null;
    type: string;
    lectureId: string;
  };

async function getLectureForStudent(lectureId: string, studentId: string, curriculumId: string) {
  // First check if the student is enrolled in the curriculum
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_curriculumId: {
        studentId,
        curriculumId,
      },
    },
  });

  if (!enrollment) {
    return null;
  }

  // Get lecture details
  const lecture = await prisma.lecture.findUnique({
    where: {
      id: lectureId,
    },
    include: {
      homeworks: {
        include: {
          mcqQuestions: true,
        },
      },
      attachments: true,
      curriculum: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!lecture) {
    return null;
  }

  // Check if lecture belongs to the curriculum
  if (lecture.curriculumId !== curriculumId) {
    return null;
  }

  // Mark lecture as read if not already
  const readLecture = await prisma.readLecture.findUnique({
    where: {
      studentId_lectureId: {
        studentId,
        lectureId,
      },
    },
  });

  if (!readLecture) {
    await prisma.readLecture.create({
      data: {
        studentId,
        lectureId,
      },
    });
  }

  return lecture;
}

export default async function LectureView({
  params,
}: {
  params: { id: string; curriculumid: string };
}) {
  // Check if user is a student
  const user = await requireStudent();

  if (!user.studentId) {
    return redirect('/dashboard/teacher');
  }

  // Get lecture
  const lecture = await getLectureForStudent(params.id, user.studentId, params.curriculumid);

  if (!lecture) {
    return notFound();
  }

  // PDF file path is stored in the content field
  const pdfPath = lecture.content;

  return (
    <div>
      <div className="mb-6">
        <Link 
          href={`/dashboard/student/curriculum/${params.curriculumid}`} 
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Curriculum
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lecture.title}</h1>
            <p className="mt-2 text-sm text-gray-500">
              From curriculum: {lecture.curriculum.title}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Week {lecture.weekNumber}
            </p>
          </div>
          <a
            href={pdfPath}
            download
            className="flex items-center text-sm text-indigo-600 hover:text-indigo-900 px-3 py-2 border border-indigo-300 rounded-md"
          >
            <Download className="h-4 w-4 mr-1" />
            Download PDF
          </a>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Lecture PDF</h2>
        
        <div className="w-full h-[600px] border border-gray-300 rounded-lg">
          <iframe
            src={`${pdfPath}#view=FitH`}
            className="w-full h-full rounded-lg"
            title={lecture.title}
          ></iframe>
        </div>
      </div>

      {lecture.attachments.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Additional Resources</h2>
          <div className="space-y-3">
          {(lecture.attachments as Attachment[]).map((attachment) => (
        <div key={attachment.id} className="flex items-center border-b border-gray-100 pb-3">
          <BookOpen className="h-5 w-5 text-indigo-500 mr-3" />
          <div className="flex-1">
            <p className="font-medium">{attachment.title}</p>
          </div>
                <a
                  href={attachment.fileUrl}
                  download
                  className="flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

{lecture.homeworks && lecture.homeworks.length > 0 && (
  <div className="bg-white shadow rounded-lg p-6">
    <h2 className="text-lg font-semibold mb-4">Homework Assignments</h2>
    <div className="space-y-6">
      {(lecture.homeworks as Homework[]).map((homework) => (
        <div key={homework.id} className="border rounded-lg p-4">
          <h3 className="text-md font-medium">{homework.title}</h3>
          {homework.description && (
            <p className="mt-2 text-sm text-gray-600">{homework.description}</p>
          )}
                {homework.dueDate && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    Due: {new Date(homework.dueDate).toLocaleDateString()}
                  </div>
                )}
                <div className="mt-4">
                  <Link
                    href={`/dashboard/student/homework/${homework.id}`}
                    className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    View Homework
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}