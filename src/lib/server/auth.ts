import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import type { NextRequest } from 'next/server';
import { prisma } from './db';
import type { User } from '@prisma/client';

export const SESSION_COOKIE = 'gyneva_session';
export const SESSION_DURATION_S = 24 * 60 * 60; // 24 hours in seconds

// Lazy — checked at request time, not at module load (safe for next build)
function getGoogleClient(): OAuth2Client {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) throw new Error('Missing required environment variable: GOOGLE_CLIENT_ID');
  return new OAuth2Client(id);
}

// ===== Google Token Verification =====

export interface GooglePayload {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export async function verifyGoogleToken(credential: string): Promise<GooglePayload> {
  const client = getGoogleClient();
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error('Invalid Google token');
  }
  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name,
    picture: payload.picture,
  };
}

// ===== Password Hashing =====

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ===== Email Whitelist Check =====

export async function isEmailAllowed(email: string): Promise<boolean> {
  const entry = await prisma.allowedEmail.findUnique({
    where: { email: email.toLowerCase() },
  });
  return !!entry;
}

// ===== Session Management =====

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_S * 1000);

  await prisma.session.create({
    data: { userId, token, expiresAt },
  });

  return token;
}

export async function getSessionUser(req: NextRequest): Promise<User | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(err =>
        console.warn('[auth] Failed to delete expired session:', err)
      );
    }
    return null;
  }

  return session.user;
}

export async function deleteSessionByRequest(req: NextRequest): Promise<void> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
}

export async function cleanExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}

// ===== Cookie Options =====

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: SESSION_DURATION_S,
  };
}

export function clearCookieOptions() {
  return {
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 0,
  };
}
