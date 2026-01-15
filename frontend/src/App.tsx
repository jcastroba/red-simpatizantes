import { useState, useEffect } from 'react';
import RegistrationForm from './components/RegistrationForm';
import MainMenu from './components/MainMenu';
import ReferralCheck from './components/ReferralCheck';
import Login from './components/Login';
import SetPassword from './components/SetPassword';
import Dashboard from './components/Dashboard';
import AdminLogin from './components/admin/AdminLogin';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import NetworkManagement from './components/admin/NetworkManagement';
import UserManagement from './components/admin/UserManagement';
import './App.css';

type View = 'menu' | 'register' | 'check' | 'login' | 'set-password' | 'dashboard' | 'admin-login' | 'admin-panel';

function App() {
  const [currentView, setCurrentView] = useState<View>('menu');
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  
  // Admin State
  const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem('adminToken'));
  const [adminUser, setAdminUser] = useState<any>(JSON.parse(localStorage.getItem('adminUser') || 'null'));
  const [adminTab, setAdminTab] = useState('dashboard');

  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    
    if (path.startsWith('/admin')) {
        if (adminToken) {
            setCurrentView('admin-panel');
        } else {
            setCurrentView('admin-login');
        }
    } else if (path === '/set-password' || params.get('uid')) {
      setCurrentView('set-password');
    } else if (token) {
        setCurrentView('dashboard');
    } else if (params.get('ref')) {
        setCurrentView('register');
    }
  }, [token, adminToken]);

  const handleLoginSuccess = (newToken: string) => {
      setToken(newToken);
      localStorage.setItem('token', newToken);
      // Clean URL
      window.history.replaceState({}, '', '/');
      setCurrentView('dashboard');
  };

  const handleLogout = () => {
      setToken(null);
      localStorage.removeItem('token');
      // Clean URL
      window.history.replaceState({}, '', '/');
      setCurrentView('menu');
  };

  const handleAdminLoginSuccess = (newToken: string, user: any) => {
      setAdminToken(newToken);
      setAdminUser(user);
      localStorage.setItem('adminToken', newToken);
      localStorage.setItem('adminUser', JSON.stringify(user));
      window.history.replaceState({}, '', '/admin');
      setCurrentView('admin-panel');
  };

  const handleAdminLogout = () => {
      setAdminToken(null);
      setAdminUser(null);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.history.replaceState({}, '', '/admin');
      setCurrentView('admin-login');
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
        return <RegistrationForm onBack={() => {
            window.history.replaceState({}, '', '/');
            setCurrentView('menu');
        }} />;
      case 'check':
        return <ReferralCheck onBack={() => setCurrentView('menu')} />;
      case 'login':
        return <Login onBack={() => setCurrentView('menu')} onLoginSuccess={handleLoginSuccess} />;
      case 'set-password':
        return <SetPassword onSuccess={() => {
            window.history.replaceState({}, '', '/');
            setCurrentView('login');
        }} />;
      case 'dashboard':
        return token ? <Dashboard token={token} onLogout={handleLogout} /> : <MainMenu onRegister={() => setCurrentView('register')} onCheckLink={() => setCurrentView('check')} onLogin={() => setCurrentView('login')} />;
      
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

  return renderView();
}

export default App;
