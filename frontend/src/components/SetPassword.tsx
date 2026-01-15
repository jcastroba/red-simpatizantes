import { useState, useEffect } from 'react';
import axios from 'axios';
import Y2KWindow from './Y2KWindow';
import { API_URL } from '../config';

interface SetPasswordProps {
  onSuccess: () => void;
}

const SetPassword = ({ onSuccess }: SetPasswordProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uid, setUid] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUid(params.get('uid') || '');
    setToken(params.get('token') || '');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/set-password/`, { uid, token, password });
      onSuccess();
    } catch (err) {
      setError('Error al guardar la contraseña. El enlace puede haber expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-secondary min-h-screen flex items-center justify-center p-4 font-sans relative">
      <Y2KWindow title="Crear Contraseña" className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm mb-4">Crea una contraseña segura para acceder a tu cuenta.</p>
          <div>
            <label className="block text-sm font-bold text-black uppercase mb-1">Nueva Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full bg-white text-black border-2 border-black/20 focus:border-dark-periwinkle focus:ring-0 sm:text-sm p-3 shadow-inner"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-black uppercase mb-1">Confirmar Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full bg-white text-black border-2 border-black/20 focus:border-dark-periwinkle focus:ring-0 sm:text-sm p-3 shadow-inner"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full py-3 px-4 border-2 border-primary text-lg font-black text-white bg-primary hover:brightness-110 shadow-md uppercase tracking-widest transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Contraseña'}
          </button>

          {error && (
            <div className="bg-white/70 border-2 border-primary text-primary p-3 text-center font-bold uppercase text-sm">
              {error}
            </div>
          )}
        </form>
      </Y2KWindow>
    </div>
  );
};

export default SetPassword;
