import { useState } from 'react';
import axios from 'axios';
import Y2KWindow from '../Y2KWindow';
import { API_URL } from '../../config';

interface AdminLoginProps {
  onLoginSuccess: (token: string, user: any) => void;
}

const AdminLogin = ({ onLoginSuccess }: AdminLoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/admin/login/`, { username, password });
      onLoginSuccess(response.data.token, response.data.user);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-secondary min-h-screen flex items-center justify-center p-4 font-sans relative">
      <Y2KWindow title="Admin Login" className="max-w-md">
        <div className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black uppercase mb-1">Usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full bg-white text-black border-2 border-black/20 focus:border-dark-periwinkle focus:ring-0 sm:text-sm p-3 shadow-inner"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black uppercase mb-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full bg-white text-black border-2 border-black/20 focus:border-dark-periwinkle focus:ring-0 sm:text-sm p-3 shadow-inner"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full py-3 px-4 border-2 border-primary text-lg font-black text-white bg-primary hover:brightness-110 shadow-md uppercase tracking-widest transition-transform active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Ingresando...' : 'Ingresar al Panel'}
              </button>
            </form>

          {error && (
            <div className="bg-white/70 border-2 border-primary text-primary p-3 text-center font-bold uppercase text-sm">
              {error}
            </div>
          )}
        </div>
      </Y2KWindow>
    </div>
  );
};

export default AdminLogin;
