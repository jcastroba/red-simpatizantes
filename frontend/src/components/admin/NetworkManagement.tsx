import { useState, useEffect } from 'react';
import axios from 'axios';
import Y2KWindow from '../Y2KWindow';
import { API_URL } from '../../config';

interface NetworkManagementProps {
  token: string;
}

const NetworkManagement = ({ token }: NetworkManagementProps) => {
  const [networks, setNetworks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    cedula: '',
    phone: '',
    email: '',
    sexo: 'M'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchNetworks = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/networks/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setNetworks(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworks();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post(`${API_URL}/admin/networks/`, formData, {
        headers: { Authorization: `Token ${token}` }
      });
      setSuccess('Red creada exitosamente');
      setShowCreate(false);
      setFormData({ nombres: '', apellidos: '', cedula: '', phone: '', email: '', sexo: 'M' });
      fetchNetworks();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear la red');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-primary uppercase">Gestión de Redes</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary text-white font-bold px-6 py-3 border-2 border-transparent hover:bg-white hover:text-primary hover:border-primary transition-colors uppercase shadow-md"
        >
          + Nueva Red
        </button>
      </div>

      {showCreate && (
        <Y2KWindow title="Crear Nueva Red (Usuario Fundador)" onClose={() => setShowCreate(false)} className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-black uppercase mb-1">Nombres</label>
                <input
                  type="text"
                  value={formData.nombres}
                  onChange={e => setFormData({...formData, nombres: e.target.value})}
                  className="block w-full bg-white border-2 border-black/20 p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black uppercase mb-1">Apellidos</label>
                <input
                  type="text"
                  value={formData.apellidos}
                  onChange={e => setFormData({...formData, apellidos: e.target.value})}
                  className="block w-full bg-white border-2 border-black/20 p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black uppercase mb-1">Cédula</label>
                <input
                  type="text"
                  value={formData.cedula}
                  onChange={e => setFormData({...formData, cedula: e.target.value})}
                  className="block w-full bg-white border-2 border-black/20 p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black uppercase mb-1">Teléfono</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="block w-full bg-white border-2 border-black/20 p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black uppercase mb-1">Email (Opcional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="block w-full bg-white border-2 border-black/20 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black uppercase mb-1">Sexo</label>
                <select
                  value={formData.sexo}
                  onChange={e => setFormData({...formData, sexo: e.target.value})}
                  className="block w-full bg-white border-2 border-black/20 p-2"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="O">Otro</option>
                </select>
              </div>
            </div>
            
            {error && <div className="text-racing-red font-bold text-sm">{error}</div>}
            
            <button type="submit" className="w-full bg-primary text-white font-bold py-3 uppercase hover:brightness-110">
              Crear Red
            </button>
          </form>
        </Y2KWindow>
      )}

      {success && (
        <div className="bg-pearl-aqua/20 border-2 border-pearl-aqua p-4 text-black font-bold mb-4">
            {success}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-black/60 font-bold uppercase">Cargando redes...</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {networks.map(network => (
          <Y2KWindow key={network.id} title={network.name} isStatic={true}>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-black/10 pb-2">
                <span className="text-xs font-bold text-black/60 uppercase">Fundador</span>
                <span className="font-bold">{network.name}</span>
              </div>
              <div className="flex justify-between border-b border-black/10 pb-2">
                <span className="text-xs font-bold text-black/60 uppercase">Cédula</span>
                <span>{network.cedula}</span>
              </div>
              <div className="flex justify-between border-b border-black/10 pb-2">
                <span className="text-xs font-bold text-black/60 uppercase">Código</span>
                <span className="font-mono bg-black/5 px-2">{network.referral_code}</span>
              </div>
              <div className="flex justify-between border-b border-black/10 pb-2">
                <span className="text-xs font-bold text-black/60 uppercase">Referidos Directos</span>
                <span className="font-bold text-primary">{network.direct_referrals}</span>
              </div>
              <div className="pt-2">
                <p className="text-xs font-bold text-black/60 uppercase mb-1">Link de Referido</p>
                <div className="flex gap-2">
                    <input 
                        readOnly 
                        value={`${window.location.origin}?ref=${network.referral_code}`}
                        className="w-full text-xs p-2 bg-black/5 border border-black/10"
                    />
                    <button 
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}?ref=${network.referral_code}`)}
                        className="bg-primary text-white px-3 text-xs font-bold uppercase"
                    >
                        Copiar
                    </button>
                </div>
              </div>
            </div>
          </Y2KWindow>
        ))}
      </div>
      )}
    </div>
  );
};

export default NetworkManagement;
