'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'SMS' | 'EMAIL' | 'WHATSAPP' | 'PUSH';
  subject?: string;
  message: string;
  variables: string[];
}

const templates: NotificationTemplate[] = [
  {
    id: 'order_confirmation',
    name: 'Order Confirmation',
    type: 'SMS',
    message: 'Hi {customerName}, your order {orderNumber} has been confirmed. Total: ₹{totalAmount}. Delivery scheduled for {deliveryDate}. Thank you!',
    variables: ['customerName', 'orderNumber', 'totalAmount', 'deliveryDate'],
  },
  {
    id: 'delivery_alert',
    name: 'Delivery Alert',
    type: 'SMS',
    message: 'Your order is out for delivery! Track your order with tracking number: {trackingNumber}',
    variables: ['trackingNumber'],
  },
  {
    id: 'low_stock',
    name: 'Low Stock Alert',
    type: 'EMAIL',
    subject: 'Low Stock Alert - {productName}',
    message: 'Low stock alert: {productName} is running low. Current stock: {quantity} units.',
    variables: ['productName', 'quantity'],
  },
];

function AddNotificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');

  const [formData, setFormData] = useState({
    type: 'SMS' as 'SMS' | 'EMAIL' | 'WHATSAPP' | 'PUSH',
    recipient: '',
    subject: '',
    message: '',
  });

  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setFormData({
          type: template.type,
          recipient: '',
          subject: template.subject || '',
          message: template.message,
        });
        
        // Initialize template variables
        const variables: Record<string, string> = {};
        template.variables.forEach(variable => {
          variables[variable] = '';
        });
        setTemplateVariables(variables);
      }
    }
  }, [templateId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVariableChange = (variable: string, value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const processMessage = (message: string, variables: Record<string, string>) => {
    let processedMessage = message;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      processedMessage = processedMessage.replace(regex, value || `{${key}}`);
    });
    return processedMessage;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Process the message with template variables
      const processedMessage = processMessage(formData.message, templateVariables);
      
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          message: processedMessage,
        }),
      });

      if (response.ok) {
        router.push('/admin/notifications');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create notification');
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      setError('Failed to create notification');
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === templateId);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {selectedTemplate ? `Using Template: ${selectedTemplate.name}` : 'Create New Notification'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Notification Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="PUSH">Push Notification</option>
              </select>
            </div>

            <div>
              <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
                Recipient *
              </label>
              <input
                type="text"
                id="recipient"
                name="recipient"
                value={formData.recipient}
                onChange={handleInputChange}
                required
                placeholder={formData.type === 'EMAIL' ? 'email@example.com' : '+1234567890'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.type === 'EMAIL' ? 'Enter email address' : 'Enter phone number'}
              </p>
            </div>
          </div>

          {formData.type === 'EMAIL' && (
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Email subject line"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required
              rows={6}
              placeholder="Enter your notification message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use variables like {'{customerName}'}, {'{orderNumber}'} etc. to personalize the message
            </p>
          </div>

          {/* Template Variables */}
          {selectedTemplate && selectedTemplate.variables.length > 0 && (
            <div className="border-t pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Template Variables</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTemplate.variables.map((variable) => (
                  <div key={variable}>
                    <label htmlFor={variable} className="block text-sm font-medium text-gray-700 mb-2">
                      {variable.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </label>
                    <input
                      type="text"
                      id={variable}
                      value={templateVariables[variable] || ''}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      placeholder={`Enter ${variable}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>
              
              {/* Preview */}
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Message Preview:</h5>
                <div className="bg-gray-50 p-3 rounded-md border">
                  <p className="text-sm text-gray-800">
                    {processMessage(formData.message, templateVariables)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push('/admin/notifications')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </form>
      </div>

      {/* Available Templates */}
      {!templateId && (
        <div className="mt-8 bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Available Templates</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="font-medium text-gray-900 mb-2">{template.name}</div>
                  <div className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {template.message.substring(0, 100)}...
                  </div>
                  <button
                    onClick={() => router.push(`/admin/notifications/add?template=${template.id}`)}
                    className="w-full px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AddNotification() {
  return (
    <AdminLayout title="Add Notification" subtitle="Send a new notification">
      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div></div>}>
        <AddNotificationForm />
      </Suspense>
    </AdminLayout>
  );
}
