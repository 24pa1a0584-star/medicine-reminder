import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req[source] = await schema.parseAsync(req[source]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request payload validation failed',
            details: err.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
            status: 400,
          },
        });
        return;
      }
      next(err);
    }
  };
}
