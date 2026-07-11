import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@shipments/shared';

export function notFoundHandler(_req: Request, res: Response) {
  const body: ApiResponse = {
    isOk: false,
    message: 'Route not found',
    status: 404,
  };
  res.status(404).json(body);
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  const body: ApiResponse = {
    isOk: false,
    message,
    status: 500,
  };
  res.status(500).json(body);
}

export function sendOk<T>(
  res: Response,
  data: T,
  message = 'Success',
  status = 200
) {
  const body: ApiResponse<T> = { isOk: true, message, status, data };
  res.status(status).json(body);
}

export function sendFail(
  res: Response,
  message: string,
  status = 400,
  data?: unknown
) {
  const body: ApiResponse = { isOk: false, message, status, data };
  res.status(status).json(body);
}
