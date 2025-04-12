import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import prisma from '@/src/app/lib/db';
import { requireStudent } from '@/src/app/lib/auth';
import { CurriculumWithDetails, LectureWithDetails } from '@/types';
import { ChevronLeft, BookOpen, Users, Clock, ClipboardList } from 'lucide-react';

async function getCurriculumForStudent(curriculumId: string, studentId: string) {
    type LectureWithCounts = LectureWithDetails & {
        isRead: boolean;
        _count: {
          homeworks: number;
          attachments: number;
        };
      };
      
      type CurriculumWithLectures = CurriculumWithDetails & {
        lectures: LectureWithCounts[];
        notes: Array<{
          id: string;
          content: string;
          expiryDate?: Date | null;
          createdAt: Date;
        }>;
      };
      
  // First check if the student is enrolled
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

  // Get curriculum with all details
  const curriculum = await prisma.curriculum.findUnique({
    where: {
      id: curriculumId,
    },
    include: {
      teacher: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      lectures: {
        orderBy: {
          weekNumber: 'asc',
        },
        include: {
          homeworks: true,
          attachments: true,
          _count: {
            select: {
              homeworks: true,
              attachments: true,
            },
          },
        },
      },
      notes: {
        where: {
          OR: [
            { expiryDate: null },
            { expiryDate: { gt: new Date() } },
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!curriculum) {
    return null;
  }

  // Check which lectures are read by the student
  const lectures = await Promise.all(
    curriculum.lectures.map(async (lecture) => {
      const readLecture = await prisma.readLecture.findUnique({
        where: {
          studentId_lectureId: {
            studentId,
            lectureId: lecture.id,
          },
        },
      });

      return {
        ...lecture,
        isRead: !!readLecture,
      };
    })
  );

  return {
    ...curriculum,
    lectures,
  } as CurriculumWithDetails & {
    lectures: (LectureWithDetails & {
      isRead: boolean;
      _count: {
        homeworks: number;
        attachments: number;
      };
    })[];
  };
}

export default async function StudentCurriculumView({
    params,
  }: {
    params: { id: string };
  }) {
    // Check if user is a student
    const user = await requireStudent();
  
    if (!user.studentId) {
      return redirect('/dashboard/teacher');
    }
  
    // Get curriculum
    const curriculum = await getCurriculumForStudent(params.id, user.studentId) as CurriculumWithLectures;
  
    if (!curriculum) {
      return notFound();
    }

  // Group lectures by week
  const lecturesByWeek: { [key: number]: typeof curriculum.lectures } = {};
  curriculum.lectures.forEach((lecture: LectureWithCounts) => {
    if (!lecturesByWeek[lecture.weekNumber]) {
      lecturesByWeek[lecture.weekNumber] = [];
    }
    lecturesByWeek[lecture.weekNumber].push(lecture);
  });

  const weeks = Object.keys(lecturesByWeek).map(Number).sort((a, b) => a - b);

  return (
    <div>
      <div className="mb-6">
        <Link 
          href="/dashboard/student" 
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{curriculum.title}</h1>
            {curriculum.description && (
              <p className="mt-2 text-gray-600">{curriculum.description}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Teacher: {curriculum.teacher?.user.name}
            </p>
          </div>
          <div className="bg-gray-100 rounded-md p-3 text-center">
            <p className="text-sm text-gray-500">Curriculum Code</p>
            <p className="text-lg font-bold">{curriculum.uniqueCode}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-md flex items-center">
            <BookOpen className="h-5 w-5 text-indigo-600 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Lectures</p>
              <p className="text-lg font-semibold">{curriculum.lectures.length}</p>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md flex items-center">
            <Clock className="h-5 w-5 text-indigo-600 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Enrolled Since</p>
              <p className="text-lg font-semibold">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {curriculum.notes.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <h2 className="text-lg font-semibold flex items-center text-yellow-800 mb-2">
            <ClipboardList className="h-5 w-5 mr-2" />
            Notes & Announcements
          </h2>
          <div className="space-y-4">
            {curriculum.notes.map(note => (
              <div key={note.id} className="bg-white p-3 rounded border border-yellow-100">
                <p className="text-gray-700">{note.content}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                  {note.expiryDate && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      Expires: {new Date(note.expiryDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-6">Lectures by Week</h2>
        
        {weeks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No lectures yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              The teacher hasn't added any lectures to this curriculum yet.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {weeks.map(week => (
              <div key={week} className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Week {week}</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {lecturesByWeek[week].map(lecture => (
                    <div key={lecture.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <Link href={`/dashboard/student/curriculum/${curriculum.id}/lecture/${lecture.id}`}>
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">{lecture.title}</h4>
                          <div className="flex space-x-2">
                            {lecture.isRead ? (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                Read
                              </span>
                            ) : (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                New
                              </span>
                            )}
                            {lecture._count.homeworks > 0 && (
                              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                                {lecture._count.homeworks} Homework{lecture._count.homeworks !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {lecture.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                        </p>
                        <div className="mt-4 text-right">
                          <span className="text-sm text-indigo-600 hover:text-indigo-900">
                            View Lecture
                          </span>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}