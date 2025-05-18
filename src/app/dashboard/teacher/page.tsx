import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import prisma from '@/src/app/lib/db';
import { requireTeacher } from '@/src/app/lib/auth';
import { CurriculumWithDetails } from '@/types';
import { Plus, BookOpen, Users, Edit } from 'lucide-react';
import DeleteCurriculumButton from '@/src/app/components/curriculum/DeleteCurriculumButton';

async function getTeacherCurriculums(teacherId: string) {
  const curriculums = await prisma.curriculum.findMany({
    where: {
      teacherId,
    },
    include: {
      _count: {
        select: {
          lectures: true,
          enrollments: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return curriculums as unknown as CurriculumWithDetails[];
}

export default async function TeacherDashboard() {
  // Check if user is a teacher
  const user = await requireTeacher();
  
  if (!user.teacherId) {
    return redirect('/dashboard/student');
  }

  // Get teacher's curriculums
  const curriculums = await getTeacherCurriculums(user.teacherId);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
        <div className="flex space-x-4">
          <Link
            href="/dashboard/teacher/curriculum/create"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Curriculum
          </Link>
          <button
            className="bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 flex items-center"
            disabled
          >
            <Plus className="h-5 w-5 mr-2" />
            Make Curriculum with AI
            <span className="text-xs ml-2 bg-gray-200 px-2 py-1 rounded-full">Soon</span>
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Your Curriculums</h2>
        
        {curriculums.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No curriculums</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new curriculum.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/teacher/curriculum/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Curriculum
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Title
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Code
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Lectures
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Students
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Last Updated
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {curriculums.map((curriculum) => (
                  <tr key={curriculum.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {curriculum.title}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {curriculum.uniqueCode}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {curriculum._count?.lectures || 0}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {curriculum._count?.enrollments || 0}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {new Date(curriculum.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <div className="flex justify-end space-x-4">
                        <Link
                          href={`/dashboard/teacher/curriculum/${curriculum.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </Link>
                        <Link
                          href={`/dashboard/teacher/curriculum/${curriculum.id}/edit`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </Link>
                        <DeleteCurriculumButton curriculumId={curriculum.id} />
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