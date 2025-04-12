import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

// Get the session on the server
export async function getSession() {
  return getServerSession(authOptions);
}

// Check if the user is authenticated
export async function getCurrentUser() {
  const session = await getSession();
  
  if (!session?.user?.email) {
    return null;
  }
  
  return session.user;
}

// Guard routes that require authentication
export async function requireAuth(redirectTo = '/login') {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect(redirectTo);
  }
  
  return user;
}

// Guard routes that require teacher role
export async function requireTeacher(redirectTo = '/dashboard/student') {
  const user = await requireAuth();
  
  if (user.role !== 'TEACHER') {
    redirect(redirectTo);
  }
  
  return user;
}

// Guard routes that require student role
export async function requireStudent(redirectTo = '/dashboard/teacher') {
  const user = await requireAuth();
  
  if (user.role !== 'STUDENT') {
    redirect(redirectTo);
  }
  
  return user;
}

// Generate a unique curriculum code
export function generateUniqueCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}