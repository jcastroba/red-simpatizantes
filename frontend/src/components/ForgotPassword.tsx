/**
 * Forgot password component for requesting password reset.
 */
import { useState } from 'react';
import Y2KWindow from './Y2KWindow';
import Loading from './ui/Loading';
import { authApi } from '../services/api';

interface ForgotPasswordProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function ForgotPassword({ onBack, onSuccess }: ForgotPasswordProps) {
  const [cedula, setCedula] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authApi.forgotPassword(cedula);
      setSuccess(true);
    } catch (err) {
      // Always show success to prevent enumeration
      setSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
        <Y2KWindow title="Correo Enviado" className="max-w-md w-full">
          <div className="text-center space-y-6 py-4">
            <div className="text-6xl">📧</div>
            <div>
              <h2 className="text-xl font-bold text-black mb-2">Revisa tu correo</h2>
              <p className="text-black/60">
                Si la cedula ingresada esta registrada, recibiras un correo con las instrucciones
                para restablecer tu contrasena.
              </p>
            </div>
            <p className="text-sm text-black/40">
              El enlace expira en 24 horas.
            </p>
            <button
              onClick={onSuccess}
              className="w-full py-3 bg-primary text-white font-bold uppercase text-sm hover:bg-primary/90 transition-colors"
            >
              Volver al Inicio de Sesion
            </button>
          </div>
        </Y2KWindow>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <Y2KWindow title="Recuperar Contrasena" className="max-w-md w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-black/60 text-sm">
            Ingresa tu numero de cedula y te enviaremos un correo con las instrucciones
            para restablecer tu contrasena.
          </p>

          <div>
            <label className="block text-sm font-bold uppercase text-black/60 mb-1">
              Numero de Cedula
            </label>
            <input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
              placeholder="Ej: 1234567890"
              className="w-full p-3 border-2 border-black/10 focus:border-primary outline-none text-lg"
              required
              disabled={isLoading}
              maxLength={15}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <Loading message="Enviando..." />
          ) : (
            <div className="space-y-3">
              <button
                type="submit"
                className="w-full py-3 bg-primary text-white font-bold uppercase text-sm hover:bg-primary/90 transition-colors"
              >
                Enviar Instrucciones
              </button>
              <button
                type="button"
                onClick={onBack}
                className="w-full py-3 border-2 border-black/20 text-black/60 font-bold uppercase text-sm hover:bg-black/5 transition-colors"
              >
                Volver
              </button>
            </div>
          )}
        </form>
      </Y2KWindow>
    </div>
  );
}
