import { useState } from 'react';
import axios from 'axios';
import Y2KWindow from './Y2KWindow';
import { API_URL } from '../config';

interface LoginProps {
  onBack: () => void;
  onLoginSuccess: (token: string, user: any) => void;
  onForgotPassword?: () => void;
}

const Login = ({ onBack, onLoginSuccess, onForgotPassword }: LoginProps) => {
  const [step, setStep] = useState<'check' | 'password' | 'setup'>('check');
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/check-user/`, { cedula });
      if (response.data.exists) {
        if (response.data.has_user) {
          setStep('password');
        } else {
          setEmail(response.data.masked_email);
          setStep('setup');
        }
      } else {
        setError('Usuario no encontrado en la red.');
      }
    } catch (err) {
      setError('Error al verificar usuario.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSetup = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/request-password/`, { cedula });
      setMessage(`Se ha enviado un enlace a ${email} para configurar tu contraseña.`);
    } catch (err) {
      setError('Error al enviar el correo.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login/`, { cedula, password });
      onLoginSuccess(response.data.token, response.data.user);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-secondary min-h-screen flex items-center justify-center p-2 sm:p-4 font-sans relative">
      <Y2KWindow title="Login" onBack={onBack} className="max-w-md w-full mx-2 sm:mx-0">
        <div className="space-y-4 sm:space-y-6">
          {step === 'check' && (
            <form onSubmit={handleCheckUser} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-black uppercase mb-1">Documento de Identidad</label>
                <input
                  type="text"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  className="block w-full bg-white text-black border-2 border-black/20 focus:border-dark-periwinkle focus:ring-0 text-sm p-2 sm:p-3 shadow-inner"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full py-2 sm:py-3 px-4 border-2 border-primary text-sm sm:text-lg font-black text-white bg-primary hover:brightness-110 shadow-md uppercase tracking-wider sm:tracking-widest transition-transform active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Continuar'}
              </button>
            </form>
          )}

          {step === 'setup' && (
            <div className="space-y-3 sm:space-y-4 text-center">
              {!message ? (
                <>
                  <p className="font-medium text-sm sm:text-base">Este usuario no tiene una contraseña configurada.</p>
                  <p className="text-xs sm:text-sm text-black/70">Enviaremos un enlace a <span className="font-bold">{email}</span> para que puedas crear una.</p>
                  <button
                    onClick={handleRequestSetup}
                    disabled={loading}
                    className="w-full rounded-full py-2 sm:py-3 px-4 border-2 border-primary text-sm sm:text-lg font-black text-white bg-primary hover:brightness-110 shadow-md uppercase tracking-wider sm:tracking-widest transition-transform active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Enviando...' : 'Enviar Correo'}
                  </button>
                </>
              ) : (
                <div className="bg-pearl-aqua/20 border-2 border-pearl-aqua p-3 sm:p-4">
                  <p className="font-bold text-sm sm:text-base">{message}</p>
                  <p className="text-[10px] sm:text-xs mt-2">Revisa tu bandeja de entrada (y spam).</p>
                </div>
              )}
            </div>
          )}

          {step === 'password' && (
            <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-black uppercase mb-1">Documento de Identidad</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cedula}
                    readOnly
                    className="block w-full bg-black/5 text-black border-2 border-black/10 text-sm p-2 sm:p-3 pr-16 sm:pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setStep('check');
                      setPassword('');
                      setError('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs font-bold text-primary hover:text-primary/80 uppercase"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-black uppercase mb-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full bg-white text-black border-2 border-black/20 focus:border-dark-periwinkle focus:ring-0 text-sm p-2 sm:p-3 shadow-inner"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full py-2 sm:py-3 px-4 border-2 border-primary text-sm sm:text-lg font-black text-white bg-primary hover:brightness-110 shadow-md uppercase tracking-wider sm:tracking-widest transition-transform active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
              {onForgotPassword && (
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="w-full text-xs sm:text-sm text-primary hover:text-primary/80 font-medium mt-2"
                >
                  ¿Olvidaste tu contrasena?
                </button>
              )}
            </form>
          )}

          {error && (
            <div className="bg-white/70 border-2 border-primary text-primary p-2 sm:p-3 text-center font-bold uppercase text-xs sm:text-sm">
              {error}
            </div>
          )}
        </div>
      </Y2KWindow>
    </div>
  );
};

export default Login;
