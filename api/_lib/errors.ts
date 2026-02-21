import type { VercelResponse } from '@vercel/node';
import type { ApiError } from '../../lib/types.js';

export function errorResponse(
  res: VercelResponse,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  const body: ApiError = { error: message, code };
  if (details) body.details = details;
  res.status(status).json(body);
}

export function badRequest(res: VercelResponse, message: string, details?: unknown): void {
  errorResponse(res, 400, 'BAD_REQUEST', message, details);
}

export function notFound(res: VercelResponse, message = 'Resource not found'): void {
  errorResponse(res, 404, 'NOT_FOUND', message);
}

export function serverError(res: VercelResponse, err: unknown): void {
  console.error('[API Error]', err);
  errorResponse(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}
