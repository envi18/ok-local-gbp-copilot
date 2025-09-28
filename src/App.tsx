import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { Footer } from './components/layout/Footer';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
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
import { Posts } from './components/pages/Posts';
import { PremiumListings } from './components/pages/PremiumListings';
import { Rankings } from './components/pages/Rankings';
import { Reviews } from './components/pages/Reviews';
import { SettingsGeneral } from './components/pages/SettingsGeneral';
import { SettingsUsers } from './components/pages/SettingsUsers';
import { VoiceSearch } from './components/pages/VoiceSearch';
import { ThemeProvider } from './contexts/ThemeContext';
import { supabase } from './lib/supabase';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for authentication changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Handle Google OAuth callback - redirect to locations page
  useEffect(() => {
    const handleGoogleCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      
      if (code || error) {
        // If we have OAuth parameters, switch to locations section
        setActiveSection('locations');
        // Clean up URL without refreshing page
       // window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleGoogleCallback();
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setActiveSection('dashboard'); // Reset to dashboard on logout
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

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'locations':
        return <Locations />;
      case 'ai-visibility':
        return <AIInsights />;
      case 'reviews':
        return <Reviews />;
      case 'posts':
        return <Posts />;
      case 'media':
        return <Media />;
      case 'rankings':
        return <Rankings />;
      case 'voice-search':
        return <VoiceSearch />;
      case 'premium-listings':
        return <PremiumListings />;
      case 'alerts':
        return <Alerts />;
      case 'automations':
        return <Automations />;
      case 'settings':
        return <SettingsGeneral />;
      case 'users':
        return <SettingsUsers />;
      case 'admin-setup':
        return <AdminSetup />;
      case 'db-check':
        return <DatabaseCheck />;
      case 'fix-profile':
        return <FixProfile />;
      default:
        return <Dashboard />;
    }
  };

  // Show loading spinner while checking authentication
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
            <Header 
              onMobileMenuToggle={handleMobileMenuToggle}
              isMobileMenuOpen={isMobileMenuOpen}
              user={user}
              onLogout={handleLogout}
            />
            <div className="flex">
              <Sidebar 
                activeSection={activeSection} 
                onSectionChange={setActiveSection}
                isOpen={isMobileMenuOpen}
                onClose={handleMobileMenuClose}
              />
              <main className="flex-1 lg:ml-72 mt-16 p-4 lg:p-8 min-h-[calc(100vh-4rem)]">
                {renderContent()}
                <Footer />
              </main>
            </div>
          </>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;