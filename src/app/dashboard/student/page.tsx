import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import prisma from '@/src/app/lib/db';
import { requireStudent } from '@/src/app/lib/auth';
import { CurriculumWithDetails, LectureWithDetails } from '@/types';
import { BookOpen, Plus, Search } from 'lucide-react';
import { JoinCurriculumForm } from '@/src/app/components/dashboard/JoinCurriculumForm';

// Get enrolled curriculums for a student
async function getStudentCurriculums(studentId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId,
      },
      include: {
        curriculum: {
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
            },
            _count: {
              select: {
                lectures: true,
              },
            },
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });
  
    // Use a more explicit type conversion approach
    return enrollments.map(enrollment => {
      const curriculum = enrollment.curriculum;
      return {
        ...curriculum,
        teacher: curriculum.teacher,
        lectures: curriculum.lectures || [],
        _count: curriculum._count
      };
    }) as CurriculumWithDetails[];
  }

// Get current week lectures
async function getCurrentWeekLectures(studentId: string) {
  const curriculums = await getStudentCurriculums(studentId);
  
  // Get current date information
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const pastDays = (now.getTime() - startOfYear.getTime()) / 86400000;
  const currentWeek = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
  
  // Get lectures for the current week
  const currentWeekLectures: (LectureWithDetails & { curriculumTitle: string })[] = [];
  
  for (const curriculum of curriculums) {
    const lectures = curriculum.lectures || [];
    for (const lecture of lectures) {
      if (lecture.weekNumber === currentWeek) {
        // Check if lecture is read
        const readLecture = await prisma.readLecture.findUnique({
          where: {
            studentId_lectureId: {
              studentId,
              lectureId: lecture.id,
            },
          },
        });
        
        currentWeekLectures.push({
          ...lecture,
          curriculumTitle: curriculum.title,
          isRead: !!readLecture,
        });
      }
    }
  }
  
  return currentWeekLectures;
}

export default async function StudentDashboard() {
  // Check if user is a student
  const user = await requireStudent();
  
  if (!user.studentId) {
    return redirect('/dashboard/teacher');
  }

  // Get student's curriculums and current week lectures
  const curriculums = await getStudentCurriculums(user.studentId);
  const currentWeekLectures = await getCurrentWeekLectures(user.studentId);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
        <JoinCurriculumForm studentId={user.studentId} />
      </div>

      {currentWeekLectures.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">This Week's Lectures</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentWeekLectures.map((lecture) => (
              <div key={lecture.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between">
                  <h3 className="font-medium">{lecture.title}</h3>
                  {lecture.isRead ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Read
                    </span>
                  ) : (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      New
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  From: {lecture.curriculumTitle}
                </p>
                <div className="mt-4">
                  <Link
                    href={`/dashboard/student/curriculum/${lecture.curriculumId}/lecture/${lecture.id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    View Lecture
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Your Enrolled Curriculums</h2>
        
        {curriculums.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No enrolled curriculums</h3>
            <p className="mt-1 text-sm text-gray-500">
              Join a curriculum using its unique code.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {curriculums.map((curriculum) => (
              <div key={curriculum.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <h3 className="font-medium text-lg">{curriculum.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    By: {curriculum.teacher?.user.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {curriculum._count?.lectures || 0} Lectures
                  </p>
                  <div className="mt-4">
                    <Link
                      href={`/dashboard/student/curriculum/${curriculum.id}`}
                      className="text-sm text-indigo-600 hover:text-indigo-900"
                    >
                      View Curriculum
                    </Link>
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