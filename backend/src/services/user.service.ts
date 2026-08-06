import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as UserModel from '../models/user.model.js';
import { RegisterUserDTO, LoginUserDTO } from '../schemas/user.schema.js';
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
    data.goal
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

function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET || 'fallback_jwt_secret';
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}

