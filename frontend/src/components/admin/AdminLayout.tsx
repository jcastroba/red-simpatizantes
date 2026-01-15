import React, { useState } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: any;
}

const AdminLayout = ({ children, onLogout, activeTab, onTabChange, user }: AdminLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'networks', label: 'Gestión de Redes' },
    { id: 'users', label: 'Usuarios' },
  ];

  return (
    <div className="min-h-screen bg-secondary flex font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary text-white transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 border-r-2 border-white`}>
        <div className="p-6 border-b-2 border-white/20">
          <h1 className="text-2xl font-black uppercase tracking-widest">Admin Panel</h1>
          <p className="text-xs opacity-70 mt-1">Bienvenido, {user?.username}</p>
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-3 font-bold uppercase tracking-wider transition-colors border-2 ${
                activeTab === item.id 
                  ? 'bg-white text-primary border-white' 
                  : 'bg-transparent border-transparent hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t-2 border-white/20">
          <button
            onClick={onLogout}
            className="w-full px-4 py-2 bg-racing-red text-white font-bold uppercase border-2 border-transparent hover:border-white transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-primary text-white p-4 flex justify-between items-center border-b-2 border-white">
          <h1 className="font-black uppercase">Admin Panel</h1>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
