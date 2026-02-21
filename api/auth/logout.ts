import type { VercelRequest, VercelResponse } from '@vercel/node';
import { deleteSession, clearSessionCookie } from '../_lib/auth';
import { setCors, checkRateLimit, allowMethods } from '../_lib/middleware';
import { serverError } from '../_lib/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCors(req, res)) return;
  if (checkRateLimit(req, res)) return;
  if (!allowMethods(req, res, ['POST'])) return;

  try {
    await deleteSession(req);
    clearSessionCookie(res);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return serverError(res, err);
  }
}
