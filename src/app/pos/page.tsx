'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/auth';

interface Product {
  id: string;
  sku: string;
  name: string;
  sellingPrice: number;
  barcode?: string;
  category: string;
  inventory: Array<{ quantity: number }>;
}

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount: number;
}

interface Payment {
  method: string;
  amount: number;
  reference?: string;
}

export default function POSDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customer, setCustomer] = useState<{id: string; firstName: string; lastName: string; email: string; customerType: string} | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);

  const categories = [
    'BREAD', 'PASTRY', 'CAKE', 'COOKIE', 'BEVERAGE', 'SANDWICH', 'SALAD', 'OTHER'
  ];

  const paymentMethods = [
    { value: 'CASH', label: 'Cash', icon: '💵' },
    { value: 'CARD', label: 'Card', icon: '💳' },
    { value: 'UPI', label: 'UPI', icon: '📱' },
    { value: 'ONLINE', label: 'Online', icon: '🌐' },
  ];

  useEffect(() => {
    fetchUser();
    fetchProducts();
    checkSessionStatus();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  };

  const checkSessionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/pos/session/active', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSessionActive(!!data.session);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  const startSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/pos/session/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startingCash: 0,
          notes: 'POS Session Started',
        }),
      });
      if (response.ok) {
        setSessionActive(true);
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              totalPrice: Number((item.quantity + 1) * Number(item.unitPrice)),
            }
          : item
      ));
    } else {
      setCart([...cart, {
        product,
        quantity: 1,
        unitPrice: Number(product.sellingPrice),
        totalPrice: Number(product.sellingPrice),
        discount: 0,
      }]);
    }
  };

  const updateCartItem = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.product.id !== productId));
    } else {
      setCart(cart.map(item =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              totalPrice: Number(quantity * Number(item.unitPrice)),
            }
          : item
      ));
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const searchCustomer = async () => {
    if (!customerPhone) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customers/search?phone=${customerPhone}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCustomer(data.customer);
      }
    } catch (error) {
      console.error('Error searching customer:', error);
    }
  };

  const addPayment = (method: string, amount: number, reference?: string) => {
    setPayments([...payments, { method, amount, reference }]);
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
    const taxAmount = subtotal * 0.08; // 8% tax
    const totalAmount = subtotal + taxAmount;
    const paidAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const changeAmount = paidAmount - totalAmount;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      taxAmount: Number(taxAmount.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      paidAmount: Number(paidAmount.toFixed(2)),
      changeAmount: Number(changeAmount.toFixed(2)),
    };
  };

  const processOrder = async () => {
    if (cart.length === 0) return;
    
    const totals = calculateTotals();
    if (totals.paidAmount < totals.totalAmount) {
      alert('Payment amount is less than total amount');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customer?.id,
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
          })),
          payments: payments.map(payment => ({
            method: payment.method,
            amount: payment.amount,
            reference: payment.reference,
          })),
          notes: customer ? `Customer: ${customer.firstName} ${customer.lastName}` : undefined,
          isOffline,
        }),
      });

      if (response.ok) {
        const order = await response.json();
        
        // Clear cart and payments
        setCart([]);
        setPayments([]);
        setCustomer(null);
        setCustomerPhone('');
        
        // Generate receipt
        await generateReceipt(order.order.id);
        
        alert(`Order ${order.order.orderNumber} completed successfully!`);
      }
    } catch (error) {
      console.error('Error processing order:', error);
      alert('Error processing order. Please try again.');
    }
  };

  const generateReceipt = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/pos/receipts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          type: 'RECEIPT',
        }),
      });
    } catch (error) {
      console.error('Error generating receipt:', error);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">POS System</h1>
              <p className="text-sm text-gray-500">
                {user ? `Welcome, ${user.firstName} ${user.lastName}` : 'Loading...'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {isOffline && (
                <div className="flex items-center text-orange-600">
                  <span className="text-sm font-medium">Offline Mode</span>
                </div>
              )}
              {!sessionActive && (
                <button
                  onClick={startSession}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Start Session
                </button>
              )}
              <button
                onClick={() => window.location.href = '/login'}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Products */}
        <div className="w-2/3 bg-white border-r border-gray-200 flex flex-col">
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const totalStock = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
                const isLowStock = totalStock <= 5;
                
                return (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isLowStock 
                        ? 'border-red-200 bg-red-50 hover:bg-red-100' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      SKU: {product.sku}
                    </div>
                    <div className="text-lg font-bold text-indigo-600 mt-2">
                      ₹{product.sellingPrice}
                    </div>
                    <div className={`text-xs mt-1 ${
                      isLowStock ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      Stock: {totalStock}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel - Cart and Checkout */}
        <div className="w-1/3 bg-white flex flex-col">
          {/* Customer Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Customer phone..."
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={searchCustomer}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
              >
                Search
              </button>
            </div>
            {customer && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm font-medium text-green-800">
                  {customer.firstName} {customer.lastName}
                </div>
                <div className="text-xs text-green-600">
                  {customer.email} • {customer.customerType}
                </div>
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cart ({cart.length})</h3>
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No items in cart
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {item.product.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        ₹{item.unitPrice} each
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateCartItem(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="text-sm font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartItem(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm hover:bg-gray-300"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center text-sm hover:bg-red-300 text-red-600"
                      >
                        ×
                      </button>
                    </div>
                    <div className="text-sm font-medium text-gray-900 ml-4">
                      ₹{item.totalPrice}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{totals.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (8%):</span>
                <span>₹{totals.taxAmount}</span>
              </div>
              <div className="flex justify-between font-medium text-lg">
                <span>Total:</span>
                <span>₹{totals.totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Payments */}
          <div className="p-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Payments</h4>
            <div className="space-y-2 mb-3">
              {payments.map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">
                    {paymentMethods.find(pm => pm.value === payment.method)?.icon} {payment.method}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">₹{payment.amount}</span>
                    <button
                      onClick={() => removePayment(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  onClick={() => {
                    const amountStr = prompt(`Enter ${method.label} amount:`);
                    if (amountStr) {
                      const amount = parseFloat(amountStr);
                      if (amount > 0) {
                        addPayment(method.value, amount);
                      }
                    }
                  }}
                  className="p-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                  {method.icon} {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Checkout */}
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span>Paid:</span>
                <span>₹{totals.paidAmount}</span>
              </div>
              {totals.changeAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Change:</span>
                  <span>₹{totals.changeAmount}</span>
                </div>
              )}
            </div>
            
            <button
              onClick={processOrder}
              disabled={cart.length === 0 || totals.paidAmount < totals.totalAmount}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Process Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
