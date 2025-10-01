'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  user: {
    firstName: string;
    lastName: string;
    role: string;
  };
  onLogout: () => void;
}

export default function AdminSidebar({ user, onLogout }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: '📊',
      active: pathname === '/admin/dashboard'
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: '👥',
      active: pathname.startsWith('/admin/users')
    },
    {
      name: 'Role Management',
      href: '/admin/roles',
      icon: '🔐',
      active: pathname.startsWith('/admin/roles')
    },
    {
      name: 'Customer Management',
      href: '/admin/customers',
      icon: '🛒',
      active: pathname.startsWith('/admin/customers')
    },
    // Back Office Management
    {
      name: 'Product Catalog',
      href: '/admin/products',
      icon: '🍞',
      active: pathname.startsWith('/admin/products')
    },
    {
      name: 'Inventory Control',
      href: '/admin/inventory',
      icon: '📋',
      active: pathname.startsWith('/admin/inventory')
    },
    {
      name: 'Warehouse Management',
      href: '/admin/warehouses',
      icon: '🏢',
      active: pathname.startsWith('/admin/warehouses')
    },
    {
      name: 'Purchase Management',
      href: '/admin/purchases',
      icon: '🛒',
      active: pathname.startsWith('/admin/purchases')
    },
    {
      name: 'Suppliers',
      href: '/admin/suppliers',
      icon: '🏭',
      active: pathname.startsWith('/admin/suppliers')
    },
    {
      name: 'Production Planning',
      href: '/admin/production',
      icon: '👨‍🍳',
      active: pathname.startsWith('/admin/production')
    },
    {
      name: 'Recipes',
      href: '/admin/recipes',
      icon: '📖',
      active: pathname.startsWith('/admin/recipes')
    },
    {
      name: 'Order Management',
      href: '/admin/orders',
      icon: '📦',
      active: pathname.startsWith('/admin/orders')
    },
    {
      name: 'Delivery Tracking',
      href: '/admin/deliveries',
      icon: '🚚',
      active: pathname.startsWith('/admin/deliveries')
    },
    {
      name: 'Notifications',
      href: '/admin/notifications',
      icon: '📢',
      active: pathname.startsWith('/admin/notifications')
    },
    {
      name: 'Reports & Analytics',
      href: '/admin/reports',
      icon: '📈',
      active: pathname.startsWith('/admin/reports')
    },
    {
      name: 'POS System',
      href: '/pos',
      icon: '🛒',
      active: pathname.startsWith('/pos')
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: '⚙️',
      active: pathname.startsWith('/admin/settings')
    }
  ];

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} min-h-screen flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-white">Bakery Admin</h1>
              <p className="text-sm text-gray-400">Management System</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <span className="text-lg">
              {isCollapsed ? '→' : '←'}
            </span>
          </button>
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {user.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  item.active
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.name}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        {!isCollapsed && (
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
          >
            <span className="text-lg">🚪</span>
            <span className="text-sm font-medium">Logout</span>
          </button>
        )}
        {isCollapsed && (
          <button
            onClick={onLogout}
            className="w-full p-2 text-gray-300 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
            title="Logout"
          >
            <span className="text-lg">🚪</span>
          </button>
        )}
      </div>
    </div>
  );
}
