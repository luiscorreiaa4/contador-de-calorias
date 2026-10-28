import { Request, Response } from 'express';
import * as PushService from '../services/push.service.js';
import { requireUserId } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getPublicKey = asyncHandler(async (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: {
      publicKey: PushService.getPublicKey(),
    },
  });
});

export const subscribe = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const subscription = await PushService.subscribe(userId, req.body);
  return res.status(201).json({
    success: true,
    data: subscription,
    message: 'Inscrição push registrada com sucesso.',
  });
});

export const unsubscribe = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { endpoint } = req.body;
  await PushService.unsubscribe(userId, endpoint);
  return res.status(200).json({
    success: true,
    message: 'Inscrição push cancelada com sucesso.',
  });
});

export const sendTest = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const result = await PushService.sendTestNotification(userId);
  return res.status(200).json({
    success: true,
    data: result,
    message: 'Lembrete enviado com sucesso!',
  });
});
