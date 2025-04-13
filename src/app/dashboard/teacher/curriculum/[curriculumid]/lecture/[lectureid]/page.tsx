import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import prisma from '@/src/app/lib/db';
import { requireTeacher } from '@/src/app/lib/auth';
import { ChevronLeft, BookOpen, Users, Clock, Plus, Download, Trash2, Edit } from 'lucide-react';
import  AddHomeworkButton  from '@/src/app/components/curriculum/AddHomeworkButton';
import  AddAttachmentButton  from '@/src/app/components/curriculum/AddAttachmentButton';

// Define types for TypeScript
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
  _count?: {
    submissions: number;
  };
};

async function getLectureForTeacher(lectureId: string, teacherId: string) {
  // Get lecture details
  const lecture = await prisma.lecture.findUnique({
    where: {
      id: lectureId,
    },
    include: {
      homeworks: {
        include: {
          mcqQuestions: true,
          _count: {
            select: {
              submissions: true,
            },
          },
        },
      },
      attachments: true,
      curriculum: {
        select: {
          id: true,
          title: true,
          teacherId: true,
        },
      },
    },
  });

  if (!lecture) {
    return null;
  }

  // Check if the curriculum belongs to the teacher
  if (lecture.curriculum.teacherId !== teacherId) {
    return null;
  }

  return lecture;
}

export default async function TeacherLectureView({
  params,
}: {
  params: { lectureid: string; curriculumid: string }; // Changed from lectureId, curriculumId to match folder structure
}) {
  // Check if user is a teacher
  const user = await requireTeacher();

  if (!user.teacherId) {
    return redirect('/dashboard/student');
  }

  // Get lecture - using correct parameter names
  const lecture = await getLectureForTeacher(params.lectureid, user.teacherId); // Changed from params.lectureId

  if (!lecture) {
    return notFound();
  }

  // PDF file path is stored in the content field
  const pdfPath = lecture.content;

  return (
    <div>
      <div className="mb-6">
        <Link 
          href={`/dashboard/teacher/curriculum/${params.curriculumid}`} 
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
          <div className="flex items-center space-x-3">
            <a
              href={pdfPath}
              download
              className="flex items-center text-sm text-indigo-600 hover:text-indigo-900 px-3 py-2 border border-indigo-300 rounded-md"
            >
              <Download className="h-4 w-4 mr-1" />
              Download PDF
            </a>
            <button
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 px-3 py-2 border border-gray-300 rounded-md"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit Lecture
            </button>
            <button
              className="flex items-center text-sm text-red-600 hover:text-red-900 px-3 py-2 border border-red-300 rounded-md"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </button>
          </div>
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

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Additional Resources</h2>
          <AddAttachmentButton lectureId={lecture.id} />
        </div>
        
        {lecture.attachments && lecture.attachments.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No resources yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add helpful resources for your students.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {(lecture.attachments as Attachment[]).map((attachment) => (
              <div key={attachment.id} className="flex items-center border-b border-gray-100 pb-3">
                <BookOpen className="h-5 w-5 text-indigo-500 mr-3" />
                <div className="flex-1">
                  <p className="font-medium">{attachment.title}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={attachment.fileUrl}
                    download
                    className="flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </a>
                  <button
                    className="text-red-600 hover:text-red-900"
                    aria-label="Delete attachment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Homework Assignments</h2>
          <AddHomeworkButton lectureId={lecture.id} />
        </div>
        
        {lecture.homeworks && lecture.homeworks.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No homework assignments yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create homework assignments for your students to complete.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {(lecture.homeworks as Homework[]).map((homework) => (
              <div key={homework.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
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
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-1" />
                      {homework._count?.submissions || 0} submissions
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/dashboard/teacher/homework/${homework.id}`}
                      className="flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                    >
                      View Submissions
                    </Link>
                    <button
                      className="text-red-600 hover:text-red-900"
                      aria-label="Delete homework"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}