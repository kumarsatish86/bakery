import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { CustomerType } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerType,
      name,
      email,
      phone,
      address,
      city,
      pincode,
      sameAsShipping,
      billingAddress,
      billingCity,
      billingPincode,
    } = body;

    // Validate required fields
    if (!customerType || !name || !email || !phone || !address || !city || !pincode) {
      return NextResponse.json(
        { message: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Split name into firstName and lastName
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      return NextResponse.json(
        { message: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Check if customer already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { phone: phone }
        ]
      }
    });

    if (existingCustomer) {
      return NextResponse.json(
        { message: 'Customer with this email or phone number already exists' },
        { status: 409 }
      );
    }

    // Prepare customer data
    const customerData = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      customerType: customerType === 'B2C' ? 'INDIVIDUAL' : customerType as CustomerType,
      address,
      city,
      zipCode: pincode,
      isActive: true,
    };

    // Create customer
    const customer = await prisma.customer.create({
      data: customerData,
    });

    // Create default customer location for delivery
    await prisma.customerLocation.create({
      data: {
        customerId: customer.id,
        address: address,
        city: city,
        state: '', // You might want to add state field to the form
        zipCode: pincode,
        isDefault: true,
      },
    });

    // If billing address is different, create another location
    if (!sameAsShipping && billingAddress && billingCity && billingPincode) {
      await prisma.customerLocation.create({
        data: {
          customerId: customer.id,
          address: billingAddress,
          city: billingCity,
          state: '', // You might want to add state field to the form
          zipCode: billingPincode,
          isDefault: false,
        },
      });
    }

    // Return success response (without sensitive data)
    return NextResponse.json({
      message: 'Registration successful',
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        customerType: customer.customerType,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
