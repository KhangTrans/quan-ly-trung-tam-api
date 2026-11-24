import { Request } from 'express';

export type UserRole = 'admin' | 'staff' | 'teacher' | 'student';

export interface JwtPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  token: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
