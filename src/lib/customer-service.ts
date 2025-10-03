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
  // Company Information
  companyName?: string | null;
  companyRegistration?: string | null;
  companyAddress?: string | null;
  companyCity?: string | null;
  companyState?: string | null;
  companyZipCode?: string | null;
  // Tax Information
  taxId?: string | null;
  taxType?: 'GST' | 'VAT' | 'NONE';
  taxExempt?: boolean;
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
      // Company Information
      companyName: customerData.companyName || null,
      companyRegistration: customerData.companyRegistration || null,
      companyAddress: customerData.companyAddress || null,
      companyCity: customerData.companyCity || null,
      companyState: customerData.companyState || null,
      companyZipCode: customerData.companyZipCode || null,
      // Tax Information
      taxId: customerData.taxId || null,
      taxType: customerData.taxType || 'GST',
      taxExempt: customerData.taxExempt || false,
    },
  });
}

export async function getAllCustomers() {
  return prisma.customer.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      addresses: true,
    },
  });
}

export async function getCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      addresses: true,
    },
  });
}

export async function updateCustomer(id: string, customerData: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  customerType?: 'INDIVIDUAL' | 'B2B' | 'COMMUNITY';
  isActive?: boolean;
  // Company Information
  companyName?: string | null;
  companyRegistration?: string | null;
  companyAddress?: string | null;
  companyCity?: string | null;
  companyState?: string | null;
  companyZipCode?: string | null;
  // Tax Information
  taxId?: string | null;
  taxType?: 'GST' | 'VAT' | 'NONE';
  taxExempt?: boolean;
}) {
  return prisma.customer.update({
    where: { id },
    data: customerData,
    include: {
      addresses: true,
    },
  });
}

// Address Management Functions
export async function createCustomerAddress(customerId: string, addressData: {
  addressType: 'SHIPPING' | 'BILLING';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  coordinates?: string | null;
  isDefault?: boolean;
  deliveryInstructions?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
}) {
  return prisma.customerAddress.create({
    data: {
      customerId,
      addressType: addressData.addressType,
      address: addressData.address,
      city: addressData.city,
      state: addressData.state,
      zipCode: addressData.zipCode,
      country: addressData.country || 'India',
      coordinates: addressData.coordinates || null,
      isDefault: addressData.isDefault || false,
      deliveryInstructions: addressData.deliveryInstructions || null,
      contactName: addressData.contactName || null,
      contactPhone: addressData.contactPhone || null,
    },
  });
}

export async function getCustomerAddresses(customerId: string) {
  return prisma.customerAddress.findMany({
    where: { customerId },
    orderBy: [
      { isDefault: 'desc' },
      { addressType: 'asc' },
      { createdAt: 'desc' },
    ],
  });
}

export async function updateCustomerAddress(addressId: string, addressData: {
  addressType?: 'SHIPPING' | 'BILLING';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  coordinates?: string | null;
  isDefault?: boolean;
  deliveryInstructions?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
}) {
  return prisma.customerAddress.update({
    where: { id: addressId },
    data: addressData,
  });
}

export async function deleteCustomerAddress(addressId: string) {
  return prisma.customerAddress.delete({
    where: { id: addressId },
  });
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

export async function deleteCustomer(id: string) {
  return prisma.customer.delete({
    where: { id },
  });
}
