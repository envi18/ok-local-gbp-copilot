// src/App.tsx
// Fixed App.tsx with SampleDataManager route added

import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

// Layout components
import { Footer } from './components/layout/Footer';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

// Page components
import { AdminSetup } from './components/pages/AdminSetup';
import { AIInsights } from './components/pages/AIInsights';
import { Alerts } from './components/pages/Alerts';
import { Automations } from './components/pages/Automations';
import { Dashboard } from './components/pages/Dashboard';
import { DatabaseCheck } from './components/pages/DatabaseCheck';
import { FixProfile } from './components/pages/FixProfile';
import { Locations } from './components/pages/Locations';
import { Login } from './components/pages/Login';
import { Media } from './components/pages/Media';
import Onboarding from './components/pages/Onboarding';
import { Posts } from './components/pages/Posts';
import { PremiumListings } from './components/pages/PremiumListings';
import { Rankings } from './components/pages/Rankings';
import { Reviews } from './components/pages/Reviews';
import { SampleDataManager } from './components/pages/SampleDataManager';
import { SettingsCustomers } from './components/pages/SettingsCustomers';
import { SettingsGeneral } from './components/pages/SettingsGeneral';
import { SettingsUsers } from './components/pages/SettingsUsers';
import { VoiceSearch } from './components/pages/VoiceSearch';

// Auth components
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Debug components
import { DeveloperModeDebugger } from './components/debug/DeveloperModeDebugger';

// Contexts and hooks
import { ThemeProvider } from './contexts/ThemeContext';
import { useDeveloperMode } from './hooks/useDeveloperMode';

// Services and config
import { getRouteConfig } from './config/routes';
import { supabase } from './lib/supabase';
import type { ProductName } from './types/products';

type UserRole = 'user' | 'manager' | 'admin';
type SectionType = string;

// Custom User interface to avoid conflicts with Supabase User type
interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  organizationName?: string;
  productAccess?: ProductName[];
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  
  // Developer mode hook - only destructure what we actually use in App.tsx
  const { isDeveloperMode, developerRole } = useDeveloperMode();

  // Debug: Log role changes
  useEffect(() => {
    if (isDeveloperMode) {
      console.log('🔄 Role changed:', {
        developerRole,
        effectiveRole: developerRole || getUserRole(),
        isDeveloperMode,
        timestamp: new Date().toISOString()
      });
    }
  }, [developerRole, isDeveloperMode]);

  useEffect(() => {
    // Check if user is logged in
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    getSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (userData: any) => {
    // This will be called by your Login component
    console.log('Login triggered:', userData);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setActiveSection('dashboard');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  // Get user's effective role (considering developer mode)
  const getUserRole = (): UserRole => {
    // TODO: In production, fetch this from the database
    return 'user';
  };

  const effectiveRole = developerRole || getUserRole();
  const isDeveloperModeActive = isDeveloperMode && !!developerRole;

  // Debug keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + D to toggle debugger
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        setShowDebugger(!showDebugger);
        console.log('🐛 Debugger toggled:', !showDebugger);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showDebugger]);

  // Enhanced render content with route protection
  const renderContent = () => {
    // Debug: Log route access attempt
    if (isDeveloperMode) {
      console.log('🛣️ Rendering route:', {
        section: activeSection,
        effectiveRole,
        isDeveloperModeActive
      });
    }

    const routeConfig = getRouteConfig(activeSection);
    
    // Get the component to render
    let component: React.ReactNode;
    
    switch (activeSection) {
      case 'dashboard':
        component = <Dashboard />;
        break;
      case 'locations':
        component = <Locations />;
        break;
      case 'ai-visibility':
        component = <AIInsights />;
        break;
      case 'reviews':
        component = <Reviews />;
        break;
      case 'posts':
        component = <Posts />;
        break;
      case 'media':
        component = <Media />;
        break;
      case 'rankings':
        component = <Rankings />;
        break;
      case 'voice-search':
        component = <VoiceSearch />;
        break;
      case 'premium-listings':
        component = <PremiumListings />;
        break;
      case 'alerts':
        component = <Alerts />;
        break;
      case 'automations':
        component = <Automations />;
        break;
      case 'settings':
        component = <SettingsGeneral />;
        break;
      case 'customers':
        component = <SettingsCustomers />;
        break;
      case 'users':
        component = <SettingsUsers />;
        break;
      case 'admin-setup':
        component = <AdminSetup />;
        break;
      case 'db-check':
        component = <DatabaseCheck />;
        break;
      case 'fix-profile':
        component = <FixProfile />;
        break;
      case 'onboarding':
        component = <Onboarding />;
        break;
      case 'sample-data':
        component = <SampleDataManager />;
        break;
      default:
        component = <Dashboard />;
    }

    // If no route config exists or it's a public route, render component directly
    if (!routeConfig || routeConfig.isPublic) {
      return component;
    }

    // Create AppUser object for ProtectedRoute
    const appUser: AppUser = {
      id: user?.id || 'test-user-id',
      name: user?.user_metadata?.name || 'Test User',
      email: user?.email || 'test@example.com',
      role: effectiveRole,
      organizationId: 'test-org-id', // TODO: Get from database
      organizationName: 'Test Organization',
      productAccess: ['gbp_management'] // TODO: Get from database
    };

    // Wrap component in ProtectedRoute for protected routes
    return (
      <ProtectedRoute
        requiredProduct={routeConfig.requiredProduct}
        requiredRole={routeConfig.requiredRole}
        allowedRoles={routeConfig.allowedRoles}
        user={appUser}
        productDisplayName={routeConfig.label}
        productDescription={routeConfig.description}
      >
        {component}
      </ProtectedRoute>
    );
  };

  // Enhanced section change with access validation
  const handleSectionChange = (section: SectionType) => {
    const routeConfig = getRouteConfig(section);
    
    if (!routeConfig) {
      console.warn(`Route config not found for section: ${section}`);
      return;
    }

    // Debug: Log navigation attempt
    if (isDeveloperMode) {
      console.log('🧭 Navigation attempt:', {
        from: activeSection,
        to: section,
        effectiveRole,
        routeConfig
      });
    }

    // Always allow navigation - ProtectedRoute will handle access control
    setActiveSection(section);
    handleMobileMenuClose();
  };

  // Debug: Log app render state
  if (isDeveloperMode) {
    console.log('🧪 App Render:', {
      isDeveloperMode,
      developerRole,
      effectiveRole,
      isDeveloperModeActive,
      userRoleBeingPassedToSidebar: effectiveRole,
      hasUser: !!user,
      activeSection
    });
  }

  if (loading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f45a4e] mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
        {!user ? (
          <Login onLogin={handleLogin} />
        ) : (
          <>
            {/* Developer Mode Header */}
            {isDeveloperModeActive && (
              <div className="bg-red-600 text-white px-4 py-2 text-sm text-center font-medium relative">
                🛠️ DEVELOPER MODE - Role Override: {effectiveRole.toUpperCase()}
                <button
                  onClick={() => setShowDebugger(!showDebugger)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-700 hover:bg-red-800 px-2 py-1 rounded text-xs"
                >
                  Debug
                </button>
              </div>
            )}
            
            {/* Debug Mode Indicator for non-override state */}
            {isDeveloperMode && !isDeveloperModeActive && (
              <div className="bg-blue-600 text-white px-4 py-2 text-sm text-center font-medium relative">
                🧪 DEVELOPER MODE - Using Real Role: {effectiveRole.toUpperCase()}
                <button
                  onClick={() => setShowDebugger(!showDebugger)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-700 hover:bg-blue-800 px-2 py-1 rounded text-xs"
                >
                  Debug
                </button>
              </div>
            )}
            
            <Header 
              onMobileMenuToggle={handleMobileMenuToggle}
              isMobileMenuOpen={isMobileMenuOpen}
              user={user}
              onLogout={handleLogout}
            />
            <div className="flex">
              <Sidebar 
                activeSection={activeSection} 
                onSectionChange={handleSectionChange}
                isOpen={isMobileMenuOpen}
                onClose={handleMobileMenuClose}
                userRole={effectiveRole} // Pass effective role
                isDeveloperModeActive={isDeveloperModeActive}
              />
              <main className={`flex-1 lg:ml-72 p-4 lg:p-8 min-h-[calc(100vh-4rem)] ${
                isDeveloperMode ? 'mt-20' : 'mt-16'
              }`}>
                {renderContent()}
                <Footer />
              </main>
            </div>

            {/* Debug Helper */}
            {showDebugger && <DeveloperModeDebugger />}
          </>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;