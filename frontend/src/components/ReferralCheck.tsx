import { useState } from 'react';
import axios from 'axios';
import Y2KWindow from './Y2KWindow';
import { API_URL } from '../config';

const ReferralCheck = ({ onBack }: { onBack: () => void }) => {
  const [cedula, setCedula] = useState('');
  const [result, setResult] = useState<{ referral_code: string; nombres: string; apellidos: string } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    try {
      const response = await axios.post(`${API_URL}/sympathizers/get_link_by_cedula/`, { cedula });
      setResult(response.data);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setError('No se encontró ningún registro con esa cédula.');
      } else {
        setError('Error al consultar. Intente nuevamente.');
      }
    }
  };

  return (
    <div className="bg-secondary min-h-screen flex items-center justify-center p-4 font-sans relative">
      <Y2KWindow title="Revisar Link" onClose={onBack} onBack={onBack} className="max-w-md">
        <form onSubmit={handleCheck} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-black uppercase mb-1">Documento de Identidad</label>
            <input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              className="block w-full bg-white text-black border-2 border-black/20 focus:border-dark-periwinkle focus:ring-0 sm:text-sm p-3 shadow-inner"
              placeholder="Ingrese su cédula"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full rounded-full py-3 px-4 border-2 border-primary text-lg font-black text-white bg-primary hover:brightness-110 shadow-md uppercase tracking-widest transition-transform active:scale-95"
          >
            Consultar
          </button>

          {error && (
            <div className="bg-racing-red/20 border-2 border-white text-black p-3 text-center font-bold uppercase text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="bg-pearl-aqua/20 border-2 border-pearl-aqua p-4 space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <p className="text-sm font-bold text-black uppercase text-center">
                Link de: <span className="text-dark-amathyst">{result.nombres} {result.apellidos}</span>
              </p>
              
              <div className="flex items-center gap-2">
                <div className="bg-white border-2 border-black/10 p-3 flex-grow font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                  {`${window.location.origin}?ref=${result.referral_code}`}
                </div>
                
                <button
                    type="button"
                    title="Copiar URL"
                    onClick={() => {
                      const url = `${window.location.origin}?ref=${result.referral_code}`;
                      navigator.clipboard.writeText(url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={`w-10 h-10 flex items-center justify-center border-2 border-transparent transition-colors ${copied ? 'bg-pearl-aqua text-black border-black' : 'bg-white text-gray hover:border-black hover:bg-gray-200'}`}
                  >
                    {copied ? (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    )}
                  </button>
              </div>
              
               <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}?ref=${result.referral_code}`;
                      const text = `¡Únete a mi red! Regístrate aquí: ${url}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-2 font-bold uppercase text-sm hover:bg-[#128C7E] transition-colors"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    Compartir en WhatsApp
                </button>
            </div>
          )}
        </form>
      </Y2KWindow>
    </div>
  );
};

export default ReferralCheck;
