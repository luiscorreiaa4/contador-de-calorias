import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import * as UserModel from '../models/user.model.js';
import { RegisterUserDTO, LoginUserDTO, UpdateUserDTO, CompleteOnboardingDTO } from '../schemas/user.schema.js';
import { AuthResponse, UserWithoutPassword } from '../types/user.types.js';
import * as NutritionService from './nutrition.service.js';
import * as HistoryModel from '../models/history.model.js';
import { getSaoPauloDateString } from '../utils/date.js';
import { pool } from '../database/pool.js';
interface CustomError extends Error {
  statusCode?: number;
}

export async function register(data: RegisterUserDTO): Promise<AuthResponse> {
  const existingUser = await UserModel.findUserByEmail(data.email);
  if (existingUser) {
    const error: CustomError = new Error('Este e-mail já está cadastrado.');
    error.statusCode = 400;
    throw error;
  }

  const saltRounds = process.env.NODE_ENV === 'test' ? 1 : 10;
  const passwordHash = await bcrypt.hash(data.password, saltRounds);

  const newUser = await UserModel.createUser(
    data.name,
    data.email,
    passwordHash
  );

  const token = generateToken(newUser.id);

  return {
    user: newUser,
    token,
  };
}

// Hash bcrypt estático para mitigar timing attacks na enumeração de usuários (PC-08 / SEC-005)
const DUMMY_HASH = '$2b$10$7EqJtq98hPqEX7fNZaFWoO9m5N9fKqy4i4U0p1W6eG5q7Xv6eJ8mK';

export async function login(data: LoginUserDTO): Promise<AuthResponse> {
  const user = await UserModel.findUserByEmail(data.email);
  if (!user) {
    await bcrypt.compare(data.password, DUMMY_HASH);
    const error: CustomError = new Error('E-mail ou senha incorretos.');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);
  if (!isPasswordValid) {
    const error: CustomError = new Error('E-mail ou senha incorretos.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user.id);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
}

export async function getUserProfile(userId: string): Promise<UserWithoutPassword> {
  const user = await UserModel.findUserById(userId);
  if (!user) {
    const error: CustomError = new Error('Usuário não encontrado.');
    error.statusCode = 404;
    throw error;
  }
  return user;
}

export async function completeOnboarding(userId: string, data: CompleteOnboardingDTO): Promise<UserWithoutPassword> {
  const user = await UserModel.findFullUserById(userId);
  if (!user) {
    const error: CustomError = new Error('Usuário não encontrado.');
    error.statusCode = 404;
    throw error;
  }

  if (user.onboarding_completed) {
    const error: CustomError = new Error('Onboarding já foi concluído para este usuário.');
    error.statusCode = 400;
    throw error;
  }

  // Calcula as metas iniciais automaticamente
  const targets = NutritionService.calculateEnergyTargets({
    sex: data.sex,
    birthDate: data.birthDate,
    weight: data.weight,
    height: data.height,
    body_fat: data.body_fat,
    activity_level: data.activity_level,
    goal: data.goal,
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updatedUser = await UserModel.updateUser(
      userId,
      {
        sex: data.sex,
        birthDate: data.birthDate,
        goal: data.goal,
        weight: data.weight,
        height: data.height,
        body_fat: data.body_fat,
        activity_level: data.activity_level,
        daily_calories_goal: targets.suggestedCalories, // Manter legibilidade até a fase de limpeza
        daily_proteins_goal: targets.suggestedMacros.proteins,
        onboarding_completed: true,
      },
      client
    );

    // Salvar no histórico
    const todayStr = getSaoPauloDateString();
    await HistoryModel.insertGoal(
      userId,
      todayStr,
      targets.suggestedCalories,
      targets.suggestedMacros.proteins,
      targets.suggestedMacros.carbs,
      targets.suggestedMacros.fats,
      'auto',
      client
    );

    await HistoryModel.insertBodyMeasurement(
      userId,
      data.weight,
      data.body_fat || null,
      new Date(),
      client
    );

    await client.query('COMMIT');
    return updatedUser;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateProfile(userId: string, data: UpdateUserDTO): Promise<UserWithoutPassword> {
  const user = await UserModel.findFullUserById(userId);
  if (!user) {
    const error: CustomError = new Error('Usuário não encontrado.');
    error.statusCode = 404;
    throw error;
  }

  let newPasswordHash: string | undefined;

  // Se o e-mail estiver sendo alterado
  if (data.email && data.email.toLowerCase() !== user.email.toLowerCase()) {
    if (!data.currentPassword || !data.currentPassword.trim()) {
      const error: CustomError = new Error('Confirme sua senha atual para alterar o e-mail.');
      error.statusCode = 400;
      throw error;
    }

    const isPassValid = await bcrypt.compare(data.currentPassword, user.password_hash);
    if (!isPassValid) {
      const error: CustomError = new Error('Senha atual incorreta.');
      error.statusCode = 400;
      throw error;
    }

    const emailInUse = await UserModel.findUserByEmail(data.email);
    if (emailInUse && emailInUse.id !== userId) {
      const error: CustomError = new Error('Este e-mail já está em uso por outra conta.');
      error.statusCode = 400;
      throw error;
    }
  }

  // Se a senha estiver sendo alterada
  if (data.newPassword) {
    if (!data.currentPassword || !data.currentPassword.trim()) {
      const error: CustomError = new Error('Informe sua senha atual para definir a nova senha.');
      error.statusCode = 400;
      throw error;
    }

    const isPassValid = await bcrypt.compare(data.currentPassword, user.password_hash);
    if (!isPassValid) {
      const error: CustomError = new Error('Senha atual incorreta.');
      error.statusCode = 400;
      throw error;
    }

    const saltRounds = process.env.NODE_ENV === 'test' ? 1 : 10;
    newPasswordHash = await bcrypt.hash(data.newPassword, saltRounds);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updatedUser = await UserModel.updateUser(
      userId,
      {
        name: data.name,
        email: data.email,
        passwordHash: newPasswordHash,
        goal: data.goal,
        sex: data.sex,
        birthDate: data.birthDate,
        weight: data.weight,
        height: data.height,
        body_fat: data.body_fat,
        activity_level: data.activity_level,
      },
      client
    );

    // Se houve alteração no peso ou percentual de gordura, registrar histórico
    if (data.weight !== undefined || data.body_fat !== undefined) {
      // Usar o peso novo se enviado, senão o atual do banco. Mesma coisa pro BF.
      const finalWeight = data.weight ?? Number(user.weight);
      let finalBodyFat: number | null = null;
      if (data.body_fat !== undefined) finalBodyFat = data.body_fat;
      else if (user.body_fat !== undefined && user.body_fat !== null) finalBodyFat = Number(user.body_fat);

      await HistoryModel.insertBodyMeasurement(
        userId,
        finalWeight,
        finalBodyFat,
        new Date(),
        client
      );
    }

    await client.query('COMMIT');
    return updatedUser;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteAccount(userId: string, password?: string): Promise<boolean> {
  const user = await UserModel.findFullUserById(userId);
  if (!user) {
    const error: CustomError = new Error('Usuário não encontrado.');
    error.statusCode = 404;
    throw error;
  }

  if (!password || !password.trim()) {
    const error: CustomError = new Error('Informe sua senha para confirmar a exclusão da conta.');
    error.statusCode = 400;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    const error: CustomError = new Error('Senha incorreta.');
    error.statusCode = 400;
    throw error;
  }

  return await UserModel.deleteUser(userId);
}

function generateToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '7d' });
}

export async function previewGoals(userId: string, data: Partial<import('../schemas/user.schema.js').PreviewGoalsDTO>) {
  const user = await UserModel.findFullUserById(userId);
  if (!user) {
    const error: CustomError = new Error('Usuário não encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const profileForCalc = {
    sex: data.sex ?? (user.sex as 'masculino' | 'feminino' | 'prefiro_nao_responder'),
    birthDate: data.birthDate ?? (user.birth_date as string) ?? '',
    goal: data.goal ?? (user.goal as 'perder_peso' | 'manter_peso' | 'ganhar_massa'),
    weight: data.weight ?? Number(user.weight),
    height: data.height ?? Number(user.height),
    body_fat: data.body_fat !== undefined ? data.body_fat : (user.body_fat ? Number(user.body_fat) : null),
    activity_level: data.activity_level ?? (user.activity_level as 'sedentario' | 'pouco_ativo' | 'moderadamente_ativo' | 'muito_ativo' | 'extremamente_ativo'),
  };

  return NutritionService.calculateEnergyTargets(profileForCalc);
}

export async function updateGoals(userId: string, data: import('../schemas/user.schema.js').UpdateGoalsDTO) {
  const user = await UserModel.findFullUserById(userId);
  if (!user) {
    const error: CustomError = new Error('Usuário não encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const todayStr = getSaoPauloDateString();
    const newGoal = await HistoryModel.insertGoal(
      userId,
      todayStr,
      data.calories,
      data.proteins,
      data.carbs,
      data.fats,
      data.mode,
      client
    );

    await UserModel.updateUser(
      userId,
      {
        daily_calories_goal: data.calories,
        daily_proteins_goal: data.proteins,
      },
      client
    );

    await client.query('COMMIT');
    return newGoal;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getActiveGoal(userId: string, dateStr?: string) {
  const targetDate = dateStr ?? getSaoPauloDateString();
  const goal = await HistoryModel.getActiveGoal(userId, targetDate);
  if (!goal) {
    const user = await UserModel.findFullUserById(userId);
    if (user && user.daily_calories_goal) {
      return {
        id: 'fallback',
        user_id: userId,
        effective_from: user.created_at,
        calories: Number(user.daily_calories_goal),
        proteins: Number(user.daily_proteins_goal),
        carbs: 0,
        fats: 0,
        mode: 'auto',
        created_at: user.created_at
      };
    }
  }
  return goal;
}
