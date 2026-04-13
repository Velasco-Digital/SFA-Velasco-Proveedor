'use client'
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  PlusCircle, MapPin, QrCode, Truck, Users, LayoutDashboard, 
  X, Save, Navigation, Edit2, Phone, Trash2, AlertTriangle, Package
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function SFADashboard() {
  // --- NAVEGACIÓN ---
  const [activeTab, setActiveTab] = useState('panel'); // panel, productos, rutas, equipo

  // --- ESTADOS GENERALES ---
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS MODALES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTienda, setSelectedTienda] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemABorrar, setItemABorrar] = useState<any>(null);

  // --- ESTADOS FORMULARIO TIENDAS ---
  const [editId, setEditId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [dueno, setDueno] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [coords, setCoords] = useState({ lat: null, lng: null });

  // Cargar datos según la pestaña
  useEffect(() => {
    if (activeTab === 'panel') cargarTiendas();
    if (activeTab === 'productos') cargarProductos();
  }, [activeTab]);

  async function cargarTiendas() {
    setLoading(true);
    const { data } = await supabase.from('sfa_tiendas').select('*').order('created_at', { ascending: false });
    if (data) setTiendas(data);
    setLoading(false);
  }

  async function cargarProductos() {
    setLoading(true);
    const { data } = await supabase.from('sfa_productos').select('*').order('nombre', { ascending: true });
    if (data) setProductos(data);
    setLoading(false);
  }

  // --- LÓGICA DE BORRADO ESTILO IPHONE ---
  const confirmarBorrado = (item: any) => {
    setItemABorrar(item);
    setShowDeleteConfirm(true);
  };

  async function ejecutarEliminacion() {
    if (!itemABorrar) return;
    const tabla = activeTab === 'panel' ? 'sfa_tiendas' : 'sfa_productos';
    const { error } = await supabase.from(tabla).delete().eq('id', itemABorrar.id);
    if (!error) {
      setShowDeleteConfirm(false);
      setItemABorrar(null);
      activeTab === 'panel' ? cargarTiendas() : cargarProductos();
    }
  }

  // --- RENDERIZADO DE VISTAS ---
  const renderContent = () => {
    switch(activeTab) {
      case 'panel':
        return (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-2">Mis Tiendas</h2>
            {tiendas.map((t) => (
              <div key={t.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center active:scale-95 transition-all">
                <div className="flex items-center gap-3" onClick={() => setSelectedTienda(t)}>
                  <div className={`p-3 rounded-2xl ${t.latitud ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-800 text-zinc-500'}`}><MapPin size={22} /></div>
                  <div>
                    <h3 className="font-bold text-sm">{t.nombre_tienda}</h3>
                    <p className="text-[10px] text-zinc-500">{t.telefono || 'Sin contacto'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditId(t.id); setNombre(t.nombre_tienda); setDueno(t.dueno); setTelefono(t.telefono); setDireccion(t.direccion); setIsModalOpen(true); }} className="p-2 text-zinc-500"><Edit2 size={18}/></button>
                  <button onClick={() => confirmarBorrado(t)} className="p-2 text-red-900"><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
          </div>
        );
      case 'productos':
        return (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Catálogo de Productos</h2>
              <button className="text-blue-500 text-[10px] font-bold">+ AGREGAR</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {productos.length === 0 ? (
                <div className="col-span-2 py-20 text-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-3xl">
                  <Package size={40} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No hay productos aún</p>
                </div>
              ) : (
                productos.map(p => (
                  <div key={p.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-3"><Package size={20}/></div>
                    <h3 className="font-bold text-sm leading-tight">{p.nombre}</h3>
                    <p className="text-blue-500 font-black mt-1">${p.precio}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      case 'rutas':
        return <div className="text-center py-20 text-zinc-500">📍 Sección de Rutas (Próximamente)</div>;
      case 'equipo':
        return <div className="text-center py-20 text-zinc-500">👥 Gestión de Repartidores (Próximamente)</div>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans antialiased">
      {/* HEADER DINÁMICO */}
      <header className="p-6 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-blue-500 tracking-tighter italic">VD SFA</h1>
            <p className="text-[9px] text-zinc-500 font-bold uppercase">{activeTab}</p>
          </div>
          <button onClick={() => { setEditId(null); setIsModalOpen(true); }} className="bg-blue-600 p-2 rounded-full active:scale-90 shadow-lg shadow-blue-500/40 transition-all">
            <PlusCircle size={24} />
          </button>
        </div>
      </header>

      <main className="p-4">{loading ? <div className="text-center py-20 animate-pulse text-zinc-500 uppercase text-xs font-bold">Cargando Velasco Digital...</div> : renderContent()}</main>

      {/* NOTIFICACIÓN DE BORRADO ESTILO IPHONE */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900/90 border border-zinc-800 w-full max-w-[280px] rounded-[24px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="bg-red-500/10 text-red-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24} /></div>
              <h2 className="text-lg font-bold mb-1">¿Confirmar?</h2>
              <p className="text-[11px] text-zinc-400">Esta acción eliminará el registro de forma permanente.</p>
            </div>
            <div className="flex border-t border-zinc-800">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 p-4 text-xs font-medium border-r border-zinc-800 active:bg-zinc-800">Cancelar</button>
              <button onClick={ejecutarEliminacion} className="flex-1 p-4 text-xs font-bold text-red-500 active:bg-zinc-800">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* NAV INFERIOR FLUIDA */}
      <nav className="fixed bottom-6 left-4 right-4 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-2 rounded-3xl flex justify-around items-center z-40 shadow-2xl">
        <button onClick={() => setActiveTab('panel')} className={`p-3 flex flex-col items-center transition-all ${activeTab === 'panel' ? 'text-blue-500 scale-110' : 'text-zinc-500'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[8px] font-black mt-1 uppercase">Panel</span>
        </button>
        <button onClick={() => setActiveTab('productos')} className={`p-3 flex flex-col items-center transition-all ${activeTab === 'productos' ? 'text-blue-500 scale-110' : 'text-zinc-500'}`}>
          <Package size={20} />
          <span className="text-[8px] font-black mt-1 uppercase">Productos</span>
        </button>
        <button onClick={() => setActiveTab('rutas')} className={`p-3 flex flex-col items-center transition-all ${activeTab === 'rutas' ? 'text-blue-500 scale-110' : 'text-zinc-500'}`}>
          <Truck size={20} />
          <span className="text-[8px] font-black mt-1 uppercase">Rutas</span>
        </button>
        <button onClick={() => setActiveTab('equipo')} className={`p-3 flex flex-col items-center transition-all ${activeTab === 'equipo' ? 'text-blue-500 scale-110' : 'text-zinc-500'}`}>
          <Users size={20} />
          <span className="text-[8px] font-black mt-1 uppercase">Equipo</span>
        </button>
      </nav>

      {/* QR MODAL (Ahorro de espacio) */}
      {selectedTienda && (
        <div className="fixed inset-0 z-[110] bg-black/95 p-6 flex items-center justify-center animate-in fade-in" onClick={() => setSelectedTienda(null)}>
          <div className="text-center w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black mb-1 italic">{selectedTienda.nombre_tienda}</h2>
            <div className="bg-white p-6 rounded-[40px] inline-block mt-4 shadow-2xl shadow-blue-500/40">
              <QRCodeSVG value={selectedTienda.codigo_qr} size={200} />
            </div>
            <p className="mt-6 text-zinc-500 font-mono text-sm uppercase tracking-tighter">{selectedTienda.codigo_qr}</p>
          </div>
        </div>
      )}
    </div>
  );
}
