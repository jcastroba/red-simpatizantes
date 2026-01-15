import { useEffect, useState } from 'react';
import axios from 'axios';
import Y2KWindow from './Y2KWindow';
import ReferralNetwork from './ReferralNetwork';
import { API_URL } from '../config';

interface DashboardProps {
  token: string;
  onLogout: () => void;
}

const Dashboard = ({ token, onLogout }: DashboardProps) => {
  const [data, setData] = useState<any>(null);
  const [networkData, setNetworkData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/dashboard/`, {
          headers: { Authorization: `Token ${token}` }
        });
        setData(response.data);

        const networkResponse = await axios.get(`${API_URL}/auth/network/`, {
            headers: { Authorization: `Token ${token}` }
        });
        setNetworkData(networkResponse.data);

      } catch (error: any) {
        console.error('Error fetching dashboard data', error);
        // onLogout(); // Comentado para depuración
        alert(`Error cargando dashboard: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
      }
    };
    fetchData();
  }, [token, onLogout]);

  if (!data) return <div className="flex justify-center items-center h-screen bg-secondary text-primary font-bold">Cargando...</div>;

  return (
    <div className="bg-secondary min-h-screen p-4 font-sans relative">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white/80 backdrop-blur-md p-4 border-2 border-white shadow-lg">
            <div>
                <h1 className="text-xl font-black uppercase text-black">Hola, {data.nombres}</h1>
                <p className="text-sm text-black/60">Bienvenido a tu panel de control</p>
            </div>
            <button 
                onClick={onLogout}
                className="bg-racing-red text-white font-bold px-4 py-2 border-2 border-white hover:bg-red-700 transition-colors uppercase text-sm"
            >
                Cerrar Sesión
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stats Card */}
            <div className="md:col-span-1">
                <Y2KWindow title="Estadísticas" className="h-full" isStatic={true}>
                    <div className="text-center py-8">
                        <p className="text-sm font-bold uppercase text-black/60 mb-2">Total Referidos</p>
                        <p className="text-6xl font-black text-primary drop-shadow-sm">{data.referrals_count}</p>
                    </div>
                </Y2KWindow>
            </div>

            {/* Link Card */}
            <div className="md:col-span-2">
                <Y2KWindow title="Tu Link de Referido" className="h-full" isStatic={true}>
                    <div className="space-y-4">
                        <p className="text-sm text-black">Comparte este enlace para invitar a más personas a tu red:</p>
                        <div className="flex items-center gap-2">
                            <div className="bg-white border-2 border-black/10 p-3 flex-grow font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                            {`${window.location.origin}?ref=${data.referral_code}`}
                            </div>
                            <button
                                title="Copiar URL"
                                onClick={() => {
                                const url = `${window.location.origin}?ref=${data.referral_code}`;
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
                            const url = `${window.location.origin}?ref=${data.referral_code}`;
                            const text = `¡Únete a mi red! Regístrate aquí: ${url}`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 font-bold uppercase text-sm hover:bg-[#128C7E] transition-colors border-2 border-transparent"
                        >
                            Compartir en WhatsApp
                        </button>
                    </div>
                </Y2KWindow>
            </div>

            {/* Network Visualization */}
            <div className="md:col-span-3 h-[500px]">
                <Y2KWindow title="Mi Red de Referidos" className="h-full" isStatic={true}>
                    {networkData ? (
                        <ReferralNetwork data={networkData} />
                    ) : (
                        <div className="flex justify-center items-center h-full">Cargando red...</div>
                    )}
                </Y2KWindow>
            </div>

            {/* Referrals List Card */}
            <div className="md:col-span-3">
                <Y2KWindow title="Mis Referidos" className="h-full" isStatic={true}>
                    <div className="mb-4">
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre o cédula..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 border-2 border-black/10 focus:border-hot-fucsia outline-none text-sm"
                        />
                    </div>
                    {data.referrals && data.referrals.length > 0 ? (
                        <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-black/5 text-black/60 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2">Nombre</th>
                                        <th className="px-4 py-2">Cédula</th>
                                        <th className="px-4 py-2">Referidos</th>
                                        <th className="px-4 py-2">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.referrals
                                        .filter((ref: any) => 
                                            ref.nombres.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                            ref.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (ref.cedula && ref.cedula.includes(searchTerm))
                                        )
                                        .map((ref: any, index: number) => (
                                        <tr key={index} className="border-b border-black/5 hover:bg-black/5 transition-colors">
                                            <td className="px-4 py-3 font-medium text-black">
                                                {ref.nombres} {ref.apellidos}
                                            </td>
                                            <td className="px-4 py-3 text-black/60">
                                                {ref.cedula || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-black/60 font-mono">
                                                {ref.referrals_count}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button 
                                                    onClick={() => setSelectedReferral(ref)}
                                                    className="text-xs font-bold text-primary hover:underline uppercase"
                                                >
                                                    Ver Detalle
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-black/40 italic">
                            Aún no tienes referidos. ¡Comparte tu enlace!
                        </div>
                    )}
                </Y2KWindow>
            </div>
        </div>
      </div>

      {/* Selected Referral Detail Modal */}
      {selectedReferral && (
        <Y2KWindow 
            title="Detalle de Referido" 
            onClose={() => setSelectedReferral(null)}
            className="max-w-lg"
        >
            <div className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <p className="font-bold text-black/60 text-xs uppercase">Nombre Completo</p>
                        <p className="font-bold text-lg">{selectedReferral.nombres} {selectedReferral.apellidos}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="font-bold text-black/60 text-xs uppercase">Cédula</p>
                            <p>{selectedReferral.cedula}</p>
                        </div>
                        <div>
                            <p className="font-bold text-black/60 text-xs uppercase">Teléfono</p>
                            <p>{selectedReferral.phone}</p>
                        </div>
                    </div>
                    <div>
                        <p className="font-bold text-black/60 text-xs uppercase">Correo Electrónico</p>
                        <p className="break-all">{selectedReferral.email}</p>
                    </div>
                    <div>
                        <p className="font-bold text-black/60 text-xs uppercase">Fecha de Registro</p>
                        <p>{new Date(selectedReferral.created_at).toLocaleString()}</p>
                    </div>
                </div>

                {/* Sub-referrals Section */}
                <div className="border-t-2 border-black/10 pt-4">
                    <h3 className="font-bold text-black uppercase text-sm mb-3 flex justify-between items-center">
                        <span>Referidos de {selectedReferral.nombres}</span>
                        <span className="bg-hot-fucsia text-white text-xs px-2 py-0.5 rounded-full">{selectedReferral.referrals_count}</span>
                    </h3>
                    
                    {selectedReferral.sub_referrals && selectedReferral.sub_referrals.length > 0 ? (
                        <div className="bg-black/5 p-2 max-h-40 overflow-y-auto border-2 border-black/5">
                            <ul className="space-y-2">
                                {selectedReferral.sub_referrals.map((sub: any, idx: number) => (
                                    <li key={idx} className="bg-white p-2 text-sm border border-black/5 flex justify-between items-center">
                                        <div>
                                            <span className="font-bold block">{sub.nombres} {sub.apellidos}</span>
                                            <span className="text-xs text-black/60">{sub.cedula}</span>
                                        </div>
                                        <span className="text-xs text-black/40">{new Date(sub.created_at).toLocaleDateString()}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="text-sm text-black/40 italic">Este usuario aún no tiene referidos.</p>
                    )}
                </div>
            </div>
        </Y2KWindow>
      )}
    </div>
  );
};

export default Dashboard;
