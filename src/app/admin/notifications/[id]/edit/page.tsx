'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

interface Notification {
  id: string;
  type: string;
  recipient: string;
  subject?: string;
  message: string;
  status: string;
  sentAt?: string;
  createdAt: string;
}

export default function EditNotification({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState({
    type: 'SMS' as 'SMS' | 'EMAIL' | 'WHATSAPP' | 'PUSH',
    recipient: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotification();
  }, []);

  const fetchNotification = async () => {
    try {
      const { id } = await params;
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotification(data.notification);
        setFormData({
          type: data.notification.type,
          recipient: data.notification.recipient,
          subject: data.notification.subject || '',
          message: data.notification.message,
        });
      } else {
        setError('Failed to fetch notification');
      }
    } catch (error) {
      console.error('Error fetching notification:', error);
      setError('Failed to fetch notification');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const { id } = await params;
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/admin/notifications');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update notification');
      }
    } catch (error) {
      console.error('Error updating notification:', error);
      setError('Failed to update notification');
    } finally {
      setSaving(false);
    }
  };

  const handleSendNow = async () => {
    if (!notification) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${notification.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'send' }),
      });

      if (response.ok) {
        router.push('/admin/notifications');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setError('Failed to send notification');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'SENT': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  if (loading) {
    return (
      <AdminLayout title="Edit Notification" subtitle="Edit notification details">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!notification) {
    return (
      <AdminLayout title="Edit Notification" subtitle="Edit notification details">
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Notification not found</div>
          <button
            onClick={() => router.push('/admin/notifications')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Back to Notifications
          </button>
        </div>
      </AdminLayout>
    );
  }

  const createdDate = formatDate(notification.createdAt);
  const sentDate = notification.sentAt ? formatDate(notification.sentAt) : null;

  return (
    <AdminLayout title="Edit Notification" subtitle="Edit notification details">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Notification Details</h3>
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(notification.status)}`}>
                  {notification.status}
                </span>
                {notification.status === 'PENDING' && (
                  <button
                    onClick={handleSendNow}
                    disabled={saving}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                  >
                    Send Now
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Notification Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <div className="text-sm text-gray-900">{createdDate.date}</div>
                <div className="text-xs text-gray-500">{createdDate.time}</div>
              </div>
              {sentDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sent</label>
                  <div className="text-sm text-gray-900">{sentDate.date}</div>
                  <div className="text-xs text-gray-500">{sentDate.time}</div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    disabled={notification.status === 'SENT'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    disabled={notification.status === 'SENT'}
                    placeholder={formData.type === 'EMAIL' ? 'email@example.com' : '+1234567890'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
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
                    disabled={notification.status === 'SENT'}
                    placeholder="Email subject line"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  disabled={notification.status === 'SENT'}
                  rows={6}
                  placeholder="Enter your notification message..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => router.push('/admin/notifications')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                {notification.status !== 'SENT' && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Update Notification'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
