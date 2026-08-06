import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acesso negado. Token de autenticação não fornecido.',
    });
  }

  try {
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback_jwt_secret';
    const payload = jwt.verify(token, secret) as { userId: string };

    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Token de autenticação inválido ou expirado.',
    });
  }
}
