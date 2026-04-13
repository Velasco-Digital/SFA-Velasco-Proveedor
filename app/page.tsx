'use client'
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PlusCircle, MapPin, QrCode, Truck, Users, LayoutDashboard } from 'lucide-react';

export default function SFADashboard() {
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar tiendas desde el "Servidor Maestro"
  async function cargarTiendas() {
    const { data, error } = await supabase.from('sfa_tiendas').select('*');
    if (data) setTiendas(data);
    setLoading(false);
  }

  useEffect(() => { cargarTiendas(); }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24">
      {/* Header Premium */}
      <header className="p-6 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black tracking-tighter text-blue-500">VD SFA</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Logística de Distribución</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full transition-all active:scale-90">
            <PlusCircle size={24} />
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Tarjetas de Resumen */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl">
            <p className="text-zinc-500 text-xs font-bold uppercase mb-1">Tiendas</p>
            <p className="text-3xl font-black">{tiendas.length}</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl">
            <p className="text-zinc-500 text-xs font-bold uppercase mb-1">En Ruta</p>
            <p className="text-3xl font-black text-blue-500">0</p>
          </div>
        </div>

        {/* Sección de Gestión */}
        <section>
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Clientes Registrados</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : tiendas.length === 0 ? (
            <div className="bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-3xl p-10 text-center">
              <QrCode size={40} className="mx-auto text-zinc-700 mb-3" />
              <p className="text-zinc-500 text-sm">No hay tiendas en el sistema.</p>
              <button className="mt-4 text-blue-500 text-xs font-bold underline">REGISTRAR PRIMERA TIENDA</button>
            </div>
          ) : (
            <div className="space-y-3">
              {tiendas.map((t: any) => (
                <div key={t.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center active:bg-zinc-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/10 p-2 rounded-xl text-blue-500">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{t.nombre_tienda}</h3>
                      <p className="text-[10px] text-zinc-500">{t.dueno || 'Sin dueño asignado'}</p>
                    </div>
                  </div>
                  <QrCode size={18} className="text-zinc-600" />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Menú de Navegación Inferior Estilo App */}
      <nav className="fixed bottom-6 left-4 right-4 bg-zinc-900/80 backdrop-blur-lg border border-zinc-800 p-2 rounded-3xl flex justify-around items-center shadow-2xl">
        <button className="p-3 text-blue-500 flex flex-col items-center">
          <LayoutDashboard size={20} />
          <span className="text-[9px] font-bold mt-1">Panel</span>
        </button>
        <button className="p-3 text-zinc-500 flex flex-col items-center">
          <Truck size={20} />
          <span className="text-[9px] font-bold mt-1">Rutas</span>
        </button>
        <button className="p-3 text-zinc-500 flex flex-col items-center">
          <Users size={20} />
          <span className="text-[9px] font-bold mt-1">Equipo</span>
        </button>
      </nav>
    </div>
  );
}
