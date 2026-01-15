import Y2KWindow from '../Y2KWindow';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-primary uppercase mb-6">Dashboard General</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Y2KWindow title="Resumen" isStatic={true}>
          <div className="p-4 text-center">
            <p className="text-black/60 font-bold uppercase text-sm">Bienvenido al sistema de administración</p>
            <p className="mt-4">Selecciona un módulo en el menú lateral para comenzar.</p>
          </div>
        </Y2KWindow>
      </div>
    </div>
  );
};

export default AdminDashboard;
