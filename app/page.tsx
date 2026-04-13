'use client'
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  PlusCircle, MapPin, QrCode, Truck, Users, LayoutDashboard, 
  X, Save, Navigation, Edit2, Phone, Trash2, AlertTriangle, Package, ShoppingBag, CheckCircle2, ChevronRight, ListPlus, DollarSign
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function SFADashboard() {
  const [activeTab, setActiveTab] = useState('panel');
  const [loading, setLoading] = useState(true);
  
  // --- DATOS ---
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [equipo, setEquipo] = useState<any[]>([]);
  const [rutas, setRutas] = useState<any[]>([]);

  // --- UI & NOTIFICACIONES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTienda, setSelectedTienda] = useState<any>(null);
  const [selectedSocio, setSelectedSocio] = useState<any>(null);
  const [alertConfig, setAlertConfig] = useState<{show: boolean, type: 'error' | 'success', title: string, msg: string}>({
    show: false, type: 'success', title: '', msg: ''
  });

  // --- FORMULARIOS (ESTADOS FIJOS) ---
  const [editId, setEditId] = useState<string | null>(null);
  const [tNombre, setTNombre] = useState(''); const [tTel, setTTel] = useState('');
  const [pNombre, setPNombre] = useState(''); const [pPrecio, setPPrecio] = useState(''); const [pStock, setPStock] = useState('');
  const [sNombre, setSNombre] = useState(''); const [sTel, setSTel] = useState('');
  
  // Lógica de Ruta Temporal
  const [rutaRepartidorId, setRutaRepartidorId] = useState('');
  const [rutaTiendaId, setRutaTiendaId] = useState('');
  const [itemsPedido, setItemsPedido] = useState<any[]>([]);

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
      } else if (activeTab === 'rutas') {
        const { data } = await supabase.from('sfa_rutas').select('*, sfa_equipo(nombre)').order('created_at', { ascending: false });
        setRutas(data || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const showAlert = (type: 'error' | 'success', title: string, msg: string) => {
    setAlertConfig({ show: true, type, title, msg });
  };

  const handlePlusButton = () => {
    setEditId(null);
    setTNombre(''); setTTel(''); setPNombre(''); setPPrecio(''); setPStock(''); setSNombre(''); setSTel('');
    setRutaTiendaId(''); setItemsPedido([]);
    setIsModalOpen(true);
  };

  const agregarProductoARuta = (prod: any) => {
    const existe = itemsPedido.find(i => i.id === prod.id);
    if (existe) {
      setItemsPedido(itemsPedido.map(i => i.id === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i));
    } else {
      setItemsPedido([...itemsPedido, { ...prod, cantidad: 1 }]);
    }
  };

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    let res;
    if (activeTab === 'panel') {
      const p = { nombre_tienda: tNombre, telefono: tTel };
      res = await supabase.from('sfa_tiendas').insert([{ ...p, codigo_qr: `SFA-${Math.random().toString(36).substr(2, 7).toUpperCase()}` }]);
    } else if (activeTab === 'productos') {
      const p = { nombre: pNombre, precio: parseFloat(pPrecio), stock: parseInt(pStock) };
      res = await supabase.from('sfa_productos').insert([p]);
    } else if (activeTab === 'equipo') {
      res = await supabase.from('sfa_equipo').insert([{ nombre: sNombre, telefono: sTel }]);
    } else if (activeTab === 'rutas') {
      const total = itemsPedido.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
      const { data: rData } = await supabase.from('sfa_rutas').insert([{ repartidor_id: rutaRepartidorId, total_efectivo_esperado: total }]).select().single();
      if (rData) {
        const { data: pedData } = await supabase.from('sfa_pedidos').insert([{ ruta_id: rData.id, tienda_id: rutaTiendaId, total_pago: total }]).select().single();
        const items = itemsPedido.map(i => ({ pedido_id: pedData.id, producto_id: i.id, cantidad: i.cantidad, precio_unitario: i.precio, subtotal: i.precio * i.cantidad }));
        res = await supabase.from('sfa_pedido_items').insert(items);
      }
    }

    if (res?.error) showAlert('error', 'Error Velasco', res.error.message);
    else { setIsModalOpen(false); cargarDatos(); showAlert('success', '¡Éxito!', 'Sincronizado con la nube.'); }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans selection:bg-blue-500/30 antialiased">
      {/* HEADER */}
      <header className="p-6 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <div>
            <h1 className="text-2xl font-black text-blue-500 tracking-tighter italic">VELASCO DIGITAL</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{activeTab}</p>
          </div>
          <button onClick={handlePlusButton} className="bg-blue-600 p-2.5 rounded-full shadow-lg shadow-blue-600/40 active:scale-90"><PlusCircle size={26} /></button>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" /></div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* PANEL TIENDAS */}
            {activeTab === 'panel' && tiendas.map(t => (
              <div key={t.id} onClick={() => setSelectedTienda(t)} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[24px] mb-4 flex justify-between items-center active:bg-zinc-800">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${t.latitud ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'bg-zinc-800 text-zinc-500'}`}><MapPin size={24} /></div>
                  <div><h3 className="font-bold text-base">{t.nombre_tienda}</h3><p className="text-xs text-zinc-500">{t.telefono || 'Sin WhatsApp'}</p></div>
                </div>
                <ChevronRight size={20} className="text-zinc-700" />
              </div>
            ))}

            {/* PRODUCTOS */}
            {activeTab === 'productos' && (
              <div className="grid grid-cols-2 gap-4">
                {productos.map(p => (
                  <div key={p.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[32px]">
                    <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500 w-fit mb-4"><Package size={22}/></div>
                    <h3 className="font-bold text-sm mb-1">{p.nombre}</h3>
                    <p className="text-blue-500 font-black text-lg">${p.precio}</p>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Stock: {p.stock}</span>
                  </div>
                ))}
              </div>
            )}

            {/* RUTAS ACTIVAS */}
            {activeTab === 'rutas' && rutas.map(r => (
              <div key={r.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[32px] mb-4 relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-black italic">{r.sfa_equipo?.nombre}</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{r.fecha}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-green-500">${r.total_efectivo_esperado}</p>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase">A Cobrar</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <div className="h-2 flex-1 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-blue-600 w-1/2"></div></div>
                   <span className="text-[10px] font-black text-blue-500 uppercase">En Progreso</span>
                </div>
              </div>
            ))}

            {/* EQUIPO (SOCIOS) */}
            {activeTab === 'equipo' && equipo.map(s => (
              <div key={s.id} onClick={() => setSelectedSocio(s)} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[24px] mb-4 flex justify-between items-center active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-zinc-800 text-zinc-400"><Users size={24} /></div>
                  <div><h3 className="font-bold text-base">{s.nombre}</h3><p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Socio Activo</p></div>
                </div>
                <ChevronRight size={20} className="text-zinc-700" />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* NOTIFICACIÓN TIPO IPHONE */}
      {alertConfig.show && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-zinc-900/95 border border-zinc-800 w-full max-w-[280px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-8 text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${alertConfig.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {alertConfig.type === 'success' ? <CheckCircle2 size={32}/> : <AlertTriangle size={32} />}
              </div>
              <h2 className="text-xl font-bold mb-2 italic tracking-tight">{alertConfig.title}</h2>
              <p className="text-xs text-zinc-500 leading-relaxed">{alertConfig.msg}</p>
            </div>
            <button onClick={() => setAlertConfig({...alertConfig, show: false})} className="w-full p-5 text-xs font-black border-t border-zinc-800 active:bg-zinc-800 uppercase tracking-widest">Entendido</button>
          </div>
        </div>
      )}

      {/* MODAL MAESTRO ADAPTABLE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] bg-black/90 p-4 flex items-end sm:items-center justify-center animate-in slide-in-from-bottom duration-500">
          <div className="bg-zinc-900 w-full max-w-md rounded-t-[40px] sm:rounded-[40px] border border-zinc-800 p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic tracking-tighter">NUEVO {activeTab.toUpperCase()}</h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-zinc-800 p-2 rounded-full text-zinc-500"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleGuardar} className="space-y-4">
              {activeTab === 'panel' && (
                <><input required placeholder="Nombre de la Tienda" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none focus:border-blue-500" value={tNombre} onChange={e => setTNombre(e.target.value)} /><input placeholder="WhatsApp de Contacto" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={tTel} onChange={e => setTTel(e.target.value)} /></>
              )}
              {activeTab === 'productos' && (
                <><input required placeholder="Nombre del Artículo / Producto" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none focus:border-blue-500" value={pNombre} onChange={e => setPNombre(e.target.value)} /><div className="grid grid-cols-2 gap-4"><input required type="number" placeholder="Precio $" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={pPrecio} onChange={e => setPPrecio(e.target.value)} /><input required type="number" placeholder="Stock" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={pStock} onChange={e => setPStock(e.target.value)} /></div></>
              )}
              {activeTab === 'equipo' && (
                <><input required placeholder="Nombre del Socio" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none focus:border-blue-500" value={sNombre} onChange={e => setSNombre(e.target.value)} /><input placeholder="Teléfono" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={sTel} onChange={e => setSTel(e.target.value)} /></>
              )}
              {activeTab === 'rutas' && (
                <div className="space-y-4">
                   <select required className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={rutaRepartidorId} onChange={e => setRutaRepartidorId(e.target.value)}><option value="">Asignar Socio (Repartidor)</option>{equipo.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select>
                   <select required className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={rutaTiendaId} onChange={e => setRutaTiendaId(e.target.value)}><option value="">Seleccionar Tienda de Destino</option>{tiendas.map(t => <option key={t.id} value={t.id}>{t.nombre_tienda}</option>)}</select>
                   <div className="bg-black border border-zinc-800 rounded-3xl p-6 space-y-4">
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Inventario Disponible</p>
                      <div className="flex gap-2 overflow-x-auto pb-4">{productos.map(p => <button key={p.id} type="button" onClick={() => agregarProductoARuta(p)} className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap active:bg-blue-600 transition-colors">+{p.nombre}</button>)}</div>
                      <div className="space-y-2">{itemsPedido.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50 animate-in fade-in">
                          <span className="text-xs font-bold">{item.nombre} <span className="text-blue-500">x{item.cantidad}</span></span>
                          <span className="text-xs font-black">${item.precio * item.cantidad}</span>
                        </div>
                      ))}</div>
                   </div>
                   <div className="bg-blue-600/10 border border-blue-600/30 p-5 rounded-3xl flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Total Desglose:</span>
                      <span className="text-2xl font-black text-white">${itemsPedido.reduce((acc, i) => acc + (i.precio * i.cantidad), 0)}</span>
                   </div>
                </div>
              )}
              <button type="submit" className="w-full bg-blue-600 p-5 rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-blue-600/30 active:scale-95 transition-all">GUARDAR REGISTRO</button>
            </form>
          </div>
        </div>
      )}

      {/* PERFIL INTERACTIVO DE SOCIO (PERFIL DE LUIS) */}
      {selectedSocio && (
        <div className="fixed inset-0 z-[500] bg-black p-8 animate-in fade-in duration-300">
           <button onClick={() => setSelectedSocio(null)} className="absolute top-10 right-10 bg-zinc-900 p-3 rounded-full text-zinc-500"><X size={24}/></button>
           <div className="text-center mt-20">
              <div className="w-24 h-24 bg-zinc-900 rounded-[40px] flex items-center justify-center mx-auto mb-6 border border-zinc-800 shadow-2xl shadow-blue-500/10"><Users size={40} className="text-blue-500" /></div>
              <h2 className="text-4xl font-black italic tracking-tighter">{selectedSocio.nombre}</h2>
              <div className="flex items-center justify-center gap-2 mt-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Socio en Línea</p></div>
              
              <div className="mt-16 space-y-4">
                 <button onClick={() => { setSelectedSocio(null); setActiveTab('rutas'); handlePlusButton(); }} className="w-full bg-zinc-900 border border-zinc-800 p-6 rounded-[32px] flex items-center justify-between group active:bg-blue-600 transition-all">
                    <div className="flex items-center gap-4"><Truck className="text-blue-500 group-active:text-white" /><span className="font-bold">Asignar Nueva Ruta</span></div>
                    <ChevronRight className="text-zinc-700 group-active:text-white" />
                 </button>
                 <button className="w-full bg-zinc-900 border border-zinc-800 p-6 rounded-[32px] flex items-center justify-between opacity-40">
                    <div className="flex items-center gap-4"><LayoutDashboard className="text-green-500" /><span className="font-bold">Ver Progreso Real</span></div>
                    <ChevronRight className="text-zinc-700" />
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* QR VIEW (LIMPIO FONDO NEGRO) */}
      {selectedTienda && (
        <div className="fixed inset-0 z-[400] bg-black flex flex-col items-center justify-center p-8 animate-in fade-in">
           <button onClick={() => setSelectedTienda(null)} className="absolute top-10 right-10 bg-zinc-900 p-3 rounded-full"><X size={24}/></button>
           <div className="text-center">
              <h2 className="text-4xl font-black italic mb-2 tracking-tighter">{selectedTienda.nombre_tienda}</h2>
              <p className="text-blue-500 font-bold text-xs tracking-[0.5em] mb-12 uppercase">{selectedTienda.codigo_qr}</p>
              <div className="bg-white p-10 rounded-[60px] inline-block shadow-2xl shadow-blue-500/40 animate-in zoom-in">
                <QRCodeSVG value={selectedTienda.codigo_qr} size={260} />
              </div>
              <p className="mt-12 text-zinc-600 text-[10px] font-black tracking-widest uppercase">Validación Exclusiva Velasco Digital</p>
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
