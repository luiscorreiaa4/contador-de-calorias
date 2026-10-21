import { Request, Response } from 'express';
import * as UserService from '../services/user.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { getSaoPauloDateString } from '../utils/date.js';

interface CustomError {
  statusCode?: number;
  message?: string;
}

export async function register(req: Request, res: Response) {
  try {
    const authData = await UserService.register(req.body);
    return res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso!',
      data: authData,
    });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro interno no servidor.');
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const authData = await UserService.login(req.body);
    return res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso!',
      data: authData,
    });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro interno no servidor.');
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }
    const profile = await UserService.getUserProfile(req.userId);
    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro interno no servidor.');
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }
    const updatedUser = await UserService.updateProfile(req.userId, req.body);
    return res.status(200).json({
      success: true,
      message: 'Perfil atualizado com sucesso!',
      data: updatedUser,
    });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro ao atualizar perfil.');
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

export async function completeOnboarding(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }
    const updatedUser = await UserService.completeOnboarding(req.userId, req.body);
    return res.status(200).json({
      success: true,
      message: 'Onboarding concluído com sucesso!',
      data: updatedUser,
    });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro ao concluir onboarding.');
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

export async function deleteAccount(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }
    const { password } = req.body;
    await UserService.deleteAccount(req.userId, password);
    return res.status(200).json({
      success: true,
      message: 'Sua conta foi excluída com sucesso.',
    });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro ao excluir conta.');
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

export async function previewGoals(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }
    const preview = await UserService.previewGoals(req.userId, req.body);
    return res.status(200).json({
      success: true,
      data: preview,
    });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro ao calcular metas.');
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

export async function updateGoals(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }
    const newGoal = await UserService.updateGoals(req.userId, req.body);
    return res.status(200).json({
      success: true,
      message: 'Metas atualizadas com sucesso!',
      data: newGoal,
    });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro ao salvar metas.');
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

export async function getActiveGoal(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }
    const date = req.query.date as string | undefined;
    const goal = await UserService.getActiveGoal(req.userId, date);
    return res.status(200).json({
      success: true,
      data: goal,
    });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro ao buscar metas.');
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

// Exportação completa dos dados do titular (LGPD art. 18).
export async function exportData(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }
    const data = await UserService.exportUserData(req.userId);
    const filename = `caloriesync-dados-${getSaoPauloDateString()}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro ao exportar dados.');
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

export async function getMeasurements(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }
    const period = req.query.period as '30d' | '90d' | 'all' | undefined;
    const measurements = await UserService.getBodyMeasurements(req.userId, period);
    return res.status(200).json({
      success: true,
      data: measurements,
    });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro ao listar medições.');
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

export async function addMeasurement(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }
    const measurement = await UserService.addBodyMeasurement(req.userId, req.body);
    return res.status(201).json({
      success: true,
      data: measurement,
      message: 'Medição registrada com sucesso.',
    });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro ao registrar medição.');
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

