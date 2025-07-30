import { auth } from '@/lib/auth/auth';
import { NextRequest } from 'next/server';

export async function validateSession(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session || !session.user || !session.user.id) {
      return { isValid: false, error: 'No valid session found' };
    }

    return { 
      isValid: true, 
      session, 
      userId: session.user.id 
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return { 
      isValid: false, 
      error: 'Session validation failed',
      details: error 
    };
  }
}

export async function validatePageSession(headers: Headers) {
  try {
    const session = await auth.api.getSession({ headers });

    if (!session || !session.user || !session.user.id) {
      return { isValid: false, error: 'No valid session found' };
    }

    return { 
      isValid: true, 
      session, 
      userId: session.user.id 
    };
  } catch (error) {
    console.error('Page session validation error:', error);
    return { 
      isValid: false, 
      error: 'Session validation failed',
      details: error 
    };
  }
} 