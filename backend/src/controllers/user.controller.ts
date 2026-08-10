import { Request, Response } from 'express';
import * as UserService from '../services/user.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export async function register(req: Request, res: Response) {
  try {
    const authData = await UserService.register(req.body);
    return res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso!',
      data: authData,
    });
  } catch (error: any) {
    const statusCode = error.statusCode ?? 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message ?? 'Erro interno no servidor.',
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
  } catch (error: any) {
    const statusCode = error.statusCode ?? 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message ?? 'Erro interno no servidor.',
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
  } catch (error: any) {
    const statusCode = error.statusCode ?? 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message ?? 'Erro interno no servidor.',
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
  } catch (error: any) {
    const statusCode = error.statusCode ?? 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message ?? 'Erro ao atualizar perfil.',
    });
  }
}

export async function deleteAccount(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }
    await UserService.deleteAccount(req.userId);
    return res.status(200).json({
      success: true,
      message: 'Sua conta foi excluída com sucesso.',
    });
  } catch (error: any) {
    const statusCode = error.statusCode ?? 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message ?? 'Erro ao excluir conta.',
    });
  }
}
