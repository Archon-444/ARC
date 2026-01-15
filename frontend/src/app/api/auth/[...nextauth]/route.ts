/**
 * NextAuth.js API Route
 *
 * Handles all authentication flows including:
 * - Google OAuth
 * - Facebook OAuth
 * - Apple OAuth
 * - Session management
 */

import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import AppleProvider from 'next-auth/providers/apple';
import { listConnectedWallets } from '@/lib/wallet-ownership';

/**
 * NextAuth Configuration
 *
 * Required Environment Variables:
 * - NEXTAUTH_URL: Your application URL (e.g., http://localhost:3000)
 * - NEXTAUTH_SECRET: Random string for JWT encryption
 * - GOOGLE_CLIENT_ID: From Google Cloud Console
 * - GOOGLE_CLIENT_SECRET: From Google Cloud Console
 * - FACEBOOK_CLIENT_ID: From Facebook Developer Portal
 * - FACEBOOK_CLIENT_SECRET: From Facebook Developer Portal
 * - APPLE_CLIENT_ID: From Apple Developer Portal
 * - APPLE_CLIENT_SECRET: From Apple Developer Portal
 */
export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),

    // Facebook OAuth
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    }),

    // Apple OAuth
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID || '',
      clientSecret: process.env.APPLE_CLIENT_SECRET || '',
    }),
  ],

  // Custom pages
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  // Callbacks
  callbacks: {
    /**
     * Called when user signs in
     * Here we can create a Circle wallet for the user
     */
    async signIn({ user, account, profile }) {
      console.log('[NextAuth] Sign in:', {
        user: user.email,
        provider: account?.provider,
      });

      // You can add custom logic here, e.g.:
      // - Create Circle wallet for new users
      // - Link social account to existing wallet
      // - Store user data in database

      return true; // Allow sign in
    },

    /**
     * Called whenever a JWT is created or updated
     * Add custom fields to the JWT token
     */
    async jwt({ token, user, account }) {
      // Add OAuth provider info to token
      if (account) {
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
      }

      // Add user info to token
      if (user) {
        token.userId = user.id;
      }

      return token;
    },

    /**
     * Called whenever a session is checked
     * Add custom fields to the session object
     */
    async session({ session, token }) {
      // Add custom fields to session that are available on client
      if (session.user) {
        (session.user as any).provider = token.provider;
        (session.user as any).userId = token.userId;
        if (token.userId) {
          (session.user as any).connectedWallets = await listConnectedWallets(token.userId as string);
        } else {
          (session.user as any).connectedWallets = [];
        }
      }

      return session;
    },
  },

  // Session configuration
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // JWT configuration
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
