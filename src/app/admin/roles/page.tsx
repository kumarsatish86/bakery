'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { USER_ROLES } from '@/lib/auth';

interface RolePermission {
  role: string;
  permissions: {
    userManagement: boolean;
    customerManagement: boolean;
    productManagement: boolean;
    orderManagement: boolean;
    inventoryManagement: boolean;
    reportAccess: boolean;
    systemSettings: boolean;
  };
}

export default function RoleManagement() {
  const [roles, setRoles] = useState<RolePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize default role permissions
    const defaultRoles: RolePermission[] = [
      {
        role: 'ADMIN',
        permissions: {
          userManagement: true,
          customerManagement: true,
          productManagement: true,
          orderManagement: true,
          inventoryManagement: true,
          reportAccess: true,
          systemSettings: true,
        }
      },
      {
        role: 'STORE_MANAGER',
        permissions: {
          userManagement: false,
          customerManagement: true,
          productManagement: true,
          orderManagement: true,
          inventoryManagement: true,
          reportAccess: true,
          systemSettings: false,
        }
      },
      {
        role: 'PRODUCTION_TEAM',
        permissions: {
          userManagement: false,
          customerManagement: false,
          productManagement: true,
          orderManagement: false,
          inventoryManagement: true,
          reportAccess: false,
          systemSettings: false,
        }
      },
      {
        role: 'DELIVERY_TEAM',
        permissions: {
          userManagement: false,
          customerManagement: false,
          productManagement: false,
          orderManagement: true,
          inventoryManagement: false,
          reportAccess: false,
          systemSettings: false,
        }
      }
    ];
    
    setRoles(defaultRoles);
    setIsLoading(false);
  }, []);

  const updatePermission = (role: string, permission: string, value: boolean) => {
    setRoles(roles.map(r => 
      r.role === role 
        ? { ...r, permissions: { ...r.permissions, [permission]: value } }
        : r
    ));
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Full system access and control';
      case 'STORE_MANAGER':
        return 'Store operations and management';
      case 'PRODUCTION_TEAM':
        return 'Production and inventory management';
      case 'DELIVERY_TEAM':
        return 'Order delivery and logistics';
      default:
        return '';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '👑';
      case 'STORE_MANAGER':
        return '🏪';
      case 'PRODUCTION_TEAM':
        return '🏭';
      case 'DELIVERY_TEAM':
        return '🚚';
      default:
        return '👤';
    }
  };

  return (
    <AdminLayout 
      title="Role Management" 
      subtitle="Configure user roles and permissions"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Role Permissions</h2>
            <p className="text-sm text-gray-600">Manage what each role can access and modify</p>
          </div>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            Save Changes
          </button>
        </div>

        {/* Roles Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {roles.map((roleData) => (
              <div key={roleData.role} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-2xl">{getRoleIcon(roleData.role)}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {roleData.role.replace('_', ' ')}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {getRoleDescription(roleData.role)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(roleData.permissions).map(([permission, value]) => (
                    <div key={permission} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {permission.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updatePermission(roleData.role, permission, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Role Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((roleData) => {
              const enabledPermissions = Object.values(roleData.permissions).filter(Boolean).length;
              const totalPermissions = Object.keys(roleData.permissions).length;
              
              return (
                <div key={roleData.role} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">{getRoleIcon(roleData.role)}</div>
                  <h4 className="font-medium text-gray-900 text-sm">
                    {roleData.role.replace('_', ' ')}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {enabledPermissions}/{totalPermissions} permissions
                  </p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(enabledPermissions / totalPermissions) * 100}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
