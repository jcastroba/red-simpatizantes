import { useState, useEffect } from 'react';
import axios from 'axios';
import Y2KWindow from '../Y2KWindow';
import ReferralNetwork from '../ReferralNetwork';
import { API_URL } from '../../config';

interface NetworkManagementProps {
  token: string;
}

interface NetworkVisualizationData {
  network_name: string;
  root_name: string;
  total_nodes: number;
  nodes: any[];
  links: any[];
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
    sexo: 'M',
    network_name: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showVisualization, setShowVisualization] = useState(false);
  const [visualizationData, setVisualizationData] = useState<NetworkVisualizationData | null>(null);
  const [loadingVisualization, setLoadingVisualization] = useState(false);

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
      setFormData({ nombres: '', apellidos: '', cedula: '', phone: '', email: '', sexo: 'M', network_name: '' });
      fetchNetworks();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear la red');
    }
  };

  const handleViewNetwork = async (networkId: number) => {
    setLoadingVisualization(true);
    try {
      const response = await axios.get(`${API_URL}/admin/networks/${networkId}/visualization/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setVisualizationData(response.data);
      setShowVisualization(true);
    } catch (err) {
      console.error('Error loading network visualization:', err);
      setError('Error al cargar la visualización de la red');
    } finally {
      setLoadingVisualization(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl sm:text-3xl font-black text-primary uppercase">Gestión de Redes</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary text-white font-bold px-4 sm:px-6 py-2 sm:py-3 border-2 border-transparent hover:bg-white hover:text-primary hover:border-primary transition-colors uppercase shadow-md text-sm sm:text-base w-full sm:w-auto"
        >
          + Nueva Red
        </button>
      </div>

      {showCreate && (
        <Y2KWindow title="Crear Nueva Red" onClose={() => setShowCreate(false)} className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleCreate} className="space-y-4">
            {/* Network Name - Full Width */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-black uppercase mb-1">Nombre de la Red / Político</label>
              <input
                type="text"
                value={formData.network_name}
                onChange={e => setFormData({...formData, network_name: e.target.value})}
                className="block w-full bg-white border-2 border-black/20 p-2 text-sm"
                placeholder="Ej: Red de Juan Pérez, Campaña Norte..."
              />
              <p className="text-xs text-black/50 mt-1">Nombre identificador de esta red (opcional)</p>
            </div>

            <div className="border-t border-black/10 pt-4">
              <p className="text-xs font-bold text-black/60 uppercase mb-3">Datos del Fundador</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-black uppercase mb-1">Nombres</label>
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={e => setFormData({...formData, nombres: e.target.value})}
                    className="block w-full bg-white border-2 border-black/20 p-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-black uppercase mb-1">Apellidos</label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={e => setFormData({...formData, apellidos: e.target.value})}
                    className="block w-full bg-white border-2 border-black/20 p-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-black uppercase mb-1">Cédula</label>
                  <input
                    type="text"
                    value={formData.cedula}
                    onChange={e => setFormData({...formData, cedula: e.target.value})}
                    className="block w-full bg-white border-2 border-black/20 p-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-black uppercase mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="block w-full bg-white border-2 border-black/20 p-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-black uppercase mb-1">Email (Opcional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="block w-full bg-white border-2 border-black/20 p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-black uppercase mb-1">Sexo</label>
                  <select
                    value={formData.sexo}
                    onChange={e => setFormData({...formData, sexo: e.target.value})}
                    className="block w-full bg-white border-2 border-black/20 p-2 text-sm"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>
              </div>
            </div>

            {error && <div className="text-racing-red font-bold text-sm">{error}</div>}

            <button type="submit" className="w-full bg-primary text-white font-bold py-3 uppercase hover:brightness-110 text-sm sm:text-base">
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
      ) : networks.length === 0 ? (
        <div className="text-center py-8 bg-white/50 border-2 border-dashed border-black/20">
          <p className="text-black/60 font-bold uppercase">No hay redes creadas</p>
          <p className="text-sm text-black/40 mt-2">Crea la primera red con el botón "Nueva Red"</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {networks.map(network => (
          <Y2KWindow key={network.id} title={network.network_name || network.name} isStatic={true}>
            <div className="space-y-2 sm:space-y-3">
              {/* Network Stats */}
              <div className="flex justify-between items-center bg-primary/10 p-2 -mx-2 sm:-mx-4 -mt-2">
                <div className="text-center flex-1">
                  <p className="text-2xl sm:text-3xl font-black text-primary">{network.direct_referrals}</p>
                  <p className="text-[10px] sm:text-xs text-black/60 uppercase font-bold">Directos</p>
                </div>
                <div className="w-px h-10 bg-black/10"></div>
                <div className="text-center flex-1">
                  <p className="text-2xl sm:text-3xl font-black text-primary">{network.total_network_size}</p>
                  <p className="text-[10px] sm:text-xs text-black/60 uppercase font-bold">Total Red</p>
                </div>
              </div>

              <div className="flex justify-between border-b border-black/10 pb-2">
                <span className="text-[10px] sm:text-xs font-bold text-black/60 uppercase">Fundador</span>
                <span className="font-bold text-sm">{network.name}</span>
              </div>
              <div className="flex justify-between border-b border-black/10 pb-2">
                <span className="text-[10px] sm:text-xs font-bold text-black/60 uppercase">Cédula</span>
                <span className="text-sm">{network.cedula}</span>
              </div>
              <div className="flex justify-between border-b border-black/10 pb-2">
                <span className="text-[10px] sm:text-xs font-bold text-black/60 uppercase">Teléfono</span>
                <span className="text-sm">{network.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-black/10 pb-2">
                <span className="text-[10px] sm:text-xs font-bold text-black/60 uppercase">Estado</span>
                <div className="flex gap-1">
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase ${network.link_enabled ? 'bg-spring-green/20 text-green-800' : 'bg-racing-red/20 text-red-800'}`}>
                    Link {network.link_enabled ? 'ON' : 'OFF'}
                  </span>
                  {network.is_suspended && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-racing-red/20 text-red-800">
                      Suspendido
                    </span>
                  )}
                </div>
              </div>
              <div className="pt-2">
                <p className="text-[10px] sm:text-xs font-bold text-black/60 uppercase mb-1">Link de Referido</p>
                <div className="flex gap-2">
                    <input
                        readOnly
                        value={`${window.location.origin}?ref=${network.referral_code}`}
                        className="w-full text-xs p-2 bg-black/5 border border-black/10"
                    />
                    <button
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}?ref=${network.referral_code}`)}
                        className="bg-primary text-white px-2 sm:px-3 text-xs font-bold uppercase flex-shrink-0"
                    >
                        Copiar
                    </button>
                </div>
              </div>

              {/* View Network Button */}
              <button
                onClick={() => handleViewNetwork(network.id)}
                disabled={loadingVisualization}
                className="w-full mt-3 bg-pearl-aqua text-black font-bold py-2 uppercase hover:brightness-110 text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="4"/>
                  <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/>
                  <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/>
                  <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/>
                  <line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/>
                </svg>
                Ver Red de Nodos
              </button>
            </div>
          </Y2KWindow>
        ))}
      </div>
      )}

      {/* Network Visualization Modal */}
      {showVisualization && visualizationData && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
          {/* Header */}
          <div className="bg-primary text-white p-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold uppercase">{visualizationData.network_name}</h2>
              <p className="text-sm opacity-80">
                {visualizationData.total_nodes} miembros en la red
              </p>
            </div>
            <button
              onClick={() => {
                setShowVisualization(false);
                setVisualizationData(null);
              }}
              className="bg-white text-primary font-bold px-4 py-2 uppercase hover:bg-primary hover:text-white hover:border-white border-2 border-transparent transition-colors"
            >
              Cerrar
            </button>
          </div>

          {/* Graph Container */}
          <div className="flex-1 bg-white">
            <ReferralNetwork data={{ nodes: visualizationData.nodes, links: visualizationData.links }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkManagement;
