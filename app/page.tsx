'use client'
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  PlusCircle, MapPin, QrCode, Truck, Users, LayoutDashboard, 
  X, Save, Navigation, Edit2, Phone, Trash2, AlertTriangle, Package, Briefcase
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function SFADashboard() {
  const [activeTab, setActiveTab] = useState('panel');
  const [loading, setLoading] = useState(true);
  
  // --- DATOS ---
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);

  // --- MODALES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTienda, setSelectedTienda] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemABorrar, setItemABorrar] = useState<any>(null);

  // --- FORMULARIOS ---
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

  useEffect(() => { cargarDatos(); }, [activeTab]);

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

  const obtenerUbicacion = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setCoords({ lat: pos.coords.latitude as any, lng: pos.coords.longitude as any });
    }, () => alert("Viejo, activa el GPS en tu cel"));
  };

  // Botón "+" Inteligente
  const handlePlusButton = () => {
    setEditId(null);
    if (activeTab === 'panel') {
      setNombre(''); setDueno(''); setTelefono(''); setDireccion(''); setCoords({ lat: null, lng: null });
    } else if (activeTab === 'productos') {
      setProdNombre(''); setProdPrecio(''); setProdStock(''); setProdCat('');
    }
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditId(item.id);
    if (activeTab === 'panel') {
      setNombre(item.nombre_tienda); setDueno(item.dueno || ''); 
      setTelefono(item.telefono || ''); setDireccion(item.direccion || '');
      setCoords({ lat: item.latitud, lng: item.longitud });
    } else if (activeTab === 'productos') {
      setProdNombre(item.nombre); setProdPrecio(item.precio.toString());
      setProdStock(item.stock.toString()); setProdCat(item.categoria || '');
    }
    setIsModalOpen(true);
  };

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (activeTab === 'panel') {
      const p = { nombre_tienda: nombre, dueno, telefono, direccion, latitud: coords.lat, longitud: coords.lng };
      if (editId) await supabase.from('sfa_tiendas').update(p).eq('id', editId);
      else await supabase.from('sfa_tiendas').insert([{ ...p, codigo_qr: `SFA-${Math.random().toString(36).substr(2, 7).toUpperCase()}` }]);
    } else if (activeTab === 'productos') {
      const p = { nombre: prodNombre, precio: parseFloat(prodPrecio), stock: parseInt(prodStock), categoria: prodCat };
      if (editId) await supabase.from('sfa_productos').update(p).eq('id', editId);
      else await supabase.from('sfa_productos').insert([p]);
    }
    setIsModalOpen(false);
    cargarDatos();
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans antialiased">
      {/* HEADER */}
      <header className="p-6 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-blue-500 tracking-tighter italic">VD SFA</h1>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{activeTab === 'panel' ? 'Clientes' : activeTab}</p>
          </div>
          {(activeTab === 'panel' || activeTab === 'productos') && (
            <button onClick={handlePlusButton} className="bg-blue-600 p-2 rounded-full active:scale-90 shadow-lg shadow-blue-500/40">
              <PlusCircle size={24} />
            </button>
          )}
        </div>
      </header>

      <main className="p-4">
        {loading ? (
          <div className="text-center py-20 text-zinc-600 text-xs font-bold uppercase animate-pulse">Sincronizando...</div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {activeTab === 'panel' && (
              <div className="space-y-3">
                {tiendas.map(t => (
                  <div key={t.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center">
                    <div className="flex items-center gap-3 flex-1" onClick={() => setSelectedTienda(t)}>
                      <div className={`p-3 rounded-2xl ${t.latitud ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-800 text-zinc-500'}`}><MapPin size={22} /></div>
                      <div><h3 className="font-bold text-sm leading-tight">{t.nombre_tienda}</h3><p className="text-[10px] text-zinc-500">{t.telefono || 'Sin contacto'}</p></div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(t)} className="p-2 text-zinc-500"><Edit2 size={18}/></button>
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
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500"><Package size={20}/></div>
                      <div className="flex gap-2">
                         <button onClick={() => handleEdit(p)} className="text-zinc-600"><Edit2 size={14}/></button>
                         <button onClick={() => { setItemABorrar(p); setShowDeleteConfirm(true); }} className="text-red-900/40"><Trash2 size={14}/></button>
                      </div>
                    </div>
                    <h3 className="font-bold text-xs leading-tight mb-1">{p.nombre}</h3>
                    <p className="text-blue-500 font-black text-sm">${p.precio}</p>
                    <p className="text-[9px] text-zinc-500 uppercase mt-2 font-bold tracking-tighter">Stock: {p.stock} pz</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'rutas' && <div className="text-center py-20 text-zinc-500">📍 Próximamente: Logística de Rutas</div>}
            {activeTab === 'equipo' && <div className="text-center py-20 text-zinc-500">👥 Próximamente: Gestión de Personal</div>}
          </div>
        )}
      </main>

      {/* NOTIFICACIÓN TIPO IPHONE (CONFIRMAR BORRADO) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900/90 border border-zinc-800 w-full max-w-[280px] rounded-[28px] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-6 text-center">
              <div className="bg-red-500/10 text-red-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24} /></div>
              <h2 className="text-lg font-bold mb-1 italic">¿Eliminar?</h2>
              <p className="text-[11px] text-zinc-400">Esta acción es irreversible en el sistema Velasco Digital.</p>
            </div>
            <div className="flex border-t border-zinc-800">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 p-4 text-xs font-medium border-r border-zinc-800 active:bg-zinc-800">Cancelar</button>
              <button onClick={async () => {
                const tabla = activeTab === 'panel' ? 'sfa_tiendas' : 'sfa_productos';
                await supabase.from(tabla).delete().eq('id', itemABorrar.id);
                setShowDeleteConfirm(false); cargarDatos();
              }} className="flex-1 p-4 text-xs font-bold text-red-500 active:bg-zinc-800">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADAPTABLE (FORMULARIO) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 p-4 flex items-end sm:items-center justify-center animate-in slide-in-from-bottom duration-300">
          <div className="bg-zinc-900 w-full max-w-md rounded-t-[32px] sm:rounded-[32px] border border-zinc-800 p-6 shadow-2xl">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-black italic">{editId ? 'Editar' : 'Nuevo'} {activeTab === 'panel' ? 'Cliente' : 'Producto'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-zinc-800 p-1 rounded-full text-zinc-500"><X size={20}/></button>
            </div>
            <form onSubmit={handleGuardar} className="space-y-4">
              {activeTab === 'panel' ? (
                <>
                  <input required placeholder="Nombre del Negocio" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none focus:border-blue-500" value={nombre} onChange={e => setNombre(e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Dueño" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={dueno} onChange={e => setDueno(e.target.value)} />
                    <input placeholder="Teléfono" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={telefono} onChange={e => setTelefono(e.target.value)} />
                  </div>
                  <input placeholder="Dirección" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={direccion} onChange={e => setDireccion(e.target.value)} />
                  <button type="button" onClick={obtenerUbicacion} className={`w-full p-4 rounded-2xl border flex items-center justify-center gap-2 transition-all ${coords.lat ? 'border-blue-500 text-blue-500 bg-blue-500/5' : 'border-zinc-800 text-zinc-500'}`}>
                    <Navigation size={20} /> {coords.lat ? 'Ubicación GPS Capturada ✓' : 'Fijar Ubicación de Tienda'}
                  </button>
                </>
              ) : (
                <>
                  <input required placeholder="Producto" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none focus:border-blue-500" value={prodNombre} onChange={e => setProdNombre(e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <input required type="number" placeholder="Precio $" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={prodPrecio} onChange={e => setProdPrecio(e.target.value)} />
                    <input required type="number" placeholder="Stock" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={prodStock} onChange={e => setProdStock(e.target.value)} />
                  </div>
                  <input placeholder="Categoría" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={prodCat} onChange={e => setProdCat(e.target.value)} />
                </>
              )}
              <button type="submit" className="w-full bg-blue-600 p-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                <Save size={20} className="inline mr-2" /> Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR VIEW */}
      {selectedTienda && (
        <div className="fixed inset-0 z-[110] bg-black/95 p-6 flex items-center justify-center animate-in fade-in" onClick={() => setSelectedTienda(null)}>
          <div className="text-center" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black italic mb-6">{selectedTienda.nombre_tienda}</h2>
            <div className="bg-white p-8 rounded-[48px] inline-block shadow-2xl shadow-blue-500/40 animate-in zoom-in">
              <QRCodeSVG value={selectedTienda.codigo_qr} size={220} />
            </div>
            <p className="mt-6 text-zinc-500 font-mono text-xs uppercase tracking-widest">{selectedTienda.codigo_qr}</p>
          </div>
        </div>
      )}

      {/* NAV INFERIOR */}
      <nav className="fixed bottom-6 left-4 right-4 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-2 rounded-[32px] flex justify-around items-center z-40 shadow-2xl">
        <button onClick={() => setActiveTab('panel')} className={`p-4 flex flex-col items-center transition-all ${activeTab === 'panel' ? 'text-blue-500 scale-110' : 'text-zinc-600 opacity-60'}`}>
          <LayoutDashboard size={20} /><span className="text-[8px] font-black mt-1 uppercase">Tiendas</span>
        </button>
        <button onClick={() => setActiveTab('productos')} className={`p-4 flex flex-col items-center transition-all ${activeTab === 'productos' ? 'text-blue-500 scale-110' : 'text-zinc-600 opacity-60'}`}>
          <Package size={20} /><span className="text-[8px] font-black mt-1 uppercase">Stock</span>
        </button>
        <button onClick={() => setActiveTab('rutas')} className={`p-4 flex flex-col items-center transition-all ${activeTab === 'rutas' ? 'text-blue-500 scale-110' : 'text-zinc-600 opacity-60'}`}>
          <Truck size={20} /><span className="text-[8px] font-black mt-1 uppercase">Rutas</span>
        </button>
        <button onClick={() => setActiveTab('equipo')} className={`p-4 flex flex-col items-center transition-all ${activeTab === 'equipo' ? 'text-blue-500 scale-110' : 'text-zinc-600 opacity-60'}`}>
          <Users size={20} /><span className="text-[8px] font-black mt-1 uppercase">Team</span>
        </button>
      </nav>
    </div>
  );
}
