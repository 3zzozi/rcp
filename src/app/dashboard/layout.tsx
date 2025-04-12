import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { LogOut, Menu, X } from 'lucide-react';
import { SignOutButton } from '@/src/app/components/auth/SignOutButton';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600">
                Curriculum Manager
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm font-medium text-gray-700">
                {session.user.name}
              </div>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}