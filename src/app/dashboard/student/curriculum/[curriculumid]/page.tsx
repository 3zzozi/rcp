import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import prisma from '@/src/app/lib/db';
import { requireStudent } from '@/src/app/lib/auth';
import { CurriculumWithDetails, LectureWithDetails } from '@/types';
import { ChevronLeft, BookOpen, Users, Clock, ClipboardList } from 'lucide-react';

// Define the types outside of the function so they can be used in the component
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

async function getCurriculumForStudent(curriculumId: string, studentId: string) {
  // Add debugging to see what's happening
  console.log("Getting curriculum for student:", { curriculumId, studentId });

  // First check if the student is enrolled
  // Make sure both IDs are strings and trimmed
  const studentIdStr = String(studentId).trim();
  const curriculumIdStr = String(curriculumId).trim();
  
  console.log("Looking for enrollment with:", { studentIdStr, curriculumIdStr });
  
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_curriculumId: {
          studentId: studentIdStr,
          curriculumId: curriculumIdStr,
        },
      },
    });
    
    console.log("Enrollment found:", enrollment);
    
    if (!enrollment) {
      console.log("No enrollment found - student not enrolled in this curriculum");
      return null;
    }
  } catch (error) {
    console.error("Error finding enrollment:", error);
    return null;
  }

  // Removed duplicate check as it's now in the try-catch block above

  // Get curriculum with all details
  console.log("Finding curriculum with ID:", curriculumIdStr);
  
  try {
    const curriculum = await prisma.curriculum.findUnique({
      where: {
        id: curriculumIdStr,
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
    
    console.log("Curriculum found:", curriculum ? "Yes" : "No");
    
    if (!curriculum) {
      console.log("No curriculum found with this ID");
      return null;
    }

    // Check which lectures are read by the student
    console.log("Getting read status for lectures");
    
    // Safety check for curriculum.lectures
    if (!curriculum.lectures || !Array.isArray(curriculum.lectures)) {
      console.log("curriculum.lectures is not an array, defaulting to empty array");
      curriculum.lectures = [];
    }
    
    const lectures = await Promise.all(
      curriculum.lectures.map(async (lecture) => {
        if (!lecture || typeof lecture !== 'object') {
          console.error("Invalid lecture object:", lecture);
          return null; // Skip invalid lectures
        }
        
        try {
          const readLecture = await prisma.readLecture.findUnique({
            where: {
              studentId_lectureId: {
                studentId: studentIdStr,
                lectureId: lecture.id,
              },
            },
          });

          return {
            ...lecture,
            isRead: !!readLecture,
          };
        } catch (error) {
          console.error(`Error checking read status for lecture ${lecture.id}:`, error);
          return {
            ...lecture,
            isRead: false, // Default to not read if there's an error
          };
        }
      })
    );
    
    // Filter out any null entries from invalid lectures
    const validLectures = lectures.filter(lecture => lecture !== null);
    
    console.log("Returning curriculum with lectures");
    const result = {
      ...curriculum,
      lectures: validLectures || [],
    } as CurriculumWithLectures;
    
    // Log the structure to help debug
    console.log("Curriculum structure:", {
      id: result.id,
      title: result.title,
      lectureCount: result.lectures?.length || 0,
      hasLectures: Array.isArray(result.lectures),
      hasNotes: Array.isArray(result.notes),
    });
    
    return result;
  } catch (error) {
    console.error("Error finding curriculum or processing lectures:", error);
    return null;
  }
}

export default async function StudentCurriculumView({
  params,
}: {
  params: { curriculumid: string }; // Changed from id to curriculumid
}) {
  try {
    // Check if the ID param is valid
    if (!params.curriculumid || params.curriculumid === 'undefined') {
      console.log("Invalid curriculum ID parameter:", params.curriculumid);
      return notFound();
    }

    // Check if user is a student
    const user = await requireStudent();
    
    if (!user.studentId) {
      return redirect('/dashboard/teacher');
    }
  
    // Add debugging to track the flow
    console.log("Page params:", params);
    console.log("User student ID:", user.studentId);
    
    // Get curriculum - ensure params.curriculumid is a string
    const curriculumId = String(params.curriculumid);
    console.log("Curriculum ID:", curriculumId);
    
    // Get curriculum data
    const curriculum = await getCurriculumForStudent(curriculumId, user.studentId);
    console.log("Curriculum retrieved:", curriculum ? "Yes" : "No");
  
    if (!curriculum) {
      console.log("No curriculum found, returning 404");
      return notFound();
    }
    
    // Add safety check for lectures
    if (!curriculum.lectures) {
      console.log("Curriculum found but lectures array is missing");
      curriculum.lectures = [];
    }
    
    // Add safety checks for curriculum properties
    if (!curriculum.notes) {
      console.log("Curriculum has no notes property, adding empty array");
      curriculum.notes = [];
    }
    
    // Group lectures by week with safety checks
    const lecturesByWeek: { [key: number]: Array<any> } = {};
    
    curriculum.lectures.forEach((lecture) => {
      if (!lecture) return; // Skip null/undefined lectures
      
      if (typeof lecture.weekNumber !== 'number') {
        console.log(`Lecture ${lecture.id} has invalid weekNumber:`, lecture.weekNumber);
        return; // Skip lectures with invalid weekNumber
      }
      
      if (!lecturesByWeek[lecture.weekNumber]) {
        lecturesByWeek[lecture.weekNumber] = [];
      }
      
      lecturesByWeek[lecture.weekNumber].push(lecture);
    });
    
    const weeks = Object.keys(lecturesByWeek).map(Number).sort((a, b) => a - b);
    
    // Log the structure for debugging
    console.log("Weeks found:", weeks);
    console.log("Lectures by week:", Object.keys(lecturesByWeek).map(week => {
      return {
        week,
        lectureCount: lecturesByWeek[Number(week)]?.length || 0
      };
    }));
  
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
              <h1 className="text-2xl font-bold text-gray-900">{curriculum.title || 'Untitled Curriculum'}</h1>
              {curriculum.description && (
                <p className="mt-2 text-gray-600">{curriculum.description}</p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                Teacher: {curriculum.teacher?.user?.name || 'Unknown Teacher'}
              </p>
            </div>
            <div className="bg-gray-100 rounded-md p-3 text-center">
              <p className="text-sm text-gray-500">Curriculum Code</p>
              <p className="text-lg font-bold">{curriculum.uniqueCode || 'N/A'}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-md flex items-center">
              <BookOpen className="h-5 w-5 text-indigo-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Lectures</p>
                <p className="text-lg font-semibold">{curriculum.lectures?.length || 0}</p>
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
  
        {curriculum.notes && curriculum.notes.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <h2 className="text-lg font-semibold flex items-center text-yellow-800 mb-2">
              <ClipboardList className="h-5 w-5 mr-2" />
              Notes & Announcements
            </h2>
            <div className="space-y-4">
              {curriculum.notes.map((note) => note && (
                <div key={note.id || 'note-' + Math.random()} className="bg-white p-3 rounded border border-yellow-100">
                  <p className="text-gray-700">{note.content || ''}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Unknown date'}
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
                    {lecturesByWeek[week]?.map((lecture) => lecture && (
                      <div key={lecture.id || 'lecture-' + Math.random()} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <Link href={`/dashboard/student/curriculum/${curriculum.id}/lecture/${lecture.id}`}>
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">{lecture.title || 'Untitled Lecture'}</h4>
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
                              {lecture._count?.homeworks > 0 && (
                                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                                  {lecture._count.homeworks} Homework{lecture._count.homeworks !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                            {lecture.content ? lecture.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : 'No content'}
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
  } catch (error) {
    // Catch any unexpected errors
    console.error("Unexpected error in StudentCurriculumView:", error);
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">An error occurred</h1>
        <p className="text-gray-700 mb-4">We're sorry, but there was a problem loading this curriculum.</p>
        <Link 
          href="/dashboard/student" 
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Return to Dashboard
        </Link>
      </div>
    );
  }
}