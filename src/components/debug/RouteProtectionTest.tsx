// src/components/debug/RouteProtectionTest.tsx
// Testing component for route protection implementation

import { CheckCircle, Shield, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import { getAccessibleRoutes, hasRouteAccess, ROUTE_CONFIG } from '../../config/routes';
import type { ProductName } from '../../types/products';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

type UserRole = 'user' | 'manager' | 'admin';

interface TestUser {
  role: UserRole;
  products: ProductName[];
  organizationId: string;
}

const TEST_SCENARIOS: Array<{
  name: string;
  user: TestUser;
  description: string;
}> = [
  {
    name: 'Basic User',
    user: {
      role: 'user',
      products: ['gbp_management'],
      organizationId: 'test-org-basic'
    },
    description: 'User with only GBP Management access'
  },
  {
    name: 'Manager User', 
    user: {
      role: 'manager',
      products: ['gbp_management', 'ai_visibility'],
      organizationId: 'test-org-manager'
    },
    description: 'Manager with GBP and AI Visibility access'
  },
  {
    name: 'Admin User',
    user: {
      role: 'admin', 
      products: ['gbp_management', 'ai_visibility', 'voice_search', 'premium_listings'],
      organizationId: 'test-org-admin'
    },
    description: 'Admin with full product access'
  },
  {
    name: 'Limited User',
    user: {
      role: 'user',
      products: [],
      organizationId: 'test-org-limited'
    },
    description: 'User with no product access'
  }
];

export const RouteProtectionTest: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [testingRoute, setTestingRoute] = useState<string | null>(null);
  
  const currentUser = TEST_SCENARIOS[selectedScenario].user;
  
  const testRouteAccess = (section: string) => {
    return hasRouteAccess(section, currentUser.role, currentUser.products);
  };

  const getAccessIcon = (hasAccess: boolean) => {
    return hasAccess ? (
      <CheckCircle size={16} className="text-green-500" />
    ) : (
      <XCircle size={16} className="text-red-500" />
    );
  };

  const getAccessBadge = (hasAccess: boolean) => {
    return hasAccess ? (
      <Badge variant="success" size="sm">Allowed</Badge>
    ) : (
      <Badge variant="error" size="sm">Denied</Badge>
    );
  };

  const TestRouteComponent = ({ section }: { section: string }) => {
    const config = ROUTE_CONFIG[section];
    if (!config) return <div>Route not found</div>;

    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          Testing: {config.label}
        </h4>
        <ProtectedRoute
          requiredProduct={config.requiredProduct}
          requiredRole={config.requiredRole}
          allowedRoles={config.allowedRoles}
          user={{
            id: 'test-user',
            name: 'Test User',
            email: 'test@example.com',
            role: currentUser.role,
            organizationId: currentUser.organizationId
          }}
          showLoading={false}
          fallback={
            <div className="text-red-600 dark:text-red-400">
              Access Denied - Custom Fallback
            </div>
          }
        >
          <div className="text-green-600 dark:text-green-400 font-medium">
            ✅ Access Granted - Content Loaded Successfully
          </div>
        </ProtectedRoute>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Shield size={24} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Route Protection Testing
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Test route access control with different user scenarios
          </p>
        </div>
      </div>

      {/* Scenario Selection */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Test Scenario
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {TEST_SCENARIOS.map((scenario, index) => (
              <Button
                key={index}
                variant={selectedScenario === index ? 'primary' : 'secondary'}
                onClick={() => setSelectedScenario(index)}
                className="justify-start h-auto p-3"
              >
                <div className="text-left">
                  <div className="font-medium">{scenario.name}</div>
                  <div className="text-xs opacity-75">
                    {scenario.user.role} • {scenario.user.products.length} products
                  </div>
                </div>
              </Button>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm">
              <div className="font-medium text-gray-900 dark:text-white mb-2">
                Current Test User:
              </div>
              <div className="space-y-1 text-gray-600 dark:text-gray-400">
                <div>Role: <Badge variant="info" size="sm">{currentUser.role}</Badge></div>
                <div>Products: {currentUser.products.length > 0 ? (
                  <span className="inline-flex gap-1 flex-wrap">
                    {currentUser.products.map(product => (
                      <Badge key={product} variant="success" size="sm">{product}</Badge>
                    ))}
                  </span>
                ) : (
                  <Badge variant="error" size="sm">None</Badge>
                )}</div>
                <div>Organization: {currentUser.organizationId}</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Route Access Results */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Route Access Results
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {getAccessibleRoutes(currentUser.role, currentUser.products).length} accessible routes
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">
                    Route
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">
                    Requirements
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">
                    Access
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">
                    Test
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {Object.values(ROUTE_CONFIG).map((config) => {
                  const hasAccess = testRouteAccess(config.section);
                  return (
                    <tr key={config.section}>
                      <td className="py-3 px-2">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {config.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            /{config.section}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm">
                        <div className="space-y-1">
                          {config.isPublic && (
                            <Badge variant="info" size="sm">Public</Badge>
                          )}
                          {config.requiredProduct && (
                            <Badge variant="warning" size="sm">{config.requiredProduct}</Badge>
                          )}
                          {config.requiredRole && (
                            <Badge variant="error" size="sm">{config.requiredRole}+</Badge>
                          )}
                          {config.allowedRoles && (
                            <Badge variant="gradient" size="sm">
                              {config.allowedRoles.join(', ')}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          {getAccessIcon(hasAccess)}
                          {getAccessBadge(hasAccess)}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTestingRoute(
                            testingRoute === config.section ? null : config.section
                          )}
                        >
                          {testingRoute === config.section ? 'Hide' : 'Test'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Live Route Testing */}
      {testingRoute && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Live Route Protection Test
            </h3>
            <TestRouteComponent section={testingRoute} />
          </div>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Test Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <CheckCircle size={32} className="mx-auto mb-2 text-green-600 dark:text-green-400" />
              <div className="font-semibold text-green-900 dark:text-green-100">
                {Object.values(ROUTE_CONFIG).filter(config => 
                  testRouteAccess(config.section)
                ).length}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Accessible Routes
              </div>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <XCircle size={32} className="mx-auto mb-2 text-red-600 dark:text-red-400" />
              <div className="font-semibold text-red-900 dark:text-red-100">
                {Object.values(ROUTE_CONFIG).filter(config => 
                  !testRouteAccess(config.section)
                ).length}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">
                Restricted Routes
              </div>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Shield size={32} className="mx-auto mb-2 text-blue-600 dark:text-blue-400" />
              <div className="font-semibold text-blue-900 dark:text-blue-100">
                {Object.values(ROUTE_CONFIG).length}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Total Routes
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};