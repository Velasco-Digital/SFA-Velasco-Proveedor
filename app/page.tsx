'use client'
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  PlusCircle, MapPin, QrCode, Truck, Users, LayoutDashboard, 
  X, Save, Navigation, Edit2, Phone, Trash2, AlertTriangle, Package, Tag, Layers
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function SFADashboard() {
  const [activeTab, setActiveTab] = useState('panel');
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DE DATOS ---
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);

  // --- ESTADOS DE MODALES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTienda, setSelectedTienda] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemABorrar, setItemABorrar] = useState<any>(null);

  // --- ESTADOS FORMULARIO (COMPARTIDOS) ---
  const [editId, setEditId] = useState<string | null>(null);
  
  // Campos Tienda
  const [nombre, setNombre] = useState('');
  const [dueno, setDueno] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [coords, setCoords] = useState({ lat: null, lng: null });

  // Campos Producto
  const [prodNombre, setProdNombre] = useState('');
  const [prodPrecio, setProdPrecio] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodCat, setProdCat] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [activeTab]);

  async function cargarDatos() {
    setLoading(true);
    if (activeTab === 'panel') {
      const { data } = await supabase.from('sfa_tiendas').select('*').order('created_at', { ascending: false });
      if (data) setTiendas(data);
    }
    if (activeTab === 'productos') {
      const { data } = await supabase.from('sfa_productos').select('*').order('nombre', { ascending: true });
      if (data) setProductos(data);
    }
    setLoading(false);
  }

  // --- LÓGICA DEL BOTÓN "+" INTELIGENTE ---
  const handlePlusButton = () => {
    setEditId(null);
    // Limpiar campos según pestaña
    if (activeTab === 'panel') {
      setNombre(''); setDueno(''); setTelefono(''); setDireccion(''); setCoords({ lat: null, lng: null });
    } else if (activeTab === 'productos') {
      setProdNombre(''); setProdPrecio(''); setProdStock(''); setProdCat('');
    }
    setIsModalOpen(true);
  };

  // --- GUARDAR (TIENDA O PRODUCTO) ---
  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (activeTab === 'panel') {
      const payload = { nombre_tienda: nombre, dueno, telefono, direccion, latitud: coords.lat, longitud: coords.lng };
      if (editId) {
        await supabase.from('sfa_tiendas').update(payload).eq('id', editId);
      } else {
        const codigo = `SFA-${Math.random().toString(36).substr(2, 7).toUpperCase()}`;
        await supabase.from('sfa_tiendas').insert([{ ...payload, codigo_qr: codigo }]);
      }
    } else if (activeTab === 'productos') {
      const payload = { nombre: prodNombre, precio: parseFloat(prodPrecio), stock: parseInt(prodStock), categoria: prodCat };
      if (editId) {
        await supabase.from('sfa_productos').update(payload).eq('id', editId);
      } else {
        await supabase.from('sfa_productos').insert([payload]);
      }
    }
    setIsModalOpen(false);
    cargarDatos();
  }

  async function ejecutarEliminacion() {
    const tabla = activeTab === 'panel' ? 'sfa_tiendas' : 'sfa_productos';
    await supabase.from(tabla).delete().eq('id', itemABorrar.id);
    setShowDeleteConfirm(false);
    cargarDatos();
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans antialiased">
      {/* HEADER */}
      <header className="p-6 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-blue-500 tracking-tighter italic">VD SFA</h1>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{activeTab === 'panel' ? 'Tiendas' : activeTab}</p>
          </div>
          <button onClick={handlePlusButton} className="bg-blue-600 p-2 rounded-full active:scale-90 shadow-lg shadow-blue-500/40">
            <PlusCircle size={24} />
          </button>
        </div>
      </header>

      <main className="p-4">
        {loading ? (
          <div className="text-center py-20 animate-pulse text-zinc-600 text-xs font-bold uppercase">Sincronizando...</div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {activeTab === 'panel' && (
              <div className="space-y-3">
                {tiendas.map(t => (
                  <div key={t.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center">
                    <div className="flex items-center gap-3 flex-1" onClick={() => setSelectedTienda(t)}>
                      <div className={`p-3 rounded-2xl ${t.latitud ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-800 text-zinc-500'}`}><MapPin size={22} /></div>
                      <div><h3 className="font-bold text-sm">{t.nombre_tienda}</h3><p className="text-[10px] text-zinc-500">{t.telefono || 'Sin contacto'}</p></div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditId(t.id); setNombre(t.nombre_tienda); setDueno(t.dueno); setTelefono(t.telefono); setDireccion(t.direccion); setIsModalOpen(true); }} className="p-2 text-zinc-500"><Edit2 size={18}/></button>
                      <button onClick={() => { setItemABorrar(t); setShowDeleteConfirm(true); }} className="p-2 text-red-900/50"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'productos' && (
              <div className="grid grid-cols-2 gap-3">
                {productos.map(p => (
                  <div key={p.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl relative">
                    <button onClick={() => { setItemABorrar(p); setShowDeleteConfirm(true); }} className="absolute top-3 right-3 text-red-900/40"><Trash2 size={14}/></button>
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-3"><Package size={20}/></div>
                    <h3 className="font-bold text-xs leading-tight mb-1">{p.nombre}</h3>
                    <p className="text-blue-500 font-black text-sm">${p.precio}</p>
                    <p className="text-[9px] text-zinc-500 uppercase mt-2 font-bold tracking-tighter">Stock: {p.stock} pz</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL IPHONE STYLE (ELIMINAR) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900/90 border border-zinc-800 w-full max-w-[280px] rounded-[24px] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-6 text-center">
              <div className="bg-red-500/10 text-red-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24} /></div>
              <h2 className="text-lg font-bold mb-1 italic">¿Confirmar?</h2>
              <p className="text-[11px] text-zinc-400">Esta acción borrará el registro para siempre de Velasco Digital.</p>
            </div>
            <div className="flex border-t border-zinc-800">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 p-4 text-xs font-medium border-r border-zinc-800">Cancelar</button>
              <button onClick={ejecutarEliminacion} className="flex-1 p-4 text-xs font-bold text-red-500">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* FORMULARIO ÚNICO (ADAPTABLE) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 p-4 flex items-end sm:items-center justify-center animate-in slide-in-from-bottom duration-300">
          <div className="bg-zinc-900 w-full max-w-md rounded-t-[32px] sm:rounded-[32px] border border-zinc-800 p-6">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-black italic">{editId ? 'Editar' : 'Nuevo'} {activeTab === 'panel' ? 'Cliente' : 'Producto'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-600"><X /></button>
            </div>
            
            <form onSubmit={handleGuardar} className="space-y-4">
              {activeTab === 'panel' ? (
                <>
                  <input required placeholder="Tienda" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none focus:border-blue-500" value={nombre} onChange={e => setNombre(e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Dueño" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={dueno} onChange={e => setDueno(e.target.value)} />
                    <input placeholder="Teléfono" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={telefono} onChange={e => setTelefono(e.target.value)} />
                  </div>
                  <input placeholder="Dirección" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={direccion} onChange={e => setDireccion(e.target.value)} />
                </>
              ) : (
                <>
                  <input required placeholder="Nombre del producto" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none focus:border-blue-500" value={prodNombre} onChange={e => setProdNombre(e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                       <span className="absolute left-4 top-4 text-zinc-500">$</span>
                       <input required type="number" placeholder="Precio" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 pl-8 outline-none" value={prodPrecio} onChange={e => setProdPrecio(e.target.value)} />
                    </div>
                    <input required type="number" placeholder="Stock Inicial" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={prodStock} onChange={e => setProdStock(e.target.value)} />
                  </div>
                  <input placeholder="Categoría (Ej. Bebidas)" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={prodCat} onChange={e => setProdCat(e.target.value)} />
                </>
              )}
              <button type="submit" className="w-full bg-blue-600 p-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                <Save size={20} /> Guardar Registro
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR VIEW */}
      {selectedTienda && (
        <div className="fixed inset-0 z-[110] bg-black/95 p-6 flex items-center justify-center" onClick={() => setSelectedTienda(null)}>
          <div className="text-center" onClick={e => e.stopPropagation()}>
            <h2 className="text-3xl font-black italic mb-8">{selectedTienda.nombre_tienda}</h2>
            <div className="bg-white p-8 rounded-[48px] inline-block shadow-2xl shadow-blue-500/40 animate-in zoom-in">
              <QRCodeSVG value={selectedTienda.codigo_qr} size={220} />
            </div>
            <p className="mt-8 text-zinc-500 font-mono text-sm tracking-widest">{selectedTienda.codigo_qr}</p>
          </div>
        </div>
      )}

      {/* NAV INFERIOR */}
      <nav className="fixed bottom-6 left-4 right-4 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-2 rounded-[32px] flex justify-around items-center z-40 shadow-2xl">
        <button onClick={() => setActiveTab('panel')} className={`p-4 flex flex-col items-center transition-all ${activeTab === 'panel' ? 'text-blue-500 scale-110' : 'text-zinc-500 opacity-50'}`}>
          <LayoutDashboard size={20} /><span className="text-[8px] font-black mt-1 uppercase">Panel</span>
        </button>
        <button onClick={() => setActiveTab('productos')} className={`p-4 flex flex-col items-center transition-all ${activeTab === 'productos' ? 'text-blue-500 scale-110' : 'text-zinc-500 opacity-50'}`}>
          <Package size={20} /><span className="text-[8px] font-black mt-1 uppercase">Stock</span>
        </button>
        <button onClick={() => setActiveTab('rutas')} className={`p-4 flex flex-col items-center transition-all ${activeTab === 'rutas' ? 'text-blue-500 scale-110' : 'text-zinc-500 opacity-50'}`}>
          <Truck size={20} /><span className="text-[8px] font-black mt-1 uppercase">Rutas</span>
        </button>
        <button onClick={() => setActiveTab('equipo')} className={`p-4 flex flex-col items-center transition-all ${activeTab === 'equipo' ? 'text-blue-500 scale-110' : 'text-zinc-500 opacity-50'}`}>
          <Users size={20} /><span className="text-[8px] font-black mt-1 uppercase">Team</span>
        </button>
      </nav>
    </div>
  );
}
