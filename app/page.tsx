'use client'
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  PlusCircle, MapPin, QrCode, Truck, Users, LayoutDashboard, 
  X, Save, Navigation, Edit2, Phone, Trash2, AlertTriangle 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function SFADashboard() {
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTienda, setSelectedTienda] = useState<any>(null);
  
  // Estados para Borrado Elegante
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tiendaABorrar, setTiendaABorrar] = useState<any>(null);

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

  const prepararEdicion = (tienda: any) => {
    setEditId(tienda.id);
    setNombre(tienda.nombre_tienda);
    setDueno(tienda.dueno || '');
    setTelefono(tienda.telefono || '');
    setDireccion(tienda.direccion || '');
    setCoords({ lat: tienda.latitud, lng: tienda.longitud });
    setIsModalOpen(true);
  };

  const confirmarBorrado = (tienda: any) => {
    setTiendaABorrar(tienda);
    setShowDeleteConfirm(true);
  };

  async function ejecutarEliminacion() {
    if (!tiendaABorrar) return;
    const { error } = await supabase.from('sfa_tiendas').delete().eq('id', tiendaABorrar.id);
    if (!error) {
      setShowDeleteConfirm(false);
      setTiendaABorrar(null);
      cargarTiendas();
    }
  }

  async function guardarTienda(e: React.FormEvent) {
    e.preventDefault();
    const payload = { 
      nombre_tienda: nombre, dueno, telefono, direccion,
      latitud: coords.lat, longitud: coords.lng
    };

    if (editId) {
      await supabase.from('sfa_tiendas').update(payload).eq('id', editId);
    } else {
      const codigo = `SFA-${Math.random().toString(36).substr(2, 7).toUpperCase()}`;
      await supabase.from('sfa_tiendas').insert([{ ...payload, codigo_qr: codigo }]);
    }
    setIsModalOpen(false);
    cargarTiendas();
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-sans antialiased">
      <header className="p-6 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-black text-blue-500 tracking-tighter italic">VD SFA</h1>
          <button onClick={() => { setEditId(null); setIsModalOpen(true); }} className="bg-blue-600 p-2 rounded-full active:scale-90"><PlusCircle size={24} /></button>
        </div>
      </header>

      <main className="p-4 space-y-3">
        {tiendas.map((t) => (
          <div key={t.id} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center active:scale-[0.98] transition-all">
            <div className="flex items-center gap-3 flex-1" onClick={() => setSelectedTienda(t)}>
              <div className={`p-3 rounded-2xl ${t.latitud ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-800 text-zinc-500'}`}><MapPin size={22} /></div>
              <div>
                <h3 className="font-bold text-sm">{t.nombre_tienda}</h3>
                <p className="text-[10px] text-zinc-500 flex items-center gap-1"><Phone size={10}/> {t.telefono || '---'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => prepararEdicion(t)} className="p-2 text-zinc-400"><Edit2 size={18} /></button>
              <button onClick={() => confirmarBorrado(t)} className="p-2 text-red-500/50"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </main>

      {/* MODAL IPHONE STYLE PARA ELIMINAR */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900/90 border border-zinc-800 w-full max-w-[280px] rounded-[24px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="bg-red-500/10 text-red-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-lg font-bold mb-2">¿Eliminar tienda?</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Estás a punto de borrar <span className="text-white font-semibold">"{tiendaABorrar?.nombre_tienda}"</span>. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex border-t border-zinc-800">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 p-4 text-sm font-medium border-r border-zinc-800 active:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={ejecutarEliminacion}
                className="flex-1 p-4 text-sm font-bold text-red-500 active:bg-zinc-800 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRO/EDITAR (Mantiene tu estilo favorito) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 p-4 flex items-end sm:items-center justify-center">
          <div className="bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-zinc-800 p-6">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-bold">{editId ? 'Editar Tienda' : 'Nueva Tienda'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X /></button>
            </div>
            <form onSubmit={guardarTienda} className="space-y-3">
              <input required placeholder="Nombre del negocio" className="w-full bg-black border border-zinc-800 rounded-xl p-3 outline-none focus:border-blue-500" value={nombre} onChange={e => setNombre(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Dueño" className="w-full bg-black border border-zinc-800 rounded-xl p-3" value={dueno} onChange={e => setDueno(e.target.value)} />
                <input placeholder="Teléfono" className="w-full bg-black border border-zinc-800 rounded-xl p-3" value={telefono} onChange={e => setTelefono(e.target.value)} />
              </div>
              <input placeholder="Dirección" className="w-full bg-black border border-zinc-800 rounded-xl p-3" value={direccion} onChange={e => setDireccion(e.target.value)} />
              <button type="button" onClick={obtenerUbicacion} className="w-full p-3 rounded-xl border border-zinc-800 text-zinc-400 flex items-center justify-center gap-2">
                <Navigation size={18} /> {coords.lat ? 'GPS Capturado ✓' : 'Fijar Ubicación'}
              </button>
              <button type="submit" className="w-full bg-blue-600 p-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30">
                <Save size={20} /> Guardar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VISUALIZADOR QR */}
      {selectedTienda && (
        <div className="fixed inset-0 z-[110] bg-black/95 p-6 flex items-center justify-center animate-in fade-in">
          <div className="text-center w-full">
            <h2 className="text-2xl font-black mb-1">{selectedTienda.nombre_tienda}</h2>
            <p className="text-blue-500 text-xs font-bold mb-8 uppercase tracking-widest">{selectedTienda.codigo_qr}</p>
            <div className="bg-white p-6 rounded-[40px] inline-block shadow-2xl shadow-blue-500/20">
              <QRCodeSVG value={selectedTienda.codigo_qr} size={220} />
            </div>
            <br />
            <button onClick={() => setSelectedTienda(null)} className="mt-12 bg-zinc-800 px-10 py-3 rounded-full font-bold active:scale-95 transition-all">Cerrar</button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-6 left-4 right-4 bg-zinc-900/80 backdrop-blur-lg border border-zinc-800 p-2 rounded-3xl flex justify-around items-center z-40">
        <button className="p-3 text-blue-500 flex flex-col items-center"><LayoutDashboard size={20} /><span className="text-[9px] font-bold mt-1">Panel</span></button>
        <button className="p-3 text-zinc-500 flex flex-col items-center"><Truck size={20} /><span className="text-[9px] font-bold mt-1">Rutas</span></button>
        <button className="p-3 text-zinc-500 flex flex-col items-center"><Users size={20} /><span className="text-[9px] font-bold mt-1">Equipo</span></button>
      </nav>
    </div>
  );
}
