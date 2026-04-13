'use client'
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PlusCircle, MapPin, QrCode, Truck, Users, LayoutDashboard, X, Save, Navigation, Edit2, Phone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function SFADashboard() {
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTienda, setSelectedTienda] = useState<any>(null);
  
  // Estado para el formulario (Sirve para Nuevo y Editar)
  const [editId, setEditId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [dueno, setDueno] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [coords, setCoords] = useState({ lat: null, lng: null });

  async function cargarTiendas() {
    setLoading(true);
    const { data } = await supabase.from('sfa_tiendas').select('*').order('created_at', { ascending: false });
    if (data) setTiendas(data);
    setLoading(false);
  }

  useEffect(() => { cargarTiendas(); }, []);

  const obtenerUbicacion = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setCoords({ lat: pos.coords.latitude as any, lng: pos.coords.longitude as any });
    }, () => alert("Activa el GPS, viejo"));
  };

  // Función para abrir el modal en modo EDICIÓN
  const prepararEdicion = (tienda: any) => {
    setEditId(tienda.id);
    setNombre(tienda.nombre_tienda);
    setDueno(tienda.dueno || '');
    setTelefono(tienda.telefono || '');
    setDireccion(tienda.direccion || '');
    setCoords({ lat: tienda.latitud, lng: tienda.longitud });
    setIsModalOpen(true);
  };

  // Función para limpiar y abrir modal en modo NUEVO
  const nuevoRegistro = () => {
    setEditId(null);
    setNombre(''); setDueno(''); setTelefono(''); setDireccion('');
    setCoords({ lat: null, lng: null });
    setIsModalOpen(true);
  };

  async function guardarTienda(e: React.FormEvent) {
    e.preventDefault();
    
    const payload = { 
      nombre_tienda: nombre, 
      dueno: dueno, 
      telefono: telefono,
      direccion: direccion,
      latitud: coords.lat,
      longitud: coords.lng
    };

    if (editId) {
      // ACTUALIZAR TIENDA EXISTENTE
      const { error } = await supabase.from('sfa_tiendas').update(payload).eq('id', editId);
      if (error) alert(error.message);
    } else {
      // CREAR NUEVA TIENDA
      const codigoGenerado = `SFA-${Math.random().toString(36).substr(2, 7).toUpperCase()}`;
      const { error } = await supabase.from('sfa_tiendas').insert([{ ...payload, codigo_qr: codigoGenerado }]);
      if (error) alert(error.message);
    }

    setIsModalOpen(false);
    cargarTiendas();
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-sans">
      <header className="p-6 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-black text-blue-500 tracking-tighter">VD SFA</h1>
          <button onClick={nuevoRegistro} className="bg-blue-600 p-2 rounded-full active:scale-90 shadow-lg shadow-blue-500/20">
            <PlusCircle size={24} />
          </button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Listado */}
        <div className="space-y-3">
          {tiendas.map((t) => (
            <div key={t.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center relative overflow-hidden">
              <div className="flex items-center gap-3 flex-1" onClick={() => setSelectedTienda(t)}>
                <div className={`p-3 rounded-2xl ${t.latitud ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-800 text-zinc-500'}`}>
                  <MapPin size={22} />
                </div>
                <div className="pr-10">
                  <h3 className="font-bold text-sm leading-tight">{t.nombre_tienda}</h3>
                  <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                    <Phone size={10} /> {t.telefono || 'Sin teléfono'}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); prepararEdicion(t); }}
                className="bg-zinc-800 p-2 rounded-xl text-zinc-400 active:text-blue-500 transition-colors"
              >
                <Edit2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL (NUEVO / EDITAR) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 p-4 flex items-end sm:items-center justify-center">
          <div className="bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-zinc-800 p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-bold">{editId ? 'Editar Tienda' : 'Nueva Tienda'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500"><X /></button>
            </div>
            
            <form onSubmit={guardarTienda} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Nombre del Negocio</label>
                <input required placeholder="Ej. Crepas Velasco" className="w-full bg-black border border-zinc-800 rounded-xl p-3 focus:border-blue-500 outline-none" value={nombre} onChange={e => setNombre(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Dueño</label>
                  <input placeholder="Nombre" className="w-full bg-black border border-zinc-800 rounded-xl p-3 focus:border-blue-500 outline-none" value={dueno} onChange={e => setDueno(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Teléfono</label>
                  <input placeholder="33..." className="w-full bg-black border border-zinc-800 rounded-xl p-3 focus:border-blue-500 outline-none" value={telefono} onChange={e => setTelefono(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Dirección / Notas</label>
                <input placeholder="Calle y Colonia" className="w-full bg-black border border-zinc-800 rounded-xl p-3 focus:border-blue-500 outline-none" value={direccion} onChange={e => setDireccion(e.target.value)} />
              </div>

              <button type="button" onClick={obtenerUbicacion} className={`w-full p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${coords.lat ? 'border-blue-500 text-blue-500 bg-blue-500/5' : 'border-zinc-800 text-zinc-500'}`}>
                <Navigation size={18} /> {coords.lat ? 'Ubicación Actualizada ✓' : 'Fijar Nueva Ubicación GPS'}
              </button>

              <button type="submit" className="w-full bg-blue-600 p-4 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-lg shadow-blue-900/30">
                <Save size={20} /> {editId ? 'Guardar Cambios' : 'Registrar Cliente'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VISUALIZADOR QR */}
      {selectedTienda && (
        <div className="fixed inset-0 z-[110] bg-black/95 p-6 flex items-center justify-center">
          <div className="text-center w-full">
            <h2 className="text-2xl font-black mb-1">{selectedTienda.nombre_tienda}</h2>
            <p className="text-blue-500 text-xs font-bold mb-8 tracking-widest uppercase">{selectedTienda.codigo_qr}</p>
            <div className="bg-white p-6 rounded-3xl inline-block shadow-2xl shadow-blue-500/20"><QRCodeSVG value={selectedTienda.codigo_qr} size={220} /></div>
            <button onClick={() => setSelectedTienda(null)} className="mt-12 bg-zinc-800 text-white px-10 py-3 rounded-full font-bold">Cerrar</button>
          </div>
        </div>
      )}

      {/* Menú inferior */}
      <nav className="fixed bottom-6 left-4 right-4 bg-zinc-900/80 backdrop-blur-lg border border-zinc-800 p-2 rounded-3xl flex justify-around items-center z-40">
        <button className="p-3 text-blue-500 flex flex-col items-center"><LayoutDashboard size={20} /><span className="text-[9px] font-bold mt-1">Panel</span></button>
        <button className="p-3 text-zinc-500 flex flex-col items-center"><Truck size={20} /><span className="text-[9px] font-bold mt-1">Rutas</span></button>
        <button className="p-3 text-zinc-500 flex flex-col items-center"><Users size={20} /><span className="text-[9px] font-bold mt-1">Equipo</span></button>
      </nav>
    </div>
  );
}
