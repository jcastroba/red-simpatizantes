import { useState, useEffect } from 'react';
import RegistrationForm from './components/RegistrationForm';
import MainMenu from './components/MainMenu';
import ReferralCheck from './components/ReferralCheck';
import Login from './components/Login';
import SetPassword from './components/SetPassword';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import AdminLogin from './components/admin/AdminLogin';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import NetworkManagement from './components/admin/NetworkManagement';
import UserManagement from './components/admin/UserManagement';
import Loading from './components/ui/Loading';
import SessionExpired from './components/ui/SessionExpired';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

type View = 'menu' | 'register' | 'check' | 'login' | 'forgot-password' | 'set-password' | 'reset-password' | 'dashboard' | 'admin-login' | 'admin-panel';

function AppContent() {
  const {
    token,
    isAuthenticated,
    login,
    logout,
    adminToken,
    adminUser,
    isAdminAuthenticated,
    adminLogin,
    adminLogout,
    isSessionExpired,
    clearSessionExpired,
    isLoading,
  } = useAuth();

  const [currentView, setCurrentView] = useState<View>('menu');
  const [adminTab, setAdminTab] = useState('dashboard');

  // Route handling
  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    if (path.startsWith('/admin')) {
      if (isAdminAuthenticated) {
        setCurrentView('admin-panel');
      } else {
        setCurrentView('admin-login');
      }
    } else if (path === '/set-password' || (params.get('uid') && !path.includes('reset'))) {
      setCurrentView('set-password');
    } else if (path === '/reset-password' || (params.get('uid') && path.includes('reset'))) {
      setCurrentView('reset-password');
    } else if (isAuthenticated) {
      setCurrentView('dashboard');
    } else if (params.get('ref')) {
      setCurrentView('register');
    }
  }, [isAuthenticated, isAdminAuthenticated]);

  const handleLoginSuccess = (newToken: string, newUser: any) => {
    login(newToken, newUser);
    window.history.replaceState({}, '', '/');
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    logout();
    window.history.replaceState({}, '', '/');
    setCurrentView('menu');
  };

  const handleAdminLoginSuccess = (newToken: string, newUser: any) => {
    adminLogin(newToken, newUser);
    window.history.replaceState({}, '', '/admin');
    setCurrentView('admin-panel');
  };

  const handleAdminLogout = () => {
    adminLogout();
    window.history.replaceState({}, '', '/admin');
    setCurrentView('admin-login');
  };

  const handleSessionExpiredClose = () => {
    clearSessionExpired();
    const path = window.location.pathname;
    if (path.startsWith('/admin')) {
      setCurrentView('admin-login');
    } else {
      setCurrentView('login');
    }
  };

  const renderAdminContent = () => {
    switch (adminTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'networks':
        return <NetworkManagement token={adminToken!} />;
      case 'users':
        return <UserManagement token={adminToken!} />;
      default:
        return <AdminDashboard />;
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'menu':
        return (
          <MainMenu
            onRegister={() => setCurrentView('register')}
            onCheckLink={() => setCurrentView('check')}
            onLogin={() => setCurrentView('login')}
          />
        );
      case 'register':
        return (
          <RegistrationForm
            onBack={() => {
              window.history.replaceState({}, '', '/');
              setCurrentView('menu');
            }}
          />
        );
      case 'check':
        return <ReferralCheck onBack={() => setCurrentView('menu')} />;
      case 'login':
        return (
          <Login
            onBack={() => setCurrentView('menu')}
            onLoginSuccess={handleLoginSuccess}
            onForgotPassword={() => setCurrentView('forgot-password')}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPassword
            onBack={() => setCurrentView('login')}
            onSuccess={() => setCurrentView('login')}
          />
        );
      case 'set-password':
      case 'reset-password':
        return (
          <SetPassword
            onSuccess={() => {
              window.history.replaceState({}, '', '/');
              setCurrentView('login');
            }}
          />
        );
      case 'dashboard':
        return token ? (
          <Dashboard token={token} onLogout={handleLogout} />
        ) : (
          <MainMenu
            onRegister={() => setCurrentView('register')}
            onCheckLink={() => setCurrentView('check')}
            onLogin={() => setCurrentView('login')}
          />
        );

      // Admin Views
      case 'admin-login':
        return <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />;
      case 'admin-panel':
        return (
          <AdminLayout
            onLogout={handleAdminLogout}
            activeTab={adminTab}
            onTabChange={setAdminTab}
            user={adminUser}
          >
            {renderAdminContent()}
          </AdminLayout>
        );

      default:
        return (
          <MainMenu
            onRegister={() => setCurrentView('register')}
            onCheckLink={() => setCurrentView('check')}
            onLogin={() => setCurrentView('login')}
          />
        );
    }
  };

  // Show loading while verifying tokens
  if (isLoading) {
    return <Loading fullScreen message="Verificando sesion..." />;
  }

  return (
    <>
      {renderView()}
      {isSessionExpired && (
        <SessionExpired
          onClose={handleSessionExpiredClose}
          onLogin={handleSessionExpiredClose}
        />
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
