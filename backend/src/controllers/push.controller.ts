import { Request, Response } from 'express';
import * as PushService from '../services/push.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

interface CustomError {
  statusCode?: number;
  message?: string;
}

export async function getPublicKey(_req: Request, res: Response) {
  return res.status(200).json({
    success: true,
    data: {
      publicKey: PushService.getPublicKey(),
    },
  });
}

export async function subscribe(req: Request, res: Response) {
  try {
    const userId = (req as AuthenticatedRequest).userId!;
    const subscription = await PushService.subscribe(userId, req.body);
    return res.status(201).json({
      success: true,
      data: subscription,
      message: 'Inscrição push registrada com sucesso.',
    });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro ao salvar inscrição push.');
    return res.status(statusCode).json({ success: false, message });
  }
}

export async function unsubscribe(req: Request, res: Response) {
  try {
    const userId = (req as AuthenticatedRequest).userId!;
    const { endpoint } = req.body;
    await PushService.unsubscribe(userId, endpoint);
    return res.status(200).json({
      success: true,
      message: 'Inscrição push cancelada com sucesso.',
    });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro ao cancelar inscrição push.');
    return res.status(statusCode).json({ success: false, message });
  }
}

export async function sendTest(req: Request, res: Response) {
  try {
    const userId = (req as AuthenticatedRequest).userId!;
    const result = await PushService.sendTestNotification(userId);
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Lembrete enviado com sucesso!',
    });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro ao enviar notificação teste.');
    return res.status(statusCode).json({ success: false, message });
  }
}
