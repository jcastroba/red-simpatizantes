/**
 * Session expired modal component.
 */
import Y2KWindow from '../Y2KWindow';

interface SessionExpiredProps {
  onClose: () => void;
  onLogin: () => void;
}

export default function SessionExpired({ onClose, onLogin }: SessionExpiredProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Y2KWindow title="Sesion Expirada" onClose={onClose} className="max-w-md">
        <div className="text-center space-y-6 py-4">
          <div className="text-6xl">⏰</div>
          <div>
            <h2 className="text-xl font-bold text-black mb-2">Tu sesion ha expirado</h2>
            <p className="text-black/60">
              Por seguridad, tu sesion ha sido cerrada. Por favor, inicia sesion nuevamente.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 border-2 border-black/20 text-black/60 font-bold uppercase text-sm hover:bg-black/5 transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={onLogin}
              className="px-6 py-2 bg-primary text-white font-bold uppercase text-sm hover:bg-primary/90 transition-colors"
            >
              Iniciar Sesion
            </button>
          </div>
        </div>
      </Y2KWindow>
    </div>
  );
}
