// src/App.tsx
// Fixed App.tsx to fetch real organization ID from user profile
// With Login As functionality integrated

import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

// Layout components
import { Footer } from './components/layout/Footer';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

// Page components
import { AdminSetup } from './components/pages/AdminSetup';
import { AIInsights } from './components/pages/AIInsights';
import { AIReports } from './components/pages/AIReports';
import { Alerts } from './components/pages/Alerts';
import { Automations } from './components/pages/Automations';
import { CommandCenter } from './components/pages/CommandCenter';
import { Dashboard } from './components/pages/Dashboard';
import { DatabaseCheck } from './components/pages/DatabaseCheck';
import { FixProfile } from './components/pages/FixProfile';
import { LocationGoogleProfile } from './components/pages/LocationGoogleProfile';
import { Locations } from './components/pages/Locations';
import { Login } from './components/pages/Login';
import { Media } from './components/pages/Media';
import { MockDataManager } from './components/pages/MockDataManager';
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
import { AutomationTestControls } from './components/ui/AutomationTestControls';


// UI components
import { LoginAsBanner } from './components/ui/LoginAsBanner';

// Auth components
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Contexts and hooks
import { ThemeProvider } from './contexts/ThemeContext';
import { useDeveloperMode } from './hooks/useDeveloperMode';

// Services and config
import { getRouteConfig } from './config/routes';
import { dataService } from './lib/dataService';
import { LoginAsService } from './lib/loginAsService';
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

// User profile from database
interface UserProfile {
  id: string;
  organization_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: 'admin' | 'support' | 'reseller' | 'customer';
  organization?: {
    id: string;
    name: string;
    slug: string;
    plan_tier: 'free' | 'pro' | 'enterprise';
  };
}

// Login As session interface
interface LoginAsSession {
  originalUserId: string;
  originalUserEmail: string;
  targetUserId: string;
  targetUserEmail: string;
  startedAt: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  const [loginAsSession, setLoginAsSession] = useState<LoginAsSession | null>(null);

  // Developer mode hook
  const { isDeveloperMode, developerRole } = useDeveloperMode();

  // Calculate effective role (developer role overrides actual role when in dev mode)
  const effectiveRole: UserRole = (isDeveloperMode && developerRole) 
    ? developerRole 
    : (userProfile?.role as UserRole) || 'user';

  const isDeveloperModeActive = isDeveloperMode && !!developerRole;

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile when user changes
  useEffect(() => {
    async function fetchUserProfile() {
      if (!user) {
        setUserProfile(null);
        setLoginAsSession(null);
        return;
      }

      try {
        // Check if we're in a Login As session
        const activeSession = LoginAsService.getActiveSession();
        setLoginAsSession(activeSession);
        
        if (activeSession) {
          // In Login As session - fetch target user's profile
          console.log('🔐 Login As active, fetching target user profile:', activeSession.targetUserId);
          const targetProfile = await LoginAsService.getEffectiveUserProfile(user.id);
          
          if (targetProfile) {
            setUserProfile(targetProfile as UserProfile);
            console.log('✅ Loaded target user profile for Login As:', targetProfile);
            return;
          } else {
            // Failed to load target profile, end session
            console.error('❌ Failed to load target profile, ending Login As session');
            await LoginAsService.endLoginAsSession();
            return;
          }
        }
        
        // Normal flow - fetch current user's profile
        const profile = await dataService.initializeUserData(user);
        if (profile) {
          setUserProfile(profile as UserProfile);
          console.log('✅ User profile loaded:', profile);
        }
      } catch (error) {
        console.error('❌ Error fetching user profile:', error);
      }
    }

    fetchUserProfile();
  }, [user]);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    // Clear any Login As session
    if (LoginAsService.isInLoginAsSession()) {
      await LoginAsService.endLoginAsSession();
    }
    
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setLoginAsSession(null);
    setActiveSection('dashboard');
  };

  const handleLogin = () => {
    // After login, user state will be updated via useEffect
    setActiveSection('dashboard');
  };

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
        isDeveloperModeActive,
        organizationId: userProfile?.organization_id,
        loginAsActive: !!loginAsSession
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
      case 'command-center':
        component = <CommandCenter />;
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
      case 'google-profile':
  component = (
    <div className="space-y-6">
      <LocationGoogleProfile />
      <AutomationTestControls />
    </div>
  );
  break;
  
case 'ai-reports':
  component = <AIReports />;
  break;

      case 'public-report-share':
        // This route would need token from URL params
        // For now, just show a placeholder
        component = <div>Public Share Page - Token needed from URL</div>;
        break;

case 'mock-data':
  component = <MockDataManager />;
  break;

case 'automation-testing':
  return <AutomationTestControls />;
      default:
        component = <Dashboard />;
    }

    // If no route config exists or it's a public route, render component directly
    if (!routeConfig || routeConfig.isPublic) {
      return component;
    }

    // Create AppUser object for ProtectedRoute using REAL profile data
    const appUser: AppUser = {
      id: user?.id || 'test-user-id',
      name: userProfile 
        ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || user?.email || 'User'
        : user?.user_metadata?.name || 'Test User',
      email: user?.email || 'test@example.com',
      role: effectiveRole,
      // ✅ USE REAL ORGANIZATION ID FROM PROFILE
      organizationId: userProfile?.organization_id || 'test-org-id',
      organizationName: userProfile?.organization?.name || 'Organization'
    };

    // Debug log
    if (isDeveloperMode) {
      console.log('👤 App User for ProtectedRoute:', appUser);
    }

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
    
    // Allow mock-data and sample-data even without route config (dev tools)
    if (!routeConfig && section !== 'mock-data' && section !== 'sample-data') {
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
      hasUserProfile: !!userProfile,
      organizationId: userProfile?.organization_id,
      activeSection,
      loginAsActive: !!loginAsSession
    });
  }

  if (loading) {
    return (
      <ThemeProvider>
        {/* UPDATED: Loading screen with new background gradients (Light: Option 3, Dark: Option 2) */}
        <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-700 dark:to-slate-900 flex items-center justify-center">
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
      {/* UPDATED: Main app background with new gradients (Option 2) */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-200 to-slate-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-700 dark:to-slate-900 text-gray-900 dark:text-white transition-colors duration-300">
        {!user ? (
          <Login onLogin={handleLogin} />
        ) : (
          <>
            <Header 
              onMobileMenuToggle={handleMobileMenuToggle}
              isMobileMenuOpen={isMobileMenuOpen}
              user={user}
              onLogout={handleLogout}
            />
            
            {/* Login As Banner - Show when admin is impersonating customer */}
            {loginAsSession && (
              <LoginAsBanner
                targetUserEmail={loginAsSession.targetUserEmail}
                originalUserEmail={loginAsSession.originalUserEmail}
              />
            )}
            
            <div className="flex">
              <Sidebar 
                activeSection={activeSection}
                onSectionChange={handleSectionChange}
                isOpen={isMobileMenuOpen}
                onClose={handleMobileMenuClose}
                userRole={effectiveRole}
                isDeveloperModeActive={isDeveloperModeActive}
              />
              
              <main className={`flex-1 lg:ml-72 min-h-screen ${loginAsSession ? 'pt-28' : ''}`}>
                <div className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-24">
                  {renderContent()}
                </div>
                
                <Footer />
              </main>
            </div>

            {/* Developer Mode Debugger */}
            {showDebugger && (
              <div className="fixed bottom-4 right-4 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Developer Mode</h3>
                    <button onClick={() => setShowDebugger(false)} className="text-gray-500 hover:text-gray-700">
                      Close
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>Mode: {isDeveloperMode ? 'Active' : 'Inactive'}</div>
                    <div>Role: {effectiveRole}</div>
                    <div>Dev Role: {developerRole || 'None'}</div>
                    <div>Org ID: {userProfile?.organization_id || 'N/A'}</div>
                    {loginAsSession && (
                      <>
                        <div className="pt-2 border-t border-gray-300 dark:border-gray-600 mt-2">
                          <div className="font-medium text-orange-600 dark:text-orange-400">Login As Active</div>
                          <div className="text-xs">Target: {loginAsSession.targetUserEmail}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;