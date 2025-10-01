'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

interface Production {
  id: string;
  batchNumber: string;
  recipeId: string;
  plannedQty: number;
  actualQty?: number;
  status: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  recipe: {
    id: string;
    name: string;
    description: string;
    servings: number;
  };
  items: {
    id: string;
    productId: string;
    plannedQty: number;
    actualQty?: number;
    product: {
      id: string;
      name: string;
      sku: string;
    };
  }[];
}

interface Recipe {
  id: string;
  name: string;
  description: string;
  servings: number;
  prepTime: number;
  cookTime: number;
}

interface ProductionItem {
  productId: string;
  plannedQty: number;
  actualQty?: number;
}

export default function EditProductionBatch({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [productionId, setProductionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [production, setProduction] = useState<Production | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [formData, setFormData] = useState({
    recipeId: '',
    plannedQty: 1,
    actualQty: 0,
    startDate: '',
    endDate: '',
    notes: '',
    status: 'PLANNED'
  });
  const [items, setItems] = useState<ProductionItem[]>([]);

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params;
      setProductionId(resolvedParams.id);
      await fetchProduction(resolvedParams.id);
    };
    fetchParams();
    fetchRecipes();
  }, [params]);

  const fetchProduction = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/productions/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProduction(data.production);
        setFormData({
          recipeId: data.production.recipeId || '',
          plannedQty: data.production.plannedQty || 1,
          actualQty: data.production.actualQty || 0,
          startDate: data.production.startDate ? new Date(data.production.startDate).toISOString().split('T')[0] : '',
          endDate: data.production.endDate ? new Date(data.production.endDate).toISOString().split('T')[0] : '',
          notes: data.production.notes || '',
          status: data.production.status || 'PLANNED'
        });
        setItems(data.production.items || []);
        setError(''); // Clear any previous errors
      } else {
        const errorData = await response.json();
        setError(`Failed to fetch production: ${errorData.message || 'Production not found'}`);
      }
    } catch (error) {
      console.error('Error fetching production:', error);
      setError('An error occurred while fetching production');
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchRecipes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/recipes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes || []);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // If recipe is selected, load recipe items
    if (name === 'recipeId') {
      const recipe = recipes.find(r => r.id === value);
      setSelectedRecipe(recipe || null);
    }
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const addItem = () => {
    setItems(prev => [...prev, { productId: '', plannedQty: 1, actualQty: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/productions/${productionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          items: items.filter(item => item.productId && item.plannedQty > 0)
        }),
      });

      if (response.ok) {
        router.push('/admin/production');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update production batch');
      }
    } catch (error) {
      console.error('Error updating production batch:', error);
      setError('An error occurred while updating production batch');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/production');
  };

  if (isLoadingData) {
    return (
      <AdminLayout 
        title="Edit Production Batch" 
        subtitle="Update production batch information"
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!production) {
    return (
      <AdminLayout 
        title="Edit Production Batch" 
        subtitle="Update production batch information"
      >
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Production batch not found</div>
          <div className="text-gray-400 text-sm mt-2">
            The production batch you&apos;re looking for doesn&apos;t exist or has been removed.
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Edit Production Batch" 
      subtitle={`Update production batch ${production.batchNumber}`}
    >
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    id="batchNumber"
                    value={production.batchNumber}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label htmlFor="recipeId" className="block text-sm font-medium text-gray-700 mb-2">
                    Recipe *
                  </label>
                  <select
                    id="recipeId"
                    name="recipeId"
                    value={formData.recipeId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select a recipe</option>
                    {recipes.map(recipe => (
                      <option key={recipe.id} value={recipe.id}>
                        {recipe.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="PLANNED">Planned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="plannedQty" className="block text-sm font-medium text-gray-700 mb-2">
                    Planned Quantity *
                  </label>
                  <input
                    type="number"
                    id="plannedQty"
                    name="plannedQty"
                    value={formData.plannedQty}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter planned quantity"
                  />
                </div>

                <div>
                  <label htmlFor="actualQty" className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Quantity
                  </label>
                  <input
                    type="number"
                    id="actualQty"
                    name="actualQty"
                    value={formData.actualQty}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter actual quantity"
                  />
                </div>

                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
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
                  placeholder="Additional notes or instructions..."
                />
              </div>
            </div>

            {/* Recipe Information */}
            {selectedRecipe && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Recipe Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Recipe Name</label>
                      <p className="text-sm text-gray-900">{selectedRecipe.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Servings</label>
                      <p className="text-sm text-gray-900">{selectedRecipe.servings}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Prep Time</label>
                      <p className="text-sm text-gray-900">{selectedRecipe.prepTime} minutes</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="text-sm text-gray-900">{selectedRecipe.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Production Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Production Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  Add Item
                </button>
              </div>
              
              {items.map((item, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select a product</option>
                        {/* This would be populated from products API */}
                        <option value="product1">Product 1</option>
                        <option value="product2">Product 2</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Planned Quantity</label>
                      <input
                        type="number"
                        value={item.plannedQty}
                        onChange={(e) => handleItemChange(index, 'plannedQty', Number(e.target.value))}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Actual Quantity</label>
                      <input
                        type="number"
                        value={item.actualQty || 0}
                        onChange={(e) => handleItemChange(index, 'actualQty', Number(e.target.value))}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="w-full bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
                Update Production Batch
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
