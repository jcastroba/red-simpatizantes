import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Y2KWindow from './Y2KWindow';
import ReferralNetwork from './ReferralNetwork';
import { API_URL } from '../config';

interface DashboardProps {
  token: string;
  onLogout: () => void;
}

interface Referral {
  id: number;
  nombres: string;
  apellidos: string;
  cedula: string;
  phone: string;
  email: string;
  created_at: string;
  referrals_count: number;
  sub_referrals?: Referral[];
}

// Componente para fila expandible de referido
const ReferralRow = ({
  referral,
  level = 0,
  onSelect
}: {
  referral: Referral;
  level?: number;
  onSelect: (ref: Referral) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = referral.sub_referrals && referral.sub_referrals.length > 0;

  return (
    <>
      <tr className={`border-b border-black/5 hover:bg-black/5 transition-colors ${level > 0 ? 'bg-black/[0.02]' : ''}`}>
        <td className="px-4 py-3 font-medium text-black">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
            {hasChildren ? (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-5 h-5 flex items-center justify-center bg-primary text-white text-xs font-bold rounded hover:bg-primary/80 transition-colors"
              >
                {expanded ? '−' : '+'}
              </button>
            ) : (
              <span className="w-5 h-5 flex items-center justify-center text-black/20">•</span>
            )}
            <span>{referral.nombres} {referral.apellidos}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-black/60">
          {referral.cedula || 'N/A'}
        </td>
        <td className="px-4 py-3 text-black/60">
          {referral.phone || 'N/A'}
        </td>
        <td className="px-4 py-3 text-center">
          <span className={`inline-block min-w-[24px] px-2 py-1 text-xs font-bold rounded ${referral.referrals_count > 0 ? 'bg-primary text-white' : 'bg-black/10 text-black/40'}`}>
            {referral.referrals_count}
          </span>
        </td>
        <td className="px-4 py-3">
          <button
            onClick={() => onSelect(referral)}
            className="text-xs font-bold text-primary hover:underline uppercase"
          >
            Ver
          </button>
        </td>
      </tr>
      {expanded && hasChildren && referral.sub_referrals?.map((sub, idx) => (
        <ReferralRow
          key={`${referral.id}-${idx}`}
          referral={sub}
          level={level + 1}
          onSelect={onSelect}
        />
      ))}
    </>
  );
};

// Componente para tarjeta móvil expandible
const ReferralCard = ({
  referral,
  level = 0,
  onSelect
}: {
  referral: Referral;
  level?: number;
  onSelect: (ref: Referral) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = referral.sub_referrals && referral.sub_referrals.length > 0;

  return (
    <div style={{ marginLeft: `${level * 12}px` }}>
      <div className={`bg-black/5 p-3 border border-black/10 ${level > 0 ? 'border-l-4 border-l-primary' : ''}`}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-6 h-6 flex items-center justify-center bg-primary text-white text-xs font-bold rounded"
              >
                {expanded ? '−' : '+'}
              </button>
            )}
            <div>
              <p className="font-bold text-sm text-black">{referral.nombres} {referral.apellidos}</p>
              <p className="text-xs text-black/60">{referral.cedula || 'Sin cédula'}</p>
            </div>
          </div>
          <span className={`text-xs px-2 py-1 font-bold ${referral.referrals_count > 0 ? 'bg-primary text-white' : 'bg-black/10 text-black/40'}`}>
            {referral.referrals_count} ref.
          </span>
        </div>
        <button
          onClick={() => onSelect(referral)}
          className="w-full text-xs font-bold text-primary bg-white py-2 border border-primary hover:bg-primary hover:text-white transition-colors uppercase"
        >
          Ver Detalle
        </button>
      </div>
      {expanded && hasChildren && (
        <div className="mt-2 space-y-2">
          {referral.sub_referrals?.map((sub, idx) => (
            <ReferralCard
              key={`${referral.id}-${idx}`}
              referral={sub}
              level={level + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Dashboard = ({ token, onLogout }: DashboardProps) => {
  const [data, setData] = useState<any>(null);
  const [networkData, setNetworkData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelLabels, setLevelLabels] = useState<Record<string, string>>({});
  const [levelLabelDrafts, setLevelLabelDrafts] = useState<Record<string, string>>({});
  const [editingLevelLabels, setEditingLevelLabels] = useState(false);
  const [savingLevelLabels, setSavingLevelLabels] = useState(false);

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

        try {
            const levelLabelResponse = await axios.get(`${API_URL}/auth/level-labels/`, {
                headers: { Authorization: `Token ${token}` }
            });
            const labels = levelLabelResponse.data?.level_labels || {};
            setLevelLabels(labels);
            setLevelLabelDrafts(labels);
        } catch (labelError) {
            console.error('Error fetching level labels', labelError);
        }

      } catch (error: any) {
        console.error('Error fetching dashboard data', error);
        alert(`Error cargando dashboard: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
      }
    };
    fetchData();
  }, [token, onLogout]);

  // Calcular estadísticas por nivel
  const levelStats = useMemo(() => {
    if (!networkData?.nodes) return { levels: {}, total: 0 };

    const levels: { [key: number]: number } = {};
    let total = 0;

    networkData.nodes.forEach((node: any) => {
      // Excluir el nodo "me" y "sponsor"
      if (node.type === 'referral' || node.type === 'root') {
        const level = node.level || 0;
        levels[level] = (levels[level] || 0) + 1;
        total++;
      }
    });

    return { levels, total };
  }, [networkData]);

  const orderedLevels = useMemo(() => {
    return Object.keys(levelStats.levels).sort((a, b) => Number(a) - Number(b));
  }, [levelStats.levels]);

  // Calcular total recursivo de referidos
  const calculateTotalReferrals = (referrals: Referral[]): number => {
    let total = 0;
    referrals.forEach(ref => {
      total += 1;
      if (ref.sub_referrals && ref.sub_referrals.length > 0) {
        total += calculateTotalReferrals(ref.sub_referrals);
      }
    });
    return total;
  };

  const totalInNetwork = useMemo(() => {
    if (!data?.referrals) return 0;
    return calculateTotalReferrals(data.referrals);
  }, [data]);

  // Filtrar referidos por búsqueda
  const filteredReferrals = useMemo(() => {
    if (!data?.referrals) return [];
    if (!searchTerm) return data.referrals;

    const searchLower = searchTerm.toLowerCase();

    const filterRecursive = (refs: Referral[]): Referral[] => {
      return refs.filter(ref => {
        const matches =
          ref.nombres.toLowerCase().includes(searchLower) ||
          ref.apellidos.toLowerCase().includes(searchLower) ||
          (ref.cedula && ref.cedula.includes(searchTerm));

        if (matches) return true;

        // También buscar en sub-referidos
        if (ref.sub_referrals && ref.sub_referrals.length > 0) {
          const filteredSubs = filterRecursive(ref.sub_referrals);
          return filteredSubs.length > 0;
        }

        return false;
      });
    };

    return filterRecursive(data.referrals);
  }, [data, searchTerm]);

  if (!data) return <div className="flex justify-center items-center h-screen bg-secondary text-primary font-bold">Cargando...</div>;

  return (
    <div className="bg-secondary min-h-screen p-2 sm:p-4 font-sans relative">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header con botón de cerrar sesión visible */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 sm:p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div>
                <h1 className="text-lg sm:text-xl font-black uppercase text-black">Hola, {data.nombres}</h1>
                <p className="text-xs sm:text-sm text-black/60">Bienvenido a tu panel de control</p>
            </div>
            <button
                onClick={onLogout}
                className="bg-red-600 text-white font-bold px-4 sm:px-6 py-2 sm:py-3 border-2 border-red-800 hover:bg-red-700 transition-colors uppercase text-xs sm:text-sm w-full sm:w-auto shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
            >
                Cerrar Sesion
            </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white border-2 border-black p-3 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-[10px] sm:text-xs font-bold uppercase text-black/60 mb-1">Referidos Directos</p>
                <p className="text-2xl sm:text-4xl font-black text-primary">{data.referrals_count}</p>
            </div>
            <div className="bg-white border-2 border-black p-3 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-[10px] sm:text-xs font-bold uppercase text-black/60 mb-1">Total en mi Red</p>
                <p className="text-2xl sm:text-4xl font-black text-hot-fucsia">{totalInNetwork}</p>
            </div>
            <div className="bg-white border-2 border-black p-3 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-[10px] sm:text-xs font-bold uppercase text-black/60 mb-1">Niveles</p>
                <p className="text-2xl sm:text-4xl font-black text-pearl-aqua">{Object.keys(levelStats.levels).length}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Link Card */}
            <div className="md:col-span-2">
                <Y2KWindow title="Tu Link de Referido" className="h-full" isStatic={true}>
                    <div className="space-y-3 sm:space-y-4">
                        <p className="text-xs sm:text-sm text-black">Comparte este enlace para invitar a mas personas a tu red:</p>
                        <div className="flex items-center gap-2">
                            <div className="bg-white border-2 border-black/10 p-2 sm:p-3 flex-grow font-mono text-[10px] sm:text-xs overflow-hidden text-ellipsis whitespace-nowrap">
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
                                className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border-2 border-transparent transition-colors flex-shrink-0 ${copied ? 'bg-pearl-aqua text-black border-black' : 'bg-white text-gray hover:border-black hover:bg-gray-200'}`}
                            >
                                {copied ? (
                                    <svg viewBox="0 0 24 24" width="16" height="16" className="sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" width="16" height="16" className="sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
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
                            className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-2 sm:py-3 font-bold uppercase text-xs sm:text-sm hover:bg-[#128C7E] transition-colors border-2 border-transparent"
                        >
                            Compartir en WhatsApp
                        </button>
                    </div>
                </Y2KWindow>
            </div>

            {/* Resumen por Niveles */}
            <div className="md:col-span-1">
                <Y2KWindow title="Resumen por Nivel" className="h-full" isStatic={true}>
                    <div className="space-y-2">
                        {orderedLevels.length > 0 ? (
                            <>
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] sm:text-xs font-bold uppercase text-black/60">Nombres de niveles</p>
                                    {!editingLevelLabels ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const drafts: Record<string, string> = {};
                                                orderedLevels.forEach((level) => {
                                                    drafts[level] = levelLabels[level] || '';
                                                });
                                                setLevelLabelDrafts(drafts);
                                                setEditingLevelLabels(true);
                                            }}
                                            className="text-[10px] sm:text-xs font-bold text-primary hover:underline uppercase"
                                        >
                                            Editar
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                disabled={savingLevelLabels}
                                                onClick={async () => {
                                                    setSavingLevelLabels(true);
                                                    try {
                                                        const payload: Record<string, string> = {};
                                                        orderedLevels.forEach((level) => {
                                                            payload[level] = (levelLabelDrafts[level] || '').trim();
                                                        });
                                                        const response = await axios.put(
                                                            `${API_URL}/auth/level-labels/`,
                                                            { level_labels: payload },
                                                            { headers: { Authorization: `Token ${token}` } }
                                                        );
                                                        const updated = response.data?.level_labels || {};
                                                        setLevelLabels(updated);
                                                        setLevelLabelDrafts(updated);
                                                        setEditingLevelLabels(false);
                                                    } catch (error: any) {
                                                        console.error('Error saving level labels', error);
                                                        alert(`Error guardando nombres: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
                                                    } finally {
                                                        setSavingLevelLabels(false);
                                                    }
                                                }}
                                                className="text-[10px] sm:text-xs font-bold text-white bg-primary px-2 py-1 uppercase disabled:opacity-60"
                                            >
                                                Guardar
                                            </button>
                                            <button
                                                type="button"
                                                disabled={savingLevelLabels}
                                                onClick={() => {
                                                    setLevelLabelDrafts(levelLabels);
                                                    setEditingLevelLabels(false);
                                                }}
                                                className="text-[10px] sm:text-xs font-bold text-black/60 hover:underline uppercase disabled:opacity-60"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {editingLevelLabels && (
                                    <p className="text-[10px] text-black/40 italic">Deja vacÃ­o para usar "Nivel X".</p>
                                )}
                                {orderedLevels.map((level) => (
                                    <div key={level} className="flex justify-between items-center bg-black/5 p-2 border-l-4 border-primary">
                                        {editingLevelLabels ? (
                                            <input
                                                type="text"
                                                value={levelLabelDrafts[level] || ''}
                                                onChange={(e) => {
                                                    const next = { ...levelLabelDrafts };
                                                    next[level] = e.target.value;
                                                    setLevelLabelDrafts(next);
                                                }}
                                                placeholder={`Nivel ${level}`}
                                                className="text-xs sm:text-sm font-bold text-black bg-white border border-black/20 px-2 py-1 w-40"
                                            />
                                        ) : (
                                            <span className="text-xs sm:text-sm font-bold text-black">
                                                {levelLabels[level] ? levelLabels[level] : `Nivel ${level}`}
                                            </span>
                                        )}
                                        <span className="text-sm sm:text-base font-black text-primary">{levelStats.levels[Number(level)]}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center bg-primary/10 p-2 border-2 border-primary mt-3">
                                    <span className="text-xs sm:text-sm font-bold text-black uppercase">Total Red</span>
                                    <span className="text-lg sm:text-xl font-black text-primary">{levelStats.total}</span>
                                </div>
                            </>
                        ) : (
                            <p className="text-xs text-black/40 italic text-center py-4">Sin datos de niveles</p>
                        )}
                    </div>
                </Y2KWindow>
            </div>

            {/* Network Visualization */}
            <div className="md:col-span-3 h-[300px] sm:h-[500px]">
                <Y2KWindow title="Mi Red de Referidos" className="h-full" isStatic={true}>
                    {networkData ? (
                        <ReferralNetwork data={networkData} />
                    ) : (
                        <div className="flex justify-center items-center h-full text-sm">Cargando red...</div>
                    )}
                </Y2KWindow>
            </div>

            {/* Referrals List Card */}
            <div className="md:col-span-3">
                <Y2KWindow title="Mis Referidos (Expandible)" className="h-full" isStatic={true}>
                    <div className="mb-3 sm:mb-4">
                        <input
                            type="text"
                            placeholder="Buscar por nombre o cedula..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 border-2 border-black/10 focus:border-primary outline-none text-xs sm:text-sm"
                        />
                    </div>

                    <p className="text-xs text-black/60 mb-3">
                        Haz clic en <span className="inline-flex items-center justify-center w-4 h-4 bg-primary text-white text-[10px] font-bold rounded">+</span> para expandir y ver los referidos de cada persona.
                    </p>

                    {filteredReferrals && filteredReferrals.length > 0 ? (
                        <>
                            {/* Mobile Card Layout */}
                            <div className="sm:hidden space-y-3 max-h-[500px] overflow-y-auto">
                                {filteredReferrals.map((ref: Referral, index: number) => (
                                    <ReferralCard
                                        key={index}
                                        referral={ref}
                                        onSelect={setSelectedReferral}
                                    />
                                ))}
                            </div>

                            {/* Desktop Table Layout */}
                            <div className="hidden sm:block overflow-x-auto max-h-[500px]">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-black/5 text-black/60 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2">Nombre</th>
                                            <th className="px-4 py-2">Cedula</th>
                                            <th className="px-4 py-2">Telefono</th>
                                            <th className="px-4 py-2 text-center">Referidos</th>
                                            <th className="px-4 py-2">Accion</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredReferrals.map((ref: Referral, index: number) => (
                                            <ReferralRow
                                                key={index}
                                                referral={ref}
                                                onSelect={setSelectedReferral}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-6 sm:py-8 text-black/40 italic text-sm">
                            {searchTerm ? 'No se encontraron resultados' : '¡Aun no tienes referidos. Comparte tu enlace!'}
                        </div>
                    )}
                </Y2KWindow>
            </div>
        </div>
      </div>

      {/* Selected Referral Detail Modal */}
      {selectedReferral && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <Y2KWindow
              title="Detalle de Referido"
              onClose={() => setSelectedReferral(null)}
              className="max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
              <div className="space-y-4 sm:space-y-6">
                  <div className="space-y-3 sm:space-y-4">
                      <div>
                          <p className="font-bold text-black/60 text-[10px] sm:text-xs uppercase">Nombre Completo</p>
                          <p className="font-bold text-base sm:text-lg">{selectedReferral.nombres} {selectedReferral.apellidos}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div>
                              <p className="font-bold text-black/60 text-[10px] sm:text-xs uppercase">Cedula</p>
                              <p className="text-sm">{selectedReferral.cedula}</p>
                          </div>
                          <div>
                              <p className="font-bold text-black/60 text-[10px] sm:text-xs uppercase">Telefono</p>
                              <p className="text-sm">{selectedReferral.phone}</p>
                          </div>
                      </div>
                      <div>
                          <p className="font-bold text-black/60 text-[10px] sm:text-xs uppercase">Correo Electronico</p>
                          <p className="break-all text-sm">{selectedReferral.email || 'No registrado'}</p>
                      </div>
                      <div>
                          <p className="font-bold text-black/60 text-[10px] sm:text-xs uppercase">Fecha de Registro</p>
                          <p className="text-sm">{new Date(selectedReferral.created_at).toLocaleString()}</p>
                      </div>
                  </div>

                  {/* Sub-referrals Section */}
                  <div className="border-t-2 border-black/10 pt-3 sm:pt-4">
                      <h3 className="font-bold text-black uppercase text-xs sm:text-sm mb-3 flex justify-between items-center">
                          <span>Referidos de {selectedReferral.nombres}</span>
                          <span className="bg-primary text-white text-[10px] sm:text-xs px-2 py-0.5">{selectedReferral.referrals_count}</span>
                      </h3>

                      {selectedReferral.sub_referrals && selectedReferral.sub_referrals.length > 0 ? (
                          <div className="bg-black/5 p-2 max-h-32 sm:max-h-40 overflow-y-auto border-2 border-black/5">
                              <ul className="space-y-2">
                                  {selectedReferral.sub_referrals.map((sub: any, idx: number) => (
                                      <li key={idx} className="bg-white p-2 text-xs sm:text-sm border border-black/5 flex justify-between items-center">
                                          <div>
                                              <span className="font-bold block">{sub.nombres} {sub.apellidos}</span>
                                              <span className="text-[10px] sm:text-xs text-black/60">{sub.cedula}</span>
                                          </div>
                                          <span className="text-[10px] sm:text-xs text-black/40">{new Date(sub.created_at).toLocaleDateString()}</span>
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      ) : (
                          <p className="text-xs sm:text-sm text-black/40 italic">Este usuario aun no tiene referidos.</p>
                      )}
                  </div>
              </div>
          </Y2KWindow>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
