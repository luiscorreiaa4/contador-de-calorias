import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Encapsula rotas e controllers assíncronos do Express para repassar
 * automaticamente quaisquer rejeições ou exceções para o `errorHandler` global (next(err)).
 * Elimina a duplicação de blocos try/catch nos controllers (A-007).
 */
export function asyncHandler<
  TReq extends Request = Request,
  TRes extends Response = Response
>(
  fn: (req: TReq, res: TRes, next: NextFunction) => Promise<unknown> | unknown
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as TReq, res as TRes, next)).catch(next);
  };
}
