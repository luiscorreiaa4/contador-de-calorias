import { Request, Response } from 'express';
import * as UserService from '../services/user.service.js';
import { requireUserId } from '../middlewares/auth.js';
import { getSaoPauloDateString } from '../utils/date.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const authData = await UserService.register(req.body);
  return res.status(201).json({
    success: true,
    message: 'Conta criada com sucesso!',
    data: authData,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const authData = await UserService.login(req.body);
  return res.status(200).json({
    success: true,
    message: 'Login realizado com sucesso!',
    data: authData,
  });
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const profile = await UserService.getUserProfile(userId);
  return res.status(200).json({
    success: true,
    data: profile,
  });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const updatedUser = await UserService.updateProfile(userId, req.body);
  return res.status(200).json({
    success: true,
    message: 'Perfil atualizado com sucesso!',
    data: updatedUser,
  });
});

export const completeOnboarding = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const updatedUser = await UserService.completeOnboarding(userId, req.body);
  return res.status(200).json({
    success: true,
    message: 'Onboarding concluído com sucesso!',
    data: updatedUser,
  });
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { password } = req.body;
  await UserService.deleteAccount(userId, password);
  return res.status(200).json({
    success: true,
    message: 'Sua conta foi excluída com sucesso.',
  });
});

export const previewGoals = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const preview = await UserService.previewGoals(userId, req.body);
  return res.status(200).json({
    success: true,
    data: preview,
  });
});

export const updateGoals = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const newGoal = await UserService.updateGoals(userId, req.body);
  return res.status(200).json({
    success: true,
    message: 'Metas atualizadas com sucesso!',
    data: newGoal,
  });
});

export const getActiveGoal = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const date = req.query.date as string | undefined;
  const goal = await UserService.getActiveGoal(userId, date);
  return res.status(200).json({
    success: true,
    data: goal,
  });
});

// Exportação completa dos dados do titular (LGPD art. 18).
export const exportData = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const data = await UserService.exportUserData(userId);
  const filename = `caloriesync-dados-${getSaoPauloDateString()}.json`;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).json({
    success: true,
    data,
  });
});

export const getMeasurements = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const period = req.query.period as '30d' | '90d' | 'all' | undefined;
  const measurements = await UserService.getBodyMeasurements(userId, period);
  return res.status(200).json({
    success: true,
    data: measurements,
  });
});

export const addMeasurement = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const measurement = await UserService.addBodyMeasurement(userId, req.body);
  return res.status(201).json({
    success: true,
    data: measurement,
    message: 'Medição registrada com sucesso.',
  });
});
