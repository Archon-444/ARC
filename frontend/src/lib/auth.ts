/**
 * Authentication Library
 *
 * Provides utilities for NextAuth.js authentication
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Get the current session on the server side
 * Use this in Server Components and API routes
 *
 * @example
 * ```tsx
 * // In a Server Component
 * export default async function ProfilePage() {
 *   const session = await getSession();
 *   if (!session) {
 *     redirect('/auth/signin');
 *   }
 *   return <div>Welcome {session.user.name}</div>;
 * }
 * ```
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Check if user is authenticated on server side
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}

/**
 * Require authentication on server side
 * Throws error if not authenticated
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }
  return session;
}
