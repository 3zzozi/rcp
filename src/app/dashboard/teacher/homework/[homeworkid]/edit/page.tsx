// app/dashboard/teacher/homework/[homeworkid]/edit/page.tsx

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { requireTeacher } from '@/src/app/lib/auth';
import prisma from '@/src/app/lib/db';
import { ChevronLeft } from 'lucide-react';
import HomeworkEditForm from '@/src/app/components/curriculum/HomeworkEditForm'; // You'll need to create this component

// Get homework for editing
async function getHomework(homeworkId: string, teacherId: string) {
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
              teacherId: true,
            },
          },
        },
      },
      mcqQuestions: true,
    },
  });

  if (!homework) {
    return null;
  }

  // Check if the curriculum belongs to the teacher
  if (homework.lecture.curriculum.teacherId !== teacherId) {
    return null;
  }

  return homework;
}

export default async function HomeworkEditPage({
  params,
}: {
  params: { homeworkid: string };
}) {
  // Check if user is a teacher
  const user = await requireTeacher();

  if (!user.teacherId) {
    return redirect('/dashboard/student');
  }

  // Get homework
  const homework = await getHomework(params.homeworkid, user.teacherId);

  if (!homework) {
    return notFound();
  }

  return (
    <div>
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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Edit Homework: {homework.title}</h1>
        
        {/* Use a client component for the form */}
        <HomeworkEditForm 
          homework={homework} 
          lectureId={homework.lecture.id}
          curriculumId={homework.lecture.curriculum.id}
        />
      </div>
    </div>
  );
}