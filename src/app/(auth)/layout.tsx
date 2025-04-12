import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '../api/auth/[...nextauth]/route';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is already authenticated
  const session = await getServerSession(authOptions);

  if (session) {
    // Redirect to appropriate dashboard based on role
    if (session.user.role === 'TEACHER') {
      redirect('/dashboard/teacher');
    } else if (session.user.role === 'STUDENT') {
      redirect('/dashboard/student');
    } else {
      redirect('/');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}