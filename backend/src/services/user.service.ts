import bcrypt from 'bcrypt';
import * as UserModel from '../models/user.model.js';
import * as AuthModel from '../models/auth.model.js';
import { signAuthToken } from '../utils/jwt.js';
import { sendVerificationCodeForUser } from './auth.service.js';
import { structuredLog } from '../config/logger.js';
import {
  UpdateUserDTO,
  CompleteOnboardingDTO,
  CreateMeasurementDTO,
  UserWithoutPassword,
  type Meal,
} from '@caloriesync/shared';
import * as NutritionService from './nutrition.service.js';
import * as HistoryModel from '../models/history.model.js';
import * as MealModel from '../models/meal.model.js';
import { getSaoPauloDateString } from '../utils/date.js';
import { pool } from '../database/pool.js';
interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export async function getUserProfile(userId: string): Promise<UserWithoutPassword> {
  const user = await UserModel.findUserById(userId);
  if (!user) {
    const error: CustomError = new Error('Usuário não encontrado.');
    error.statusCode = 401;
    error.code = 'USER_NOT_FOUND';
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
      data.body_fat ?? null,
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

export async function updateProfile(
  userId: string,
  data: UpdateUserDTO
): Promise<UserWithoutPassword & { token?: string }> {
  const user = await UserModel.findFullUserById(userId);
  if (!user) {
    const error: CustomError = new Error('Usuário não encontrado.');
    error.statusCode = 404;
    throw error;
  }

  let newPasswordHash: string | undefined;
  const newEmail = data.email?.trim().toLowerCase();
  const emailChanged = !!newEmail && newEmail !== user.email.toLowerCase();

  // Se o e-mail estiver sendo alterado
  if (emailChanged) {
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

    const emailInUse = await UserModel.findUserByEmail(newEmail);
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

    let updatedUser: UserWithoutPassword;
    try {
      updatedUser = await UserModel.updateUser(
        userId,
        {
          name: data.name,
          email: newEmail,
          passwordHash: newPasswordHash,
          goal: data.goal,
          sex: data.sex,
          birthDate: data.birthDate,
          weight: data.weight,
          height: data.height,
          body_fat: data.body_fat,
          activity_level: data.activity_level,
          emailVerifiedAt: emailChanged ? null : undefined,
        },
        client
      );
    } catch (err: unknown) {
      const pgErr = err as { code?: string; constraint?: string; detail?: string };
      if (pgErr?.code === '23505') {
        const error: CustomError = new Error('Este e-mail já está em uso por outra conta.');
        error.statusCode = 409;
        throw error;
      }
      throw err;
    }

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

    // A-035: Se houve alteração em campos antropométricos/metas e a meta ativa for 'auto', recalcular metas
    const hasAntroChanges =
      data.weight !== undefined ||
      data.height !== undefined ||
      data.body_fat !== undefined ||
      data.goal !== undefined ||
      data.activity_level !== undefined ||
      data.sex !== undefined ||
      data.birthDate !== undefined;

    if (hasAntroChanges && updatedUser.onboarding_completed) {
      const todayStr = getSaoPauloDateString();
      const activeGoal = await HistoryModel.getActiveGoal(userId, todayStr);
      // Recalcula apenas se o usuário usa meta no modo 'auto' (ou se ainda não tem meta registrada)
      if (!activeGoal || activeGoal.mode === 'auto') {
        if (
          (updatedUser.sex === 'masculino' || updatedUser.sex === 'feminino' || updatedUser.sex === 'prefiro_nao_responder') &&
          updatedUser.goal &&
          updatedUser.weight != null &&
          updatedUser.height != null &&
          (updatedUser.activity_level === 'sedentario' ||
            updatedUser.activity_level === 'pouco_ativo' ||
            updatedUser.activity_level === 'moderadamente_ativo' ||
            updatedUser.activity_level === 'muito_ativo' ||
            updatedUser.activity_level === 'extremamente_ativo') &&
          updatedUser.birth_date
        ) {
          const profileForCalc: NutritionService.UserProfile = {
            sex: updatedUser.sex,
            birthDate: String(updatedUser.birth_date),
            goal: updatedUser.goal,
            weight: Number(updatedUser.weight),
            height: Number(updatedUser.height),
            body_fat: updatedUser.body_fat != null ? Number(updatedUser.body_fat) : null,
            activity_level: updatedUser.activity_level,
          };

          const newTargets = NutritionService.calculateEnergyTargets(profileForCalc);
          await HistoryModel.insertGoal(
            userId,
            todayStr,
            newTargets.suggestedCalories,
            newTargets.suggestedMacros.proteins,
            newTargets.suggestedMacros.carbs,
            newTargets.suggestedMacros.fats,
            'auto',
            client
          );
          await client.query(
            `UPDATE users SET daily_calories_goal = $1, daily_proteins_goal = $2 WHERE id = $3`,
            [newTargets.suggestedCalories, newTargets.suggestedMacros.proteins, userId]
          );
        }
      }
    }

    let refreshedToken: string | undefined;
    if (newPasswordHash || emailChanged) {
      // A8: revoga sessões anteriores na mesma transação e devolve token novo.
      const tokenVersion = await AuthModel.incrementTokenVersion(userId, client);
      refreshedToken = signAuthToken(userId, tokenVersion);
    }

    await client.query('COMMIT');

    if (emailChanged) {
      // A conta volta a "não verificada": emite código para o novo endereço.
      try {
        await sendVerificationCodeForUser(userId);
      } catch (error) {
        structuredLog('error', 'auth_verification_email_failed', {
          error: error instanceof Error ? error.message : 'unknown_error',
        });
      }
    }

    return refreshedToken ? { ...updatedUser, token: refreshedToken } : updatedUser;
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

export async function previewGoals(userId: string, data: Partial<import('@caloriesync/shared').PreviewGoalsDTO>) {
  const user = await UserModel.findFullUserById(userId);
  if (!user) {
    const error: CustomError = new Error('Usuário não encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const birthDate = data.birthDate ?? (user.birth_date ? String(user.birth_date) : null);
  if (!birthDate) {
    const error: CustomError = new Error('Informe a data de nascimento para calcular as metas.');
    error.statusCode = 422;
    throw error;
  }

  const sex = data.sex ?? (user.sex as 'masculino' | 'feminino' | 'prefiro_nao_responder' | null);
  const goal = data.goal ?? (user.goal as 'perder_peso' | 'manter_peso' | 'ganhar_massa' | null);
  const weight = data.weight ?? (user.weight != null ? Number(user.weight) : null);
  const height = data.height ?? (user.height != null ? Number(user.height) : null);
  const activityLevel = data.activity_level ?? (user.activity_level as 'sedentario' | 'pouco_ativo' | 'moderadamente_ativo' | 'muito_ativo' | 'extremamente_ativo' | null);

  if (!sex || !goal || weight == null || height == null || !activityLevel) {
    const error: CustomError = new Error('Dados incompletos para calcular as metas nutricionais.');
    error.statusCode = 422;
    throw error;
  }

  const profileForCalc = {
    sex,
    birthDate,
    goal,
    weight,
    height,
    body_fat: data.body_fat !== undefined ? data.body_fat : (user.body_fat != null ? Number(user.body_fat) : null),
    activity_level: activityLevel,
  };

  return NutritionService.calculateEnergyTargets(profileForCalc);
}

export async function updateGoals(userId: string, data: import('@caloriesync/shared').UpdateGoalsDTO) {
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
      let carbs: number;
      let fats: number;
      try {
        if (user.birth_date && user.sex && user.goal && user.weight && user.height && user.activity_level) {
          const profileForCalc: NutritionService.UserProfile = {
            sex: user.sex as NutritionService.UserProfile['sex'],
            birthDate: String(user.birth_date),
            goal: user.goal as NutritionService.UserProfile['goal'],
            weight: Number(user.weight),
            height: Number(user.height),
            body_fat: user.body_fat != null ? Number(user.body_fat) : null,
            activity_level: user.activity_level as NutritionService.UserProfile['activity_level'],
          };
          const targets = NutritionService.calculateEnergyTargets(profileForCalc);
          carbs = targets.suggestedMacros.carbs;
          fats = targets.suggestedMacros.fats;
        } else {
          throw new Error('Perfil incompleto');
        }
      } catch {
        const cal = Number(user.daily_calories_goal);
        const prot = Number(user.daily_proteins_goal) || 100;
        fats = Math.round((cal * 0.25) / 9);
        carbs = Math.max(0, Math.round((cal - prot * 4 - fats * 9) / 4));
      }

      return {
        id: `fallback-${userId}`,
        user_id: userId,
        effective_from: user.created_at,
        calories: Number(user.daily_calories_goal),
        proteins: Number(user.daily_proteins_goal),
        carbs,
        fats,
        mode: 'auto' as const,
        created_at: user.created_at,
      };
    }
  }
  return goal;
}

// Exportação e portabilidade dos dados do titular (LGPD art. 18).
export interface UserDataExport {
  exported_at: string;
  schema_version: string;
  profile: UserWithoutPassword;
  goals: HistoryModel.UserGoal[];
  body_measurements: HistoryModel.BodyMeasurement[];
  meals: Meal[];
}

export const EXPORT_SCHEMA_VERSION = '1.0';

/** Retorna o JSON estruturado com todos os dados pessoais do usuário autenticado. */
export async function exportUserData(userId: string): Promise<UserDataExport> {
  const user = await UserModel.findUserById(userId);
  if (!user) {
    const error: CustomError = new Error('Usuário não encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const [goals, bodyMeasurements, meals] = await Promise.all([
    HistoryModel.listGoalsByUser(userId),
    HistoryModel.listBodyMeasurementsByUser(userId),
    MealModel.findAllMealsByUser(userId),
  ]);

  return {
    exported_at: new Date().toISOString(),
    schema_version: EXPORT_SCHEMA_VERSION,
    profile: user,
    goals,
    body_measurements: bodyMeasurements,
    meals,
  };
}

export async function getBodyMeasurements(
  userId: string,
  period?: '30d' | '90d' | 'all'
): Promise<HistoryModel.BodyMeasurement[]> {
  return HistoryModel.listBodyMeasurementsByUser(userId, period);
}

export async function addBodyMeasurement(
  userId: string,
  data: CreateMeasurementDTO
): Promise<HistoryModel.BodyMeasurement> {
  let measuredAt: Date;
  if (data.measured_at) {
    const trimmed = data.measured_at.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      measuredAt = new Date(`${trimmed}T12:00:00-03:00`);
    } else {
      measuredAt = new Date(trimmed);
    }
  } else {
    measuredAt = new Date();
  }
  return HistoryModel.addBodyMeasurement(userId, data.weight, data.body_fat ?? null, measuredAt);
}

