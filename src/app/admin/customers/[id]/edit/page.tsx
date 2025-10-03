'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { CUSTOMER_TYPES, TAX_TYPES } from '@/lib/auth';

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  customerType: string;
  isActive: boolean;
  // Company Information
  companyName?: string;
  companyRegistration?: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyZipCode?: string;
  // Tax Information
  taxId?: string;
  taxType?: string;
  taxExempt?: boolean;
}

export default function EditCustomer({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    customerType: 'INDIVIDUAL',
    isActive: true,
    // Company Information
    companyName: '',
    companyRegistration: '',
    companyAddress: '',
    companyCity: '',
    companyState: '',
    companyZipCode: '',
    // Tax Information
    taxId: '',
    taxType: 'GST',
    taxExempt: false
  });

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params;
      setCustomerId(resolvedParams.id);
      await fetchCustomer(resolvedParams.id);
    };
    fetchParams();
  }, [params]);

  const fetchCustomer = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customers/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const customer = data.customer;
        setFormData({
          firstName: customer.firstName || '',
          lastName: customer.lastName || '',
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
          city: customer.city || '',
          state: customer.state || '',
          zipCode: customer.zipCode || '',
          customerType: customer.customerType || 'INDIVIDUAL',
          isActive: customer.isActive !== undefined ? customer.isActive : true,
          // Company Information
          companyName: customer.companyName || '',
          companyRegistration: customer.companyRegistration || '',
          companyAddress: customer.companyAddress || '',
          companyCity: customer.companyCity || '',
          companyState: customer.companyState || '',
          companyZipCode: customer.companyZipCode || '',
          // Tax Information
          taxId: customer.taxId || '',
          taxType: customer.taxType || 'GST',
          taxExempt: customer.taxExempt || false
        });
        setError(''); // Clear any previous errors
      } else {
        const errorData = await response.json();
        setError(`Failed to fetch customer: ${errorData.message || 'Customer not found'}`);
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      setError('An error occurred while fetching customer');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/admin/customers');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update customer');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      setError('An error occurred while updating customer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/customers');
  };

  if (isLoadingData) {
    return (
      <AdminLayout 
        title="Edit Customer" 
        subtitle="Update customer information"
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Edit Customer" 
      subtitle="Update customer information"
    >
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter first name"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter last name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label htmlFor="customerType" className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Type *
                  </label>
                  <select
                    id="customerType"
                    name="customerType"
                    value={formData.customerType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {Object.values(CUSTOMER_TYPES).map((type) => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter street address"
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Location Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter state"
                  />
                </div>

                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter zip code"
                  />
                </div>
              </div>
            </div>

            {/* Company Information - Show only for B2B and COMMUNITY customers */}
            {(formData.customerType === 'B2B' || formData.customerType === 'COMMUNITY') && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter company name"
                    />
                  </div>

                  <div>
                    <label htmlFor="companyRegistration" className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      id="companyRegistration"
                      name="companyRegistration"
                      value={formData.companyRegistration}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter registration number"
                    />
                  </div>

                  <div>
                    <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 mb-2">
                      Company Address
                    </label>
                    <input
                      type="text"
                      id="companyAddress"
                      name="companyAddress"
                      value={formData.companyAddress}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter company address"
                    />
                  </div>

                  <div>
                    <label htmlFor="companyCity" className="block text-sm font-medium text-gray-700 mb-2">
                      Company City
                    </label>
                    <input
                      type="text"
                      id="companyCity"
                      name="companyCity"
                      value={formData.companyCity}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter company city"
                    />
                  </div>

                  <div>
                    <label htmlFor="companyState" className="block text-sm font-medium text-gray-700 mb-2">
                      Company State
                    </label>
                    <input
                      type="text"
                      id="companyState"
                      name="companyState"
                      value={formData.companyState}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter company state"
                    />
                  </div>

                  <div>
                    <label htmlFor="companyZipCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Company Zip Code
                    </label>
                    <input
                      type="text"
                      id="companyZipCode"
                      name="companyZipCode"
                      value={formData.companyZipCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter company zip code"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tax Information - Show only for B2B and COMMUNITY customers */}
            {(formData.customerType === 'B2B' || formData.customerType === 'COMMUNITY') && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Tax Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-2">
                      Tax ID (GST/VAT Number)
                    </label>
                    <input
                      type="text"
                      id="taxId"
                      name="taxId"
                      value={formData.taxId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter tax ID"
                    />
                  </div>

                  <div>
                    <label htmlFor="taxType" className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Type
                    </label>
                    <select
                      id="taxType"
                      name="taxType"
                      value={formData.taxType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {Object.values(TAX_TYPES).map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="taxExempt"
                      name="taxExempt"
                      checked={formData.taxExempt}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="taxExempt" className="ml-2 block text-sm text-gray-900">
                      Tax Exempt
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Account Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Account Status</h3>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active Customer
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Update Customer
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
