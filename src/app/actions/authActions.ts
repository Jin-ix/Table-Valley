'use server';

import { prisma } from '@/lib/prisma';
import { setSessionCookie, clearSessionCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function login(formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return { error: 'Missing email or password' };
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username: email },
    });

    if (!user) {
      return { error: 'Invalid credentials' };
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return { error: 'Invalid credentials' };
    }

    if (user.status !== 'ACTIVE') {
      return { error: 'Account is inactive' };
    }

    // Set session
    await setSessionCookie({
      userId: user.id,
      email: user.username,
      role: user.role,
      name: user.name,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Login error:', error);
    return { error: 'Server error: ' + (error.message || 'Unknown error') };
  }
}

export async function logout() {
  await clearSessionCookie();
}
