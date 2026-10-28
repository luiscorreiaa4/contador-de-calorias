import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export type ValidationSchemas =
  | ZodSchema
  | {
      body?: ZodSchema;
      query?: ZodSchema;
      params?: ZodSchema;
    };

export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    if ('safeParse' in schemas) {
      const result = schemas.safeParse(req.body);
      if (!result.success) {
        const errorMessage = result.error.issues.map((i) => i.message).join(', ');
        return res.status(400).json({
          success: false,
          message: errorMessage,
        });
      }
      req.body = result.data;
      res.locals.validated = { body: result.data };
      return next();
    }

    res.locals.validated = res.locals.validated || {};

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error.issues.map((i) => i.message).join(', '),
        });
      }
      req.params = result.data as Record<string, string>;
      res.locals.validated.params = result.data;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error.issues.map((i) => i.message).join(', '),
        });
      }
      req.query = result.data;
      res.locals.validated.query = result.data;
    }

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error.issues.map((i) => i.message).join(', '),
        });
      }
      req.body = result.data;
      res.locals.validated.body = result.data;
    }

    return next();
  };
}
