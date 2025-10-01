'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

interface InventoryItem {
  id: string;
  productId: string;
  warehouseId?: string;
  quantity: number;
  reservedQty: number;
  location?: string;
  batchNumber?: string;
  expiryDate?: string;
  lastUpdated: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    minStockLevel: number;
  };
  warehouse?: {
    id: string;
    name: string;
  };
}

export default function AdjustStock({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [inventoryId, setInventoryId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    adjustmentType: 'add',
    quantity: '',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params;
      setInventoryId(resolvedParams.id);
      await fetchInventoryItem(resolvedParams.id);
    };
    fetchParams();
  }, [params]);

  const fetchInventoryItem = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/inventory/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInventoryItem(data.inventoryItem);
        setError(''); // Clear any previous errors
      } else {
        const errorData = await response.json();
        setError(`Failed to fetch inventory item: ${errorData.message || 'Item not found'}`);
      }
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      setError('An error occurred while fetching inventory item');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/inventory/${inventoryId}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
        }),
      });

      if (response.ok) {
        router.push('/admin/inventory');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to adjust stock');
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      setError('An error occurred while adjusting stock');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/inventory');
  };

  if (isLoadingData) {
    return (
      <AdminLayout 
        title="Adjust Stock" 
        subtitle="Adjust inventory quantities"
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!inventoryItem) {
    return (
      <AdminLayout 
        title="Adjust Stock" 
        subtitle="Adjust inventory quantities"
      >
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Inventory item not found</div>
          <div className="text-gray-400 text-sm mt-2">
            The inventory item you&apos;re looking for doesn&apos;t exist or has been removed.
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Adjust Stock" 
      subtitle="Adjust inventory quantities"
    >
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {/* Current Stock Information */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Current Stock Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Product</p>
                <p className="font-medium text-gray-900">{inventoryItem.product.name}</p>
                <p className="text-sm text-gray-500">SKU: {inventoryItem.product.sku}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Warehouse</p>
                <p className="font-medium text-gray-900">{inventoryItem.warehouse?.name || 'Main Warehouse'}</p>
                <p className="text-sm text-gray-500">Location: {inventoryItem.location || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Stock</p>
                <p className="font-medium text-gray-900">Total: {inventoryItem.quantity}</p>
                <p className="text-sm text-gray-500">Available: {inventoryItem.quantity - inventoryItem.reservedQty}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Adjustment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Adjustment Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="adjustmentType" className="block text-sm font-medium text-gray-700 mb-2">
                    Adjustment Type *
                  </label>
                  <select
                    id="adjustmentType"
                    name="adjustmentType"
                    value={formData.adjustmentType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="add">Add Stock</option>
                    <option value="remove">Remove Stock</option>
                    <option value="set">Set Stock Level</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter quantity"
                  />
                </div>

                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                    Reason *
                  </label>
                  <select
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select a reason</option>
                    <option value="received">Stock Received</option>
                    <option value="damaged">Damaged Goods</option>
                    <option value="expired">Expired Items</option>
                    <option value="theft">Theft/Loss</option>
                    <option value="return">Customer Return</option>
                    <option value="transfer">Transfer Out</option>
                    <option value="count_error">Count Error</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add any additional notes about this stock adjustment"
                />
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
                Adjust Stock
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
