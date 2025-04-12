import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { BookOpen, User, GraduationCap, ArrowRight } from 'lucide-react';

export default async function Home() {
  // Check if user is already authenticated
  const session = await getServerSession(authOptions);

  if (session) {
    // Redirect to appropriate dashboard based on role
    if (session.user.role === 'TEACHER') {
      redirect('/dashboard/teacher');
    } else if (session.user.role === 'STUDENT') {
      redirect('/dashboard/student');
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <BookOpen className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">CurriculumHub</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
              >
                Log in
              </Link>
              <Link 
                href="/signup" 
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-indigo-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Modern Curriculum</span>
                <span className="block text-indigo-600">Management Platform</span>
              </h1>
              <p className="mt-6 text-base text-gray-500 sm:text-lg md:text-xl">
                Streamline your educational experience with our comprehensive curriculum management solution for universities.
              </p>
              <div className="mt-10 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link 
                    href="/signup" 
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                  >
                    Get started
                  </Link>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <Link 
                    href="/login" 
                    className="w-full flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                  >
                    Log in
                  </Link>
                </div>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                  <img 
                    className="w-full" 
                    src="/api/placeholder/600/400" 
                    alt="Curriculum management platform" 
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white bg-opacity-75 rounded-md p-4">
                      <BookOpen className="h-12 w-12 text-indigo-600 mx-auto" />
                      <p className="text-center font-medium text-indigo-900 mt-2">
                        Modern Learning Experience
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Features</h2>
            <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
              Designed for Everyone
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
              Our platform offers tailored experiences for both teachers and students.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* Teacher Features */}
              <div className="border border-gray-200 rounded-lg px-6 py-8 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <User className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="ml-4 text-xl font-medium text-gray-900">For Teachers</h3>
                </div>
                <div className="mt-4">
                  <ul className="mt-4 space-y-3">
                    <li className="flex items-start">
                      <div className="flex-shrink-0">
                        <ArrowRight className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="ml-3 text-base text-gray-700">
                        Create and manage comprehensive curriculums
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0">
                        <ArrowRight className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="ml-3 text-base text-gray-700">
                        Organize lectures by weeks
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0">
                        <ArrowRight className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="ml-3 text-base text-gray-700">
                        Create homework assignments with automated grading
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0">
                        <ArrowRight className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="ml-3 text-base text-gray-700">
                        Track student progress and engagement
                      </p>
                    </li>
                  </ul>
                  <div className="mt-8">
                    <Link 
                      href="/signup?role=TEACHER" 
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Join as Teacher
                      <ArrowRight className="ml-2 -mr-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Student Features */}
              <div className="border border-gray-200 rounded-lg px-6 py-8 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <GraduationCap className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="ml-4 text-xl font-medium text-gray-900">For Students</h3>
                </div>
                <div className="mt-4">
                  <ul className="mt-4 space-y-3">
                    <li className="flex items-start">
                      <div className="flex-shrink-0">
                        <ArrowRight className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="ml-3 text-base text-gray-700">
                        Join curriculums with unique access codes
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0">
                        <ArrowRight className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="ml-3 text-base text-gray-700">
                        Track your progress through lectures
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0">
                        <ArrowRight className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="ml-3 text-base text-gray-700">
                        Complete assignments and get immediate feedback
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0">
                        <ArrowRight className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="ml-3 text-base text-gray-700">
                        Access all your educational materials in one place
                      </p>
                    </li>
                  </ul>
                  <div className="mt-8">
                    <Link 
                      href="/signup?role=STUDENT" 
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Join as Student
                      <ArrowRight className="ml-2 -mr-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block">Sign up for free today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-indigo-100">
            Join Northern Technical University's modern curriculum management platform and transform your educational experience.
          </p>
          <Link 
            href="/signup" 
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 sm:w-auto"
          >
            Sign up for free
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <div className="mt-8 flex justify-center space-x-6">
            <p className="text-center text-base text-gray-500">
              &copy; {new Date().getFullYear()} CurriculumHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}