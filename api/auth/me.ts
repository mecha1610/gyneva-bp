import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCors, checkRateLimit, allowMethods, requireAuth } from '../_lib/middleware.js';
import { serverError } from '../_lib/errors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCors(req, res)) return;
  if (checkRateLimit(req, res)) return;
  if (!allowMethods(req, res, ['GET'])) return;

  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
      },
    });
  } catch (err) {
    return serverError(res, err);
  }
}
