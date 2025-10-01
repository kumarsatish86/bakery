import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'STORE_MANAGER' | 'PRODUCTION_TEAM' | 'DELIVERY_TEAM' | 'CASHIER' | 'MANAGER';
  isActive: boolean;
}

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  customerType: 'INDIVIDUAL' | 'B2B' | 'COMMUNITY';
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): { id: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  STORE_MANAGER: 'STORE_MANAGER',
  PRODUCTION_TEAM: 'PRODUCTION_TEAM',
  DELIVERY_TEAM: 'DELIVERY_TEAM',
  CASHIER: 'CASHIER',
  MANAGER: 'MANAGER'
} as const;

export const CUSTOMER_TYPES = {
  INDIVIDUAL: 'INDIVIDUAL',
  B2B: 'B2B',
  COMMUNITY: 'COMMUNITY'
} as const;

export type UserRole = keyof typeof USER_ROLES;
export type CustomerType = keyof typeof CUSTOMER_TYPES;
