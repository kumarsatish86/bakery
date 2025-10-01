import { hashPassword, verifyPassword, User } from './auth';
import { prisma } from './database';

export async function createUser(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'ADMIN' | 'STORE_MANAGER' | 'PRODUCTION_TEAM' | 'DELIVERY_TEAM' | 'CASHIER' | 'MANAGER';
}) {
  const hashedPassword = await hashPassword(userData.password);
  
  return prisma.user.create({
    data: {
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || 'STORE_MANAGER',
    },
  });
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  });

  return user;
}

export async function getAllUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function updateUserRole(id: string, role: string) {
  return prisma.user.update({
    where: { id },
    data: { role: role as 'ADMIN' | 'STORE_MANAGER' | 'PRODUCTION_TEAM' | 'DELIVERY_TEAM' },
  });
}

export async function updateUser(id: string, userData: {
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  isActive?: boolean;
}) {
  return prisma.user.update({
    where: { id },
    data: {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      role: userData.role as 'ADMIN' | 'STORE_MANAGER' | 'PRODUCTION_TEAM' | 'DELIVERY_TEAM' | 'CASHIER' | 'MANAGER',
      isActive: userData.isActive !== undefined ? userData.isActive : true,
    },
  });
}

export async function toggleUserStatus(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;

  return prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  });
}
