'use client'
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  PlusCircle, MapPin, QrCode, Truck, Users, LayoutDashboard, 
  X, Save, Navigation, Edit2, Phone, Trash2, AlertTriangle, Package, Briefcase, ShoppingBag
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function SFADashboard() {
  const [activeTab, setActiveTab] = useState('panel'); // panel, productos, rutas, equipo
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DE DATOS ---
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [equipo, setEquipo] = useState<any[]>([]);

  // --- ESTADOS DE UI ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTienda, setSelectedTienda] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemABorrar, setItemABorrar] = useState<any>(null);

  // --- FORMULARIOS (ESTADOS INDEPENDIENTES PARA EVITAR BUGS) ---
  const [editId, setEditId] = useState<string | null>(null);
  
  // Tiendas
  const [tNombre, setTNombre] = useState('');
  const [tDueno, setTDueno] = useState('');
  const [tTel, setTTel] = useState('');
  const [tDir, setTDir] = useState('');
  const [tCoords, setTCoords] = useState({ lat: null, lng: null });

  // Productos
  const [pNombre, setPNombre] = useState('');
  const [pPrecio, setPPrecio] = useState('');
  const [pStock, setPStock] = useState('');
  const [pCat, setPCat] = useState('');

  // Equipo
  const [sNombre, setSNombre] = useState('');
  const [sTel, setSTel] = useState('');
  const [sPuesto, setSPuesto] = useState('Repartidor');

  useEffect(() => { cargarDatos(); }, [activeTab]);

  async function cargarDatos() {
    setLoading(true);
    try {
      if (activeTab === 'panel') {
        const { data } = await supabase.from('sfa_tiendas').select('*').order('created_at', { ascending: false });
        setTiendas(data || []);
      } else if (activeTab === 'productos') {
        const { data } = await supabase.from('sfa_productos').select('*').order('nombre', { ascending: true });
        setProductos(data || []);
      } else if (activeTab === 'equipo') {
        const { data } = await supabase.from('sfa_equipo').select('*').order('nombre', { ascending: true });
        setEquipo(data || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  // --- MANEJO DE MODALES ---
  const abrirModalNuevo = () => {
    setEditId(null);
    setTNombre(''); setTDueno(''); setTTel(''); setTDir(''); setTCoords({lat:null, lng:null});
    setPNombre(''); setPPrecio(''); setPStock(''); setPCat('');
    setSNombre(''); setSTel(''); setSPuesto('Repartidor');
    setIsModalOpen(true);
  };

  const prepararEdicion = (item: any) => {
    setEditId(item.id);
    if (activeTab === 'panel') {
      setTNombre(item.nombre_tienda); setTDueno(item.dueno || ''); 
      setTTel(item.telefono || ''); setTDir(item.direccion || '');
      setTCoords({ lat: item.latitud, lng: item.longitud });
    } else if (activeTab === 'productos') {
      setPNombre(item.nombre); setPPrecio(item.precio.toString());
      setPStock(item.stock.toString()); setPCat(item.categoria || '');
    } else if (activeTab === 'equipo') {
      setSNombre(item.nombre); setSTel(item.telefono || ''); setSPuesto(item.puesto || 'Repartidor');
    }
    setIsModalOpen(true);
  };

  // --- CRUD: GUARDAR ---
  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    let error;

    if (activeTab === 'panel') {
      const p = { nombre_tienda: tNombre, dueno: tDueno, telefono: tTel, direccion: tDir, latitud: tCoords.lat, longitud: tCoords.lng };
      if (editId) {
        ({ error } = await supabase.from('sfa_tiendas').update(p).eq('id', editId));
      } else {
        const qr = `SFA-${Math.random().toString(36).substr(2, 7).toUpperCase()}`;
        ({ error } = await supabase.from('sfa_tiendas').insert([{ ...p, codigo_qr: qr }]));
      }
    } else if (activeTab === 'productos') {
      const p = { nombre: pNombre, precio: parseFloat(pPrecio), stock: parseInt(pStock), categoria: pCat };
      if (editId) {
        ({ error } = await supabase.from('sfa_productos').update(p).eq('id', editId));
      } else {
        ({ error } = await supabase.from('sfa_productos').insert([p]));
      }
    } else if (activeTab === 'equipo') {
      const p = { nombre: sNombre, telefono: sTel, puesto: sPuesto };
      if (editId) {
        ({ error } = await supabase.from('sfa_equipo').update(p).eq('id', editId));
      } else {
        ({ error } = await supabase.from('sfa_equipo').insert([p]));
      }
    }

    if (error) alert("Error de Conexión: " + error.message);
    else { setIsModalOpen(false); cargarDatos(); }
  }

  // --- CRUD: ELIMINAR ---
  async function ejecutarEliminacion() {
    const tabla = activeTab === 'panel' ? 'sfa_tiendas' : activeTab === 'productos' ? 'sfa_productos' : 'sfa_equipo';
    const { error } = await supabase.from(tabla).delete().eq('id', itemABorrar.id);
    if (!error) { setShowDeleteConfirm(false); cargarDatos(); }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans selection:bg-blue-500/30">
      {/* HEADER PREMIUM */}
      <header className="p-6 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <div>
            <h1 className="text-2xl font-black text-blue-500 tracking-tighter italic">VELASCO DIGITAL</h1>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{activeTab}</p>
            </div>
          </div>
          <button onClick={abrirModalNuevo} className="bg-blue-600 p-2.5 rounded-full shadow-lg shadow-blue-600/20 active:scale-90 transition-transform">
            <PlusCircle size={26} />
          </button>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Sincronizando Nube...</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* VISTA TIENDAS */}
            {activeTab === 'panel' && tiendas.map(t => (
              <div key={t.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[24px] mb-4 flex justify-between items-center group active:bg-zinc-800 transition-colors">
                <div className="flex items-center gap-4 flex-1" onClick={() => setSelectedTienda(t)}>
                  <div className={`p-4 rounded-2xl ${t.latitud ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{t.nombre_tienda}</h3>
                    <p className="text-xs text-zinc-500 font-medium">{t.dueno || 'Sin titular'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => prepararEdicion(t)} className="p-2 text-zinc-500 hover:text-white"><Edit2 size={20}/></button>
                  <button onClick={() => { setItemABorrar(t); setShowDeleteConfirm(true); }} className="p-2 text-red-900/40 hover:text-red-500"><Trash2 size={20}/></button>
                </div>
              </div>
            ))}

            {/* VISTA STOCK */}
            {activeTab === 'productos' && (
              <div className="grid grid-cols-2 gap-4">
                {productos.map(p => (
                  <div key={p.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[32px] relative group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500"><Package size={22}/></div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => prepararEdicion(p)} className="text-zinc-500"><Edit2 size={14}/></button>
                        <button onClick={() => { setItemABorrar(p); setShowDeleteConfirm(true); }} className="text-red-500"><Trash2 size={14}/></button>
                      </div>
                    </div>
                    <h3 className="font-bold text-sm mb-1 leading-tight">{p.nombre}</h3>
                    <div className="flex justify-between items-end mt-4">
                      <p className="text-blue-500 font-black text-lg">${p.precio}</p>
                      <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded-lg font-bold text-zinc-400">Stock: {p.stock}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VISTA RUTAS */}
            {activeTab === 'rutas' && (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-800">
                  <Truck size={32} className="text-zinc-700" />
                </div>
                <h2 className="text-lg font-bold">Logística de Rutas</h2>
                <p className="text-zinc-500 text-xs max-w-[200px] mx-auto mt-2">Próximamente: Optimización de entregas mediante IA de Velasco Digital.</p>
              </div>
            )}

            {/* VISTA EQUIPO */}
            {activeTab === 'equipo' && equipo.map(s => (
              <div key={s.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[24px] mb-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-zinc-800 text-zinc-400"><Users size={24} /></div>
                  <div>
                    <h3 className="font-bold text-base">{s.nombre}</h3>
                    <p className="text-xs text-blue-500 font-bold uppercase tracking-widest">{s.puesto}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => prepararEdicion(s)} className="p-2 text-zinc-500"><Edit2 size={20}/></button>
                  <button onClick={() => { setItemABorrar(s); setShowDeleteConfirm(true); }} className="p-2 text-red-900/40"><Trash2 size={20}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL IPHONE STYLE (CONFIRMACIÓN) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-zinc-900/90 border border-zinc-800 w-full max-w-[280px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-8 text-center">
              <div className="bg-red-500/10 text-red-500 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={28} /></div>
              <h2 className="text-xl font-bold mb-2">¿Eliminar?</h2>
              <p className="text-xs text-zinc-500 leading-relaxed">Esta acción borrará el registro de los servidores de Velasco Digital.</p>
            </div>
            <div className="flex border-t border-zinc-800">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 p-5 text-sm font-medium border-r border-zinc-800 active:bg-zinc-800">Cancelar</button>
              <button onClick={ejecutarEliminacion} className="flex-1 p-5 text-sm font-black text-red-500 active:bg-zinc-800">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* FORMULARIO ADAPTABLE (MAESTRO) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 p-4 flex items-end sm:items-center justify-center animate-in slide-in-from-bottom duration-500">
          <div className="bg-zinc-900 w-full max-w-md rounded-t-[40px] sm:rounded-[40px] border border-zinc-800 p-8 shadow-2xl shadow-blue-500/5">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic">{editId ? 'EDITAR' : 'NUEVO'} {activeTab.toUpperCase()}</h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-zinc-800 p-2 rounded-full text-zinc-400"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleGuardar} className="space-y-5">
              {activeTab === 'panel' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 ml-2 uppercase tracking-widest">Nombre del Negocio</label>
                    <input required className="w-full bg-black border border-zinc-800 rounded-2xl p-4 focus:border-blue-500 transition-all outline-none" value={tNombre} onChange={e => setTNombre(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-500 ml-2 uppercase tracking-widest">Dueño</label>
                      <input className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={tDueno} onChange={e => setTDueno(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-500 ml-2 uppercase tracking-widest">Teléfono</label>
                      <input className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={tTel} onChange={e => setTTel(e.target.value)} />
                    </div>
                  </div>
                  <input placeholder="Dirección Exacta" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={tDir} onChange={e => setTDir(e.target.value)} />
                  <button type="button" onClick={() => { navigator.geolocation.getCurrentPosition(p => setTCoords({lat: p.coords.latitude as any, lng: p.coords.longitude as any})) }} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-center gap-3 font-bold transition-all ${tCoords.lat ? 'border-blue-500 text-blue-500 bg-blue-500/5' : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}>
                    <Navigation size={22}/> {tCoords.lat ? 'GPS CAPTURADO ✓' : 'FIJAR UBICACIÓN GPS'}
                  </button>
                </>
              )}

              {activeTab === 'productos' && (
                <>
                  <input required placeholder="Nombre del Producto" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 focus:border-blue-500 outline-none" value={pNombre} onChange={e => setPNombre(e.target.value)} />
                  <div className="grid grid-cols-2 gap-4">
                    <input required type="number" step="0.01" placeholder="Precio $" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={pPrecio} onChange={e => setPPrecio(e.target.value)} />
                    <input required type="number" placeholder="Stock Inicial" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={pStock} onChange={e => setPStock(e.target.value)} />
                  </div>
                  <input placeholder="Categoría (Ej. Bebidas)" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={pCat} onChange={e => setPCat(e.target.value)} />
                </>
              )}

              {activeTab === 'equipo' && (
                <>
                  <input required placeholder="Nombre Completo" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 focus:border-blue-500 outline-none" value={sNombre} onChange={e => setSNombre(e.target.value)} />
                  <input placeholder="Número de Contacto" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={sTel} onChange={e => setSTel(e.target.value)} />
                  <select className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none text-zinc-400" value={sPuesto} onChange={e => setSPuesto(e.target.value)}>
                    <option value="Repartidor">Repartidor</option>
                    <option value="Vendedor">Vendedor</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </>
              )}

              <button type="submit" className="w-full bg-blue-600 p-5 rounded-2xl font-black text-sm uppercase tracking-[0.3em] shadow-xl shadow-blue-600/30 active:scale-95 transition-all">
                <Save className="inline mr-2" size={20}/> GUARDAR
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NAV INFERIOR (APPLE STYLE) */}
      <nav className="fixed bottom-8 left-6 right-6 bg-zinc-900/80 backdrop-blur-2xl border border-white/5 p-2 rounded-[32px] flex justify-around items-center z-40 shadow-2xl">
        {[
          {id:'panel', icon: <LayoutDashboard size={22}/>},
          {id:'productos', icon: <ShoppingBag size={22}/>},
          {id:'rutas', icon: <Truck size={22}/>},
          {id:'equipo', icon: <Users size={22}/>}
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`p-4 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {tab.icon}
          </button>
        ))}
      </nav>

      {/* QR VIEW (MODAL) */}
      {selectedTienda && (
        <div className="fixed inset-0 z-[110] bg-black/98 flex items-center justify-center p-8" onClick={() => setSelectedTienda(null)}>
          <div className="text-center animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <h2 className="text-4xl font-black italic mb-2 tracking-tighter">{selectedTienda.nombre_tienda}</h2>
            <p className="text-blue-500 font-bold text-xs tracking-[0.5em] mb-12 uppercase">{selectedTienda.codigo_qr}</p>
            <div className="bg-white p-10 rounded-[60px] inline-block shadow-2xl shadow-blue-500/20">
              <QRCodeSVG value={selectedTienda.codigo_qr} size={260} />
            </div>
            <p className="mt-12 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Escanea para validar entrega</p>
          </div>
        </div>
      )}
    </div>
  );
}
