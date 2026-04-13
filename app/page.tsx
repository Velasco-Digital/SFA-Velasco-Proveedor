'use client'
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PlusCircle, MapPin, QrCode, Truck, Users, LayoutDashboard, X, Save } from 'lucide-react';

export default function SFADashboard() {
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado para la nueva tienda
  const [nombre, setNombre] = useState('');
  const [dueno, setDueno] = useState('');
  const [direccion, setDireccion] = useState('');

  async function cargarTiendas() {
    setLoading(true);
    const { data, error } = await supabase.from('sfa_tiendas').select('*').order('created_at', { ascending: false });
    if (data) setTiendas(data);
    setLoading(false);
  }

  useEffect(() => { cargarTiendas(); }, []);

  async function registrarTienda(e: React.FormEvent) {
    e.preventDefault();
    const codigoGenerado = `QR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const { data, error } = await supabase.from('sfa_tiendas').insert([
      { 
        nombre_tienda: nombre, 
        dueno: dueno, 
        direccion: direccion,
        codigo_qr: codigoGenerado 
      }
    ]);

    if (error) {
      alert("Error al registrar: " + error.message);
    } else {
      setNombre(''); setDueno(''); setDireccion('');
      setIsModalOpen(false);
      cargarTiendas(); // Recargar la lista
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24">
      {/* Header */}
      <header className="p-6 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black tracking-tighter text-blue-500">VD SFA</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Velasco Digital</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full transition-all active:scale-90 shadow-lg shadow-blue-900/20"
          >
            <PlusCircle size={24} />
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl">
            <p className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Total Tiendas</p>
            <p className="text-3xl font-black">{tiendas.length}</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl">
            <p className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Rutas Activas</p>
            <p className="text-3xl font-black text-blue-500">0</p>
          </div>
        </div>

        {/* Lista de Tiendas */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 px-2">Gestión de Clientes</h2>
          
          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
          ) : tiendas.length === 0 ? (
            <div className="bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-3xl p-10 text-center">
              <p className="text-zinc-500 text-sm">No hay tiendas registradas.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {tiendas.map((t) => (
                <div key={t.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/10 p-2 rounded-xl text-blue-500"><MapPin size={20} /></div>
                    <div>
                      <h3 className="font-bold text-sm">{t.nombre_tienda}</h3>
                      <p className="text-[10px] text-zinc-500">{t.direccion || 'Sin dirección'}</p>
                    </div>
                  </div>
                  <div className="text-zinc-600 font-mono text-[10px]">{t.codigo_qr}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* MODAL DE REGISTRO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-zinc-800 p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Nueva Tienda</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500"><X /></button>
            </div>
            
            <form onSubmit={registrarTienda} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Nombre del Negocio</label>
                <input required value={nombre} onChange={(e) => setNombre(e.target.value)} type="text" className="w-full bg-black border border-zinc-800 rounded-xl p-3 mt-1 focus:border-blue-500 outline-none" placeholder="Ej. Abarrotes Doña Mari" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Dueño / Encargado</label>
                <input value={dueno} onChange={(e) => setDueno(e.target.value)} type="text" className="w-full bg-black border border-zinc-800 rounded-xl p-3 mt-1 focus:border-blue-500 outline-none" placeholder="Nombre de la persona" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Dirección / Referencia</label>
                <input value={direccion} onChange={(e) => setDireccion(e.target.value)} type="text" className="w-full bg-black border border-zinc-800 rounded-xl p-3 mt-1 focus:border-blue-500 outline-none" placeholder="Calle, número, colonia..." />
              </div>
              
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-4 rounded-xl flex items-center justify-center gap-2 mt-4 transition-all active:scale-95">
                <Save size={20} /> Guardar Tienda
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Nav Inferior */}
      <nav className="fixed bottom-6 left-4 right-4 bg-zinc-900/80 backdrop-blur-lg border border-zinc-800 p-2 rounded-3xl flex justify-around items-center shadow-2xl z-40">
        <button className="p-3 text-blue-500 flex flex-col items-center"><LayoutDashboard size={20} /><span className="text-[9px] font-bold mt-1">Panel</span></button>
        <button className="p-3 text-zinc-500 flex flex-col items-center"><Truck size={20} /><span className="text-[9px] font-bold mt-1">Rutas</span></button>
        <button className="p-3 text-zinc-500 flex flex-col items-center"><Users size={20} /><span className="text-[9px] font-bold mt-1">Equipo</span></button>
      </nav>
    </div>
  );
}
