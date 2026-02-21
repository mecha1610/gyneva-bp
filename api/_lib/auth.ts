import { OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'crypto';
import { serialize, parse } from 'cookie';
import type { IncomingMessage, ServerResponse } from 'http';
import { prisma } from './db';
import type { User } from '@prisma/client';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const SESSION_COOKIE = 'gyneva_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// ===== Google Token Verification =====

export interface GooglePayload {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export async function verifyGoogleToken(credential: string): Promise<GooglePayload> {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_CLIENT_ID,
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
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: { userId, token, expiresAt },
  });

  return token;
}

export async function getSessionUser(req: IncomingMessage): Promise<User | null> {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  return session.user;
}

export async function deleteSession(req: IncomingMessage): Promise<void> {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies[SESSION_COOKIE];
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

// ===== Cookie Helpers =====

export function setSessionCookie(res: ServerResponse, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', serialize(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
    maxAge: SESSION_DURATION_MS / 1000,
  }));
}

export function clearSessionCookie(res: ServerResponse): void {
  res.setHeader('Set-Cookie', serialize(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  }));
}
