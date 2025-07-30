import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug: Checking session...');
    
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json({ 
        status: 'no_session',
        message: 'No session found' 
      });
    }

    console.log('Debug: Session found:', {
      hasUser: !!session.user,
      userId: session.user?.id,
      userEmail: session.user?.email
    });

    if (!session.user || !session.user.id) {
      return NextResponse.json({ 
        status: 'invalid_session',
        message: 'Session exists but no user data',
        session: session
      });
    }

    // Check if user exists in database
    const dbUser = await db.select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    return NextResponse.json({
      status: 'success',
      session: {
        userId: session.user.id,
        userEmail: session.user.email,
        userName: session.user.name
      },
      userExistsInDb: dbUser.length > 0,
      dbUser: dbUser[0] || null
    });

  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check session',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 