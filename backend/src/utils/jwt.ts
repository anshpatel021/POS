import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { JWTPayload } from '../types';

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as string,
  } as any);
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, config.jwt.secret) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

export const verifyRefreshToken = (token: string): boolean => {
  // Refresh tokens are validated against database, not JWT
  return token.length === 128; // 64 bytes = 128 hex characters
};
