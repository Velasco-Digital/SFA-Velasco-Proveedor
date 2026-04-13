'use client'
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  PlusCircle, MapPin, QrCode, Truck, Users, LayoutDashboard, 
  X, Save, Navigation, Edit2, Phone, Trash2, AlertTriangle, Package, ShoppingBag, CheckCircle2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function SFADashboard() {
  const [activeTab, setActiveTab] = useState('panel');
  const [loading, setLoading] = useState(true);
  
  // --- DATOS ---
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [equipo, setEquipo] = useState<any[]>([]);

  // --- UI & NOTIFICACIONES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTienda, setSelectedTienda] = useState<any>(null);
  const [alertConfig, setAlertConfig] = useState<{show: boolean, type: 'error' | 'success' | 'delete', title: string, msg: string, action?: any}>({
    show: false, type: 'error', title: '', msg: ''
  });

  // --- FORMULARIOS ---
  const [editId, setEditId] = useState<string | null>(null);
  const [tNombre, setTNombre] = useState(''); const [tDueno, setTDueno] = useState('');
  const [tTel, setTTel] = useState(''); const [tDir, setTDir] = useState('');
  const [tCoords, setTCoords] = useState({ lat: null, lng: null });
  const [pNombre, setPNombre] = useState(''); const [pPrecio, setPPrecio] = useState('');
  const [pStock, setPStock] = useState(''); const [sNombre, setSNombre] = useState('');
  const [sTel, setSTel] = useState('');

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

  // Lanzador de Alertas Estilo iPhone
  const showAlert = (type: 'error' | 'success' | 'delete', title: string, msg: string, action?: any) => {
    setAlertConfig({ show: true, type, title, msg, action });
  };

  const handlePlusButton = () => {
    setEditId(null);
    setTNombre(''); setTDueno(''); setTTel(''); setTDir(''); setTCoords({lat:null, lng:null});
    setPNombre(''); setPPrecio(''); setPStock(''); setSNombre(''); setSTel('');
    setIsModalOpen(true);
  };

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    let res;
    if (activeTab === 'panel') {
      const p = { nombre_tienda: tNombre, dueno: tDueno, telefono: tTel, direccion: tDir, latitud: tCoords.lat, longitud: tCoords.lng };
      res = editId ? await supabase.from('sfa_tiendas').update(p).eq('id', editId) : await supabase.from('sfa_tiendas').insert([{ ...p, codigo_qr: `SFA-${Math.random().toString(36).substr(2, 7).toUpperCase()}` }]);
    } else if (activeTab === 'productos') {
      const p = { nombre: pNombre, precio: parseFloat(pPrecio), stock: parseInt(pStock) };
      res = editId ? await supabase.from('sfa_productos').update(p).eq('id', editId) : await supabase.from('sfa_productos').insert([p]);
    } else if (activeTab === 'equipo') {
      const p = { nombre: sNombre, telefono: sTel };
      res = editId ? await supabase.from('sfa_equipo').update(p).eq('id', editId) : await supabase.from('sfa_equipo').insert([p]);
    }

    if (res?.error) {
      showAlert('error', 'Fallo en Nube', res.error.message);
    } else {
      setIsModalOpen(false);
      cargarDatos();
      showAlert('success', '¡Listo!', 'Registro guardado correctamente.');
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* HEADER */}
      <header className="p-6 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <div>
            <h1 className="text-2xl font-black text-blue-500 tracking-tighter italic">VELASCO DIGITAL</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{activeTab}</p>
          </div>
          <button onClick={handlePlusButton} className="bg-blue-600 p-2.5 rounded-full shadow-lg shadow-blue-600/40 active:scale-90 transition-transform">
            <PlusCircle size={26} />
          </button>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'panel' && tiendas.map(t => (
              <div key={t.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[24px] mb-4 flex justify-between items-center">
                <div className="flex items-center gap-4 flex-1" onClick={() => setSelectedTienda(t)}>
                  <div className={`p-4 rounded-2xl ${t.latitud ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}><MapPin size={24} /></div>
                  <div><h3 className="font-bold text-base">{t.nombre_tienda}</h3><p className="text-xs text-zinc-500">{t.telefono || 'Sin contacto'}</p></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditId(t.id); setTNombre(t.nombre_tienda); setTTel(t.telefono); setIsModalOpen(true); }} className="p-2 text-zinc-500"><Edit2 size={20}/></button>
                  <button onClick={() => showAlert('delete', '¿Borrar Tienda?', 'Esta acción es permanente.', async () => { await supabase.from('sfa_tiendas').delete().eq('id', t.id); cargarDatos(); })} className="p-2 text-red-900/40"><Trash2 size={20}/></button>
                </div>
              </div>
            ))}

            {activeTab === 'productos' && (
              <div className="grid grid-cols-2 gap-4">
                {productos.map(p => (
                  <div key={p.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[32px] relative group">
                    <button onClick={() => showAlert('delete', '¿Borrar?', p.nombre, async () => { await supabase.from('sfa_productos').delete().eq('id', p.id); cargarDatos(); })} className="absolute top-4 right-4 text-red-900/40"><Trash2 size={16}/></button>
                    <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500 w-fit mb-4"><Package size={22}/></div>
                    <h3 className="font-bold text-sm mb-1">{p.nombre}</h3>
                    <p className="text-blue-500 font-black text-lg">${p.precio}</p>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase">Stock: {p.stock || 0}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'rutas' && (
              <div className="space-y-4">
                <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-[32px] text-center">
                  <Truck size={40} className="mx-auto text-blue-500 mb-3" />
                  <h2 className="font-bold">Nueva Hoja de Ruta</h2>
                  <p className="text-xs text-zinc-500 mt-1">Asigna tiendas y productos a un repartidor.</p>
                  <button className="mt-4 bg-blue-600 px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest">Crear Ruta</button>
                </div>
                <div className="text-center py-10 text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">No hay rutas activas</div>
              </div>
            )}

            {activeTab === 'equipo' && equipo.map(s => (
              <div key={s.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[24px] mb-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-zinc-800 text-zinc-400"><Users size={24} /></div>
                  <div><h3 className="font-bold text-base">{s.nombre}</h3><p className="text-xs text-blue-500 font-bold uppercase tracking-widest">En Línea</p></div>
                </div>
                <button onClick={() => showAlert('delete', '¿Quitar?', s.nombre, async () => { await supabase.from('sfa_equipo').delete().eq('id', s.id); cargarDatos(); })} className="p-2 text-red-900/40"><Trash2 size={20}/></button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* NOTIFICACIÓN IPHONE STYLE (GLOBAL) */}
      {alertConfig.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-zinc-900/90 border border-zinc-800 w-full max-w-[280px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-8 text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${alertConfig.type === 'error' || alertConfig.type === 'delete' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                {alertConfig.type === 'success' ? <CheckCircle2 size={32}/> : <AlertTriangle size={32} />}
              </div>
              <h2 className="text-xl font-bold mb-2 italic">{alertConfig.title}</h2>
              <p className="text-xs text-zinc-500 leading-relaxed">{alertConfig.msg}</p>
            </div>
            <div className="flex border-t border-zinc-800">
              <button onClick={() => setAlertConfig({...alertConfig, show: false})} className="flex-1 p-5 text-xs font-medium border-r border-zinc-800 active:bg-zinc-800">
                {alertConfig.type === 'delete' ? 'Cancelar' : 'Entendido'}
              </button>
              {alertConfig.type === 'delete' && (
                <button onClick={() => { alertConfig.action(); setAlertConfig({...alertConfig, show: false}); }} className="flex-1 p-5 text-xs font-black text-red-500 active:bg-zinc-800">Confirmar</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORMULARIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 p-4 flex items-end sm:items-center justify-center animate-in slide-in-from-bottom duration-500">
          <div className="bg-zinc-900 w-full max-w-md rounded-t-[40px] sm:rounded-[40px] border border-zinc-800 p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic">{editId ? 'EDITAR' : 'NUEVO'} {activeTab.toUpperCase()}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-600"><X size={24}/></button>
            </div>
            <form onSubmit={handleGuardar} className="space-y-4">
              {activeTab === 'panel' && (
                <>
                  <input required placeholder="Tienda" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={tNombre} onChange={e => setTNombre(e.target.value)} />
                  <input placeholder="Teléfono" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={tTel} onChange={e => setTTel(e.target.value)} />
                  <button type="button" onClick={() => { navigator.geolocation.getCurrentPosition(p => setTCoords({lat: p.coords.latitude as any, lng: p.coords.longitude as any})) }} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold ${tCoords.lat ? 'border-blue-500 text-blue-500' : 'border-zinc-800 text-zinc-500'}`}><Navigation size={20}/> {tCoords.lat ? 'GPS OK ✓' : 'FIJAR GPS'}</button>
                </>
              )}
              {activeTab === 'productos' && (
                <>
                  <input required placeholder="Nombre Café/Producto" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={pNombre} onChange={e => setPNombre(e.target.value)} />
                  <div className="grid grid-cols-2 gap-4">
                    <input required type="number" step="0.01" placeholder="Precio $" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={pPrecio} onChange={e => setPPrecio(e.target.value)} />
                    <input required type="number" placeholder="Stock" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={pStock} onChange={e => setPStock(e.target.value)} />
                  </div>
                </>
              )}
              {activeTab === 'equipo' && (
                <>
                  <input required placeholder="Nombre del Repartidor" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={sNombre} onChange={e => setSNombre(e.target.value)} />
                  <input placeholder="Teléfono" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={sTel} onChange={e => setSTel(e.target.value)} />
                </>
              )}
              <button type="submit" className="w-full bg-blue-600 p-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-600/30">GUARDAR</button>
            </form>
          </div>
        </div>
      )}

      {/* QR VIEW (REDISEÑADO CON FONDO SÓLIDO) */}
      {selectedTienda && (
        <div className="fixed inset-0 z-[400] bg-black flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
           <button onClick={() => setSelectedTienda(null)} className="absolute top-10 right-10 bg-zinc-900 p-3 rounded-full text-white"><X size={24}/></button>
           <div className="text-center">
              <h2 className="text-4xl font-black italic mb-2">{selectedTienda.nombre_tienda}</h2>
              <p className="text-blue-500 font-bold text-xs tracking-[0.5em] mb-12">{selectedTienda.codigo_qr}</p>
              <div className="bg-white p-10 rounded-[60px] inline-block shadow-2xl shadow-blue-500/40 animate-in zoom-in">
                <QRCodeSVG value={selectedTienda.codigo_qr} size={260} />
              </div>
              <p className="mt-12 text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">Exclusivo Velasco Digital</p>
           </div>
        </div>
      )}

      {/* NAV INFERIOR */}
      <nav className="fixed bottom-8 left-6 right-6 bg-zinc-900/80 backdrop-blur-2xl border border-white/5 p-2 rounded-[32px] flex justify-around items-center z-40 shadow-2xl">
        {[
          {id:'panel', icon: <LayoutDashboard size={22}/>},
          {id:'productos', icon: <ShoppingBag size={22}/>},
          {id:'rutas', icon: <Truck size={22}/>},
          {id:'equipo', icon: <Users size={22}/>}
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`p-4 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-600/30' : 'text-zinc-500'}`}>
            {tab.icon}
          </button>
        ))}
      </nav>
    </div>
  );
}
