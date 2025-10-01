import { Customer } from './auth';
import { prisma } from './database';

export async function createCustomer(customerData: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  customerType?: 'INDIVIDUAL' | 'B2B' | 'COMMUNITY';
}) {
  return prisma.customer.create({
    data: {
      email: customerData.email,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      phone: customerData.phone || null,
      address: customerData.address || null,
      city: customerData.city || null,
      state: customerData.state || null,
      zipCode: customerData.zipCode || null,
      customerType: customerData.customerType || 'INDIVIDUAL',
    },
  });
}

export async function getAllCustomers() {
  return prisma.customer.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  return customer;
}

export async function updateCustomerType(id: string, customerType: string) {
  return prisma.customer.update({
    where: { id },
    data: { customerType: customerType as 'INDIVIDUAL' | 'B2B' | 'COMMUNITY' },
  });
}

export async function toggleCustomerStatus(id: string) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) return null;

  return prisma.customer.update({
    where: { id },
    data: { isActive: !customer.isActive },
  });
}

export async function updateCustomer(id: string, data: Partial<Customer>) {
  return prisma.customer.update({
    where: { id },
    data,
  });
}

export async function deleteCustomer(id: string) {
  return prisma.customer.delete({
    where: { id },
  });
}
