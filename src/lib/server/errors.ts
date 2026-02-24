import { NextResponse } from 'next/server';
import type { ApiError } from '../../../lib/types';

export function errorResponse(status: number, code: string, message: string, details?: unknown): NextResponse {
  const body: ApiError = { error: message, code };
  if (details !== undefined) body.details = details;
  return NextResponse.json(body, { status });
}

export function badRequest(message: string, details?: unknown): NextResponse {
  return errorResponse(400, 'BAD_REQUEST', message, details);
}

export function notFound(message = 'Resource not found'): NextResponse {
  return errorResponse(404, 'NOT_FOUND', message);
}

export function serverError(err: unknown): NextResponse {
  console.error('[API Error]', err);
  return errorResponse(500, 'INTERNAL_ERROR', 'Internal server error');
}
