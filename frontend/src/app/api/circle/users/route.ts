/**
 * Circle Users API Route
 * POST /api/circle/users - Create new Circle user
 */

import { NextRequest, NextResponse } from 'next/server';
import { callCircleAPI } from '@/lib/circle-api';

export const runtime = 'nodejs';

interface CreateUserRequest {
  userId: string; // Your application's user ID
}

interface CircleUser {
  userId: string;
  userToken: string;
  encryptionKey: string;
  createDate: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateUserRequest = await request.json();

    if (!body.userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Create user in Circle
    const user = await callCircleAPI<CircleUser>('/users', {
      method: 'POST',
      body: JSON.stringify({
        userId: body.userId,
      }),
    });

    // Return user tokens (encryptionKey should be stored securely)
    return NextResponse.json({
      userId: user.userId,
      userToken: user.userToken,
      encryptionKey: user.encryptionKey,
      createDate: user.createDate,
    });

  } catch (error: any) {
    console.error('Circle user creation failed:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to create Circle user',
        code: error.circleCode,
      },
      { status: error.statusCode || 500 }
    );
  }
}
