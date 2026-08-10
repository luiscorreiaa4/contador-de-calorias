import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as UserModel from '../models/user.model.js';
import { RegisterUserDTO, LoginUserDTO, UpdateUserDTO } from '../schemas/user.schema.js';
import { AuthResponse, UserWithoutPassword } from '../types/user.types.js';

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

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(data.password, saltRounds);

  const newUser = await UserModel.createUser(
    data.name,
    data.email,
    passwordHash,
    data.goal,
    data.sex,
    data.birthDate
  );

  const token = generateToken(newUser.id);

  return {
    user: newUser,
    token,
  };
}

export async function login(data: LoginUserDTO): Promise<AuthResponse> {
  const user = await UserModel.findUserByEmail(data.email);
  if (!user) {
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

    const saltRounds = 10;
    newPasswordHash = await bcrypt.hash(data.newPassword, saltRounds);
  }

  const updatedUser = await UserModel.updateUser(userId, {
    name: data.name,
    email: data.email,
    passwordHash: newPasswordHash,
    goal: data.goal,
    sex: data.sex,
    birthDate: data.birthDate,
  });

  return updatedUser;
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
  const secret = process.env.JWT_SECRET || 'fallback_jwt_secret';
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}
