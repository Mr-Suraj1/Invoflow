import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/db';
import { businessProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for business profile
const businessProfileSchema = z.object({
  businessName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  logo: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get existing business profile
    const [profile] = await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.userId, userId))
      .limit(1);

    if (!profile) {
      // Return empty profile if none exists
      return NextResponse.json({
        businessName: '',
        phone: '',
        email: session.user.email || '',
        address: '',
        logo: session.user.image || ''
      });
    }

    return NextResponse.json({
      businessName: profile.businessName || '',
      phone: profile.phone || '',
      email: profile.email || session.user.email || '',
      address: profile.address || '',
      logo: profile.logo || session.user.image || ''
    });

  } catch (error) {
    console.error('Get profile API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    // Validate the request body
    const validatedData = businessProfileSchema.parse(body);

    // Check if profile already exists
    const [existingProfile] = await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.userId, userId))
      .limit(1);

    if (existingProfile) {
      // Update existing profile
      const [updatedProfile] = await db
        .update(businessProfiles)
        .set({
          businessName: validatedData.businessName,
          phone: validatedData.phone,
          email: validatedData.email,
          address: validatedData.address,
          logo: validatedData.logo,
          updatedAt: new Date(),
        })
        .where(eq(businessProfiles.userId, userId))
        .returning();

      return NextResponse.json(updatedProfile);
    } else {
      // Create new profile
      const [newProfile] = await db
        .insert(businessProfiles)
        .values({
          userId,
          businessName: validatedData.businessName,
          phone: validatedData.phone,
          email: validatedData.email,
          address: validatedData.address,
          logo: validatedData.logo,
        })
        .returning();

      return NextResponse.json(newProfile);
    }

  } catch (error) {
    console.error('Save profile API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    );
  }
} 