import { cookies } from 'next/headers';
import { encrypt, decrypt } from './jwt';

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('auth-token')?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch (error) {
    return null;
  }
}

export async function setSessionCookie(payload: any) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt({ ...payload, expires });
  const cookieStore = await cookies();

  cookieStore.set('auth-token', session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}
