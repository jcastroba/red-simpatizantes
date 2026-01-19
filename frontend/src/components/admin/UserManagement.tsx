import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Y2KWindow from '../Y2KWindow';
import { API_URL } from '../../config';

interface UserManagementProps {
  token: string;
}

const UserManagement = ({ token }: UserManagementProps) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/users/`, {
        headers: { Authorization: `Token ${token}` },
        params: { q: search, page }
      });
      setUsers(response.data.results);
      setTotalPages(response.data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, page, token]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchUsers]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;
    try {
      await axios.delete(`${API_URL}/admin/users/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      fetchUsers();
      setSelectedUser(null);
    } catch (err) {
      alert('Error al eliminar usuario');
    }
  };

  const handleToggleLink = async (id: number) => {
    try {
      await axios.post(`${API_URL}/admin/users/${id}/toggle-link/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      fetchUsers();
      if (selectedUser && selectedUser.id === id) {
        setSelectedUser((prev: any) => ({ ...prev, link_enabled: !prev.link_enabled }));
      }
    } catch (err) {
      alert('Error al cambiar estado del link');
    }
  };

  const handleToggleSuspension = async (id: number) => {
    try {
      await axios.post(`${API_URL}/admin/users/${id}/toggle-suspension/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      fetchUsers();
      if (selectedUser && selectedUser.id === id) {
        setSelectedUser((prev: any) => ({ ...prev, is_active: !prev.is_active }));
      }
    } catch (err) {
      alert('Error al cambiar estado de suspensión');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-3xl font-black text-primary uppercase">Gestión de Usuarios</h2>

      <div className="flex gap-2 sm:gap-4">
        <input
          type="text"
          placeholder="Buscar por nombre, apellido o cédula..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 p-2 sm:p-3 border-2 border-black/20 shadow-inner text-sm"
        />
      </div>

      {/* Mobile Card Layout */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8">No se encontraron usuarios</div>
        ) : (
          users.map(user => (
            <div key={user.id} className="bg-white border-2 border-black/10 p-3 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-sm">
                    {user.nombres} {user.apellidos}
                    {!user.referrer && (
                      <span className="ml-1 inline-block bg-primary text-white text-[8px] px-1 py-0.5 rounded uppercase font-bold">Líder</span>
                    )}
                  </p>
                  <p className="text-xs text-black/60">{user.cedula}</p>
                  <p className="text-xs text-black/60">{user.phone}</p>
                </div>
                <button
                  onClick={() => setSelectedUser(user)}
                  className="p-2 hover:bg-black/10 rounded-full"
                  title="Ver Detalles"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                  </svg>
                </button>
              </div>
              <div className="flex gap-1 flex-wrap">
                <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase ${user.link_enabled ? 'bg-spring-green/20 text-green-800' : 'bg-racing-red/20 text-red-800'}`}>
                  Link: {user.link_enabled ? 'ON' : 'OFF'}
                </span>
                <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase ${user.has_account ? (user.is_active ? 'bg-cerulean/20 text-cerulean' : 'bg-racing-red/20 text-racing-red') : 'bg-black/10 text-black/40'}`}>
                  {user.has_account ? (user.is_active ? 'Activa' : 'Suspendida') : 'Sin cuenta'}
                </span>
                {user.network_display_name && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-primary/10 text-primary">
                    {user.network_display_name}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block bg-white border-2 border-black/10 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black/5 text-black/60 uppercase text-xs font-bold">
              <tr>
                <th className="p-3 sm:p-4 border-b border-black/10">Nombre</th>
                <th className="p-3 sm:p-4 border-b border-black/10">Cédula</th>
                <th className="p-3 sm:p-4 border-b border-black/10">Teléfono</th>
                <th className="p-3 sm:p-4 border-b border-black/10">Red</th>
                <th className="p-3 sm:p-4 border-b border-black/10">Estado</th>
                <th className="p-3 sm:p-4 border-b border-black/10 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center">Cargando...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center">No se encontraron usuarios</td></tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="border-b border-black/5 hover:bg-black/5 transition-colors">
                    <td className="p-3 sm:p-4 font-medium text-sm">
                      {user.nombres} {user.apellidos}
                      {!user.referrer && (
                          <span className="ml-2 inline-block bg-primary text-white text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Líder</span>
                      )}
                    </td>
                    <td className="p-3 sm:p-4 text-sm">{user.cedula}</td>
                    <td className="p-3 sm:p-4 text-sm">{user.phone}</td>
                    <td className="p-3 sm:p-4 text-xs">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 font-bold">
                        {user.network_display_name || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex flex-col gap-1">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase w-fit ${user.link_enabled ? 'bg-spring-green/20 text-green-800' : 'bg-racing-red/20 text-red-800'}`}>
                          Link: {user.link_enabled ? 'ON' : 'OFF'}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase w-fit ${user.has_account ? (user.is_active ? 'bg-cerulean/20 text-cerulean' : 'bg-racing-red/20 text-racing-red') : 'bg-black/10 text-black/40'}`}>
                          Cuenta: {user.has_account ? (user.is_active ? 'Activa' : 'Suspendida') : 'No Reg.'}
                          </span>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 text-center">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="w-8 h-8 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors mx-auto"
                        title="Ver Detalles"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="5" cy="12" r="2" />
                          <circle cx="19" cy="12" r="2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-1 sm:gap-2 flex-wrap">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
          className="px-3 sm:px-4 py-2 border-2 border-black/10 disabled:opacity-50 hover:bg-black/5 text-xs sm:text-sm"
        >
          Anterior
        </button>
        <span className="px-2 sm:px-4 py-2 font-bold text-xs sm:text-sm">Pág. {page}/{totalPages}</span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(p => p + 1)}
          className="px-3 sm:px-4 py-2 border-2 border-black/10 disabled:opacity-50 hover:bg-black/5 text-xs sm:text-sm"
        >
          Siguiente
        </button>
      </div>

      {/* Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <Y2KWindow title="Gestión de Usuario" onClose={() => setSelectedUser(null)} className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="space-y-4 sm:space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-black/10 pb-3 sm:pb-4 gap-2">
                  <div>
                      <h3 className="text-base sm:text-xl font-black uppercase text-primary">{selectedUser.nombres} {selectedUser.apellidos}</h3>
                      <p className="text-xs sm:text-sm text-black/60 font-mono">{selectedUser.cedula}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {!selectedUser.referrer && (
                        <div className="bg-primary text-white px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-sm">
                            Líder de Red
                        </div>
                    )}
                    {selectedUser.network_display_name && (
                        <div className="bg-primary/10 text-primary px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold uppercase">
                            {selectedUser.network_display_name}
                        </div>
                    )}
                  </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-y-3 sm:gap-y-4 gap-x-4 sm:gap-x-8 text-xs sm:text-sm">
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-black/40 uppercase mb-1">Teléfono</p>
                  <p className="font-medium">{selectedUser.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-black/40 uppercase mb-1">Email</p>
                  <p className="font-medium break-all">{selectedUser.email || 'No registrado'}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-black/40 uppercase mb-1">Ubicación</p>
                  <p className="font-medium">{selectedUser.municipio_name || 'N/A'}, {selectedUser.department_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-black/40 uppercase mb-1">Sexo</p>
                  <p className="font-medium">{selectedUser.sexo === 'M' ? 'Masculino' : selectedUser.sexo === 'F' ? 'Femenino' : 'Otro'}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-black/40 uppercase mb-1">Código Referido</p>
                  <p className="font-mono bg-black/5 inline-block px-2 py-0.5 rounded text-xs">{selectedUser.referral_code}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-black/40 uppercase mb-1">Referido Por</p>
                  <p className="font-medium">{selectedUser.referrer_name || 'N/A (Fundador)'}</p>
                </div>
              </div>

              {/* Actions Section */}
              <div className="space-y-3 pt-3 sm:pt-4 border-t-2 border-black/10">
                  <p className="text-[10px] sm:text-xs font-black text-black/40 uppercase tracking-widest mb-2">Acciones de Control</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                      {/* Link Toggle */}
                      <button
                          onClick={() => handleToggleLink(selectedUser.id)}
                          className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 font-bold uppercase text-xs sm:text-sm border-2 transition-all active:scale-95 ${
                              selectedUser.link_enabled
                              ? 'bg-white text-black border-black/20 hover:bg-black/5'
                              : 'bg-spring-green text-black border-spring-green hover:brightness-110 shadow-md'
                          }`}
                      >
                          <span className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${selectedUser.link_enabled ? 'bg-racing-red' : 'bg-white'}`}></span>
                          {selectedUser.link_enabled ? 'Desactivar Link' : 'Activar Link'}
                      </button>

                      {/* Suspension Toggle */}
                      <button
                          disabled={!selectedUser.has_account}
                          onClick={() => handleToggleSuspension(selectedUser.id)}
                          className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 font-bold uppercase text-xs sm:text-sm border-2 transition-all active:scale-95 ${
                              !selectedUser.has_account
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : selectedUser.is_active
                                  ? 'bg-white text-black border-black/20 hover:bg-black/5'
                                  : 'bg-cerulean text-white border-cerulean hover:brightness-110 shadow-md'
                          }`}
                      >
                          <span className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${!selectedUser.has_account ? 'bg-gray-300' : selectedUser.is_active ? 'bg-black/40' : 'bg-white'}`}></span>
                          {!selectedUser.has_account ? 'Sin Cuenta' : selectedUser.is_active ? 'Suspender' : 'Reactivar'}
                      </button>
                  </div>

                  {/* Danger Zone */}
                  <button
                      onClick={() => handleDelete(selectedUser.id)}
                      className="w-full mt-2 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 bg-racing-red/10 text-racing-red border-2 border-racing-red/20 font-bold uppercase text-xs sm:text-sm hover:bg-racing-red hover:text-white transition-colors"
                  >
                      Eliminar Usuario
                  </button>
              </div>
            </div>
          </Y2KWindow>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
