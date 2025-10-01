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

interface Warehouse {
  id: string;
  name: string;
}

export default function TransferStock({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [inventoryId, setInventoryId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [formData, setFormData] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    quantity: '',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params;
      setInventoryId(resolvedParams.id);
      await fetchInventoryItem(resolvedParams.id);
      await fetchWarehouses();
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
        setFormData(prev => ({
          ...prev,
          fromWarehouseId: data.inventoryItem.warehouseId || ''
        }));
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

  const fetchWarehouses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/warehouses', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWarehouses(data.warehouses || []);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
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
      const response = await fetch(`/api/inventory/${inventoryId}/transfer`, {
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
        setError(errorData.message || 'Failed to transfer stock');
      }
    } catch (error) {
      console.error('Error transferring stock:', error);
      setError('An error occurred while transferring stock');
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
        title="Transfer Stock" 
        subtitle="Transfer inventory between warehouses"
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
        title="Transfer Stock" 
        subtitle="Transfer inventory between warehouses"
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
      title="Transfer Stock" 
      subtitle="Transfer inventory between warehouses"
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
                <p className="text-sm text-gray-600">Current Warehouse</p>
                <p className="font-medium text-gray-900">{inventoryItem.warehouse?.name || 'Main Warehouse'}</p>
                <p className="text-sm text-gray-500">Location: {inventoryItem.location || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Available Stock</p>
                <p className="font-medium text-gray-900">{inventoryItem.quantity - inventoryItem.reservedQty}</p>
                <p className="text-sm text-gray-500">Total: {inventoryItem.quantity}</p>
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

            {/* Transfer Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Transfer Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="fromWarehouseId" className="block text-sm font-medium text-gray-700 mb-2">
                    From Warehouse *
                  </label>
                  <select
                    id="fromWarehouseId"
                    name="fromWarehouseId"
                    value={formData.fromWarehouseId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select source warehouse</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="toWarehouseId" className="block text-sm font-medium text-gray-700 mb-2">
                    To Warehouse *
                  </label>
                  <select
                    id="toWarehouseId"
                    name="toWarehouseId"
                    value={formData.toWarehouseId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select destination warehouse</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
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
                    max={inventoryItem.quantity - inventoryItem.reservedQty}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter quantity to transfer"
                  />
                </div>
              </div>
            </div>

            {/* Transfer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Transfer Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <option value="restock">Restock</option>
                    <option value="rebalance">Rebalance Inventory</option>
                    <option value="demand">High Demand</option>
                    <option value="storage">Storage Optimization</option>
                    <option value="maintenance">Warehouse Maintenance</option>
                    <option value="other">Other</option>
                  </select>
                </div>

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
                    placeholder="Add any additional notes about this transfer"
                  />
                </div>
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
                Transfer Stock
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
