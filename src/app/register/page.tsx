'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RegistrationData {
  customerType: 'B2C' | 'B2B' | 'COMMUNITY' | '';
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  sameAsShipping: boolean;
  billingAddress?: string;
  billingCity?: string;
  billingPincode?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RegistrationData>({
    customerType: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    sameAsShipping: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const customerTypes = [
    {
      value: 'B2C',
      label: 'Individual Customer (B2C)',
      description: 'Personal orders for home delivery',
      icon: '👤'
    },
    {
      value: 'B2B',
      label: 'Business Customer (B2B)',
      description: 'Bulk orders for restaurants, cafes, or businesses',
      icon: '🏢'
    },
    {
      value: 'COMMUNITY',
      label: 'Community/Society',
      description: 'Orders for housing societies, events, or communities',
      icon: '🏘️'
    }
  ];

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        // Redirect to login page with success message
        router.push('/login?registered=true');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof RegistrationData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.customerType !== '';
      case 2:
        return formData.name && formData.email && formData.phone;
      case 3:
        return formData.address && formData.city && formData.pincode;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join our bakery community in just 3 simple steps
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    step <= currentStep 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-1 mx-2 ${
                      step < currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Customer Type</span>
              <span>Personal Info</span>
              <span>Address</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}

          {/* Step 1: Customer Type Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                What type of customer are you?
              </h3>
              <div className="space-y-3">
                {customerTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`relative flex cursor-pointer rounded-lg p-4 focus:outline-none border-2 ${
                      formData.customerType === type.value
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="customerType"
                      value={type.value}
                      checked={formData.customerType === type.value}
                      onChange={(e) => updateFormData('customerType', e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">{type.icon}</div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {type.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {type.description}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Tell us about yourself
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your email address"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Address Information */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Where should we deliver?
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    required
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your complete address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City *
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => updateFormData('city', e.target.value)}
                      className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                      Pincode *
                    </label>
                    <input
                      id="pincode"
                      name="pincode"
                      type="text"
                      required
                      value={formData.pincode}
                      onChange={(e) => updateFormData('pincode', e.target.value)}
                      className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter pincode"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center">
                    <input
                      id="sameAsShipping"
                      name="sameAsShipping"
                      type="checkbox"
                      checked={formData.sameAsShipping}
                      onChange={(e) => updateFormData('sameAsShipping', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="sameAsShipping" className="ml-2 block text-sm text-gray-900">
                      Billing address is the same as shipping address
                    </label>
                  </div>
                </div>

                {!formData.sameAsShipping && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-md font-medium text-gray-900">Billing Address</h4>
                    <div>
                      <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700">
                        Billing Address *
                      </label>
                      <textarea
                        id="billingAddress"
                        name="billingAddress"
                        rows={3}
                        required
                        value={formData.billingAddress || ''}
                        onChange={(e) => updateFormData('billingAddress', e.target.value)}
                        className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter billing address"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="billingCity" className="block text-sm font-medium text-gray-700">
                          City *
                        </label>
                        <input
                          id="billingCity"
                          name="billingCity"
                          type="text"
                          required
                          value={formData.billingCity || ''}
                          onChange={(e) => updateFormData('billingCity', e.target.value)}
                          className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Enter city"
                        />
                      </div>

                      <div>
                        <label htmlFor="billingPincode" className="block text-sm font-medium text-gray-700">
                          Pincode *
                        </label>
                        <input
                          id="billingPincode"
                          name="billingPincode"
                          type="text"
                          required
                          value={formData.billingPincode || ''}
                          onChange={(e) => updateFormData('billingPincode', e.target.value)}
                          className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Enter pincode"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid()}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  isStepValid()
                    ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                    : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isStepValid() || loading}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  isStepValid() && !loading
                    ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                    : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                }`}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
