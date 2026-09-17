'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

// ── Change own password ──────────────────────────────────
export async function changePassword(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: 'Not authenticated' };

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword     = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!currentPassword || !newPassword || !confirmPassword)
    return { error: 'All fields are required' };
  if (newPassword.length < 6)
    return { error: 'New password must be at least 6 characters' };
  if (newPassword !== confirmPassword)
    return { error: 'Passwords do not match' };

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return { error: 'User not found' };

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) return { error: 'Current password is incorrect' };

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  return { success: true };
}

// ── Admin: list all login users ──────────────────────────
export async function getUsers() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' };
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, username: true, role: true, status: true, createdAt: true },
  });
  return { users };
}

// ── Admin: create a new login user ───────────────────────
export async function createUser(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' };

  const name     = formData.get('name') as string;
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const role     = formData.get('role') as string;
  const status   = formData.get('status') as string;

  if (!name || !username || !password || !role)
    return { error: 'Name, username, password and role are required' };
  if (password.length < 6)
    return { error: 'Password must be at least 6 characters' };
  if (!['ADMIN', 'CASHIER'].includes(role))
    return { error: 'Invalid role' };

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return { error: 'Username already taken' };

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { name, username, password: hashed, role, status: status || 'ACTIVE' },
  });

  revalidatePath('/users');
  return { success: true };
}

// ── Admin: update role / status ──────────────────────────
export async function updateUser(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' };

  const id     = formData.get('id') as string;
  const role   = formData.get('role') as string;
  const status = formData.get('status') as string;
  const name   = formData.get('name') as string;

  if (!id) return { error: 'User ID required' };
  if (id === session.userId && status === 'INACTIVE')
    return { error: 'You cannot deactivate your own account' };

  await prisma.user.update({
    where: { id },
    data: { ...(role && { role }), ...(status && { status }), ...(name && { name }) },
  });

  revalidatePath('/users');
  return { success: true };
}

// ── Admin: reset another user's password ─────────────────
export async function resetUserPassword(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' };

  const id          = formData.get('id') as string;
  const newPassword = formData.get('newPassword') as string;

  if (!id || !newPassword) return { error: 'ID and new password required' };
  if (newPassword.length < 6) return { error: 'Password must be at least 6 characters' };

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id }, data: { password: hashed } });

  revalidatePath('/users');
  return { success: true };
}
