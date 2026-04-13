'use client'
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  PlusCircle, MapPin, QrCode, Truck, Users, LayoutDashboard, 
  X, Save, Navigation, Edit2, Phone, Trash2, AlertTriangle, Package, ShoppingBag, CheckCircle2, ChevronRight, ListPlus
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
  const [alertConfig, setAlertConfig] = useState<{show: boolean, type: 'error' | 'success' | 'delete', title: string, msg: string, action?: any}>({
    show: false, type: 'error', title: '', msg: ''
  });

  // --- FORMULARIOS ---
  const [editId, setEditId] = useState<string | null>(null);
  // Estados para Rutas (Logística)
  const [tempTiendaId, setTempTiendaId] = useState('');
  const [tempItems, setTempItems] = useState<any[]>([]); // {prodId, cant, precio}
  const [repartidorId, setRepartidorId] = useState('');

  // Estados Campos
  const [tNombre, setTNombre] = useState(''); const [tTel, setTTel] = useState('');
  const [pNombre, setPNombre] = useState(''); const [pPrecio, setPPrecio] = useState('');
  const [pStock, setPStock] = useState(''); const [sNombre, setSNombre] = useState('');
  const [sTel, setSTel] = useState('');

  useEffect(() => { cargarDatos(); }, [activeTab]);

  async function cargarDatos() {
    setLoading(true);
    try {
      const fetchs = {
        panel: () => supabase.from('sfa_tiendas').select('*').order('created_at', { ascending: false }),
        productos: () => supabase.from('sfa_productos').select('*').order('nombre', { ascending: true }),
        equipo: () => supabase.from('sfa_equipo').select('*').order('nombre', { ascending: true }),
        rutas: () => supabase.from('sfa_rutas').select('*, sfa_equipo(nombre)').order('created_at', { ascending: false })
      };
      const { data } = await fetchs[activeTab as keyof typeof fetchs]();
      if (activeTab === 'panel') setTiendas(data || []);
      if (activeTab === 'productos') setProductos(data || []);
      if (activeTab === 'equipo') setEquipo(data || []);
      if (activeTab === 'rutas') setRutas(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const showAlert = (type: 'error' | 'success' | 'delete', title: string, msg: string, action?: any) => {
    setAlertConfig({ show: true, type, title, msg, action });
  };

  const handlePlusButton = () => {
    setEditId(null); setTempTiendaId(''); setTempItems([]);
    setTNombre(''); setTTel(''); pNombre(''); pPrecio(''); pStock(''); sNombre(''); sTel('');
    setIsModalOpen(true);
  };

  // --- LÓGICA DE AGREGAR ITEM A RUTA ---
  const addItemARuta = (prodId: string) => {
    const prod = productos.find(p => p.id === prodId);
    if (!prod) return;
    setTempItems([...tempItems, { id: prod.id, nombre: prod.nombre, precio: prod.precio, cantidad: 1 }]);
  };

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    let res;
    if (activeTab === 'panel') {
      const p = { nombre_tienda: tNombre, telefono: tTel };
      res = editId ? await supabase.from('sfa_tiendas').update(p).eq('id', editId) : await supabase.from('sfa_tiendas').insert([{ ...p, codigo_qr: `SFA-${Math.random().toString(36).substr(2, 7).toUpperCase()}` }]);
    } else if (activeTab === 'productos') {
      const p = { nombre: pNombre, precio: parseFloat(pPrecio), stock: parseInt(pStock) };
      res = editId ? await supabase.from('sfa_productos').update(p).eq('id', editId) : await supabase.from('sfa_productos').insert([p]);
    } else if (activeTab === 'equipo') {
      res = await supabase.from('sfa_equipo').insert([{ nombre: sNombre, telefono: sTel }]);
    } else if (activeTab === 'rutas') {
      // Lógica Compleja de Ruta
      const total = tempItems.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
      const { data: rutaNueva } = await supabase.from('sfa_rutas').insert([{ repartidor_id: repartidorId, total_efectivo_esperado: total }]).select().single();
      if (rutaNueva) {
        const { data: pedido } = await supabase.from('sfa_pedidos').insert([{ ruta_id: rutaNueva.id, tienda_id: tempTiendaId, total_cobro: total }]).select().single();
        const items = tempItems.map(i => ({ pedido_id: pedido.id, producto_id: i.id, cantidad: i.cantidad, precio_unitario: i.precio, subtotal: i.precio * i.cantidad }));
        res = await supabase.from('sfa_pedido_items').insert(items);
      }
    }

    if (res?.error) showAlert('error', 'Velasco Error', res.error.message);
    else { setIsModalOpen(false); cargarDatos(); showAlert('success', '¡Excelente!', 'Registro actualizado en Velasco Digital.'); }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans selection:bg-blue-500/30 overflow-x-hidden antialiased">
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
          <div className="flex flex-col items-center justify-center py-32"><div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" /></div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* TIENDAS */}
            {activeTab === 'panel' && tiendas.map(t => (
              <div key={t.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[24px] mb-4 flex justify-between items-center" onClick={() => setSelectedTienda(t)}>
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${t.latitud ? 'bg-blue-600' : 'bg-zinc-800 text-zinc-500'}`}><MapPin size={24} /></div>
                  <div><h3 className="font-bold text-base">{t.nombre_tienda}</h3><p className="text-xs text-zinc-500">{t.telefono || 'Sin contacto'}</p></div>
                </div>
                <ChevronRight size={20} className="text-zinc-700" />
              </div>
            ))}

            {/* STOCK (CORREGIDO PRODUCTO/ARTICULO) */}
            {activeTab === 'productos' && (
              <div className="grid grid-cols-2 gap-4">
                {productos.map(p => (
                  <div key={p.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[32px] relative">
                    <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500 w-fit mb-4"><Package size={22}/></div>
                    <h3 className="font-bold text-sm mb-1">{p.nombre}</h3>
                    <p className="text-blue-500 font-black text-lg">${p.precio}</p>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase">Disponible: {p.stock}</span>
                  </div>
                ))}
              </div>
            )}

            {/* RUTAS (LOGÍSTICA) */}
            {activeTab === 'rutas' && rutas.map(r => (
              <div key={r.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[24px] mb-4">
                <div className="flex justify-between items-center mb-4">
                   <div className="flex items-center gap-3">
                     <div className="p-3 bg-blue-600/10 text-blue-500 rounded-xl"><Truck size={20}/></div>
                     <div><h3 className="font-bold text-sm">{r.sfa_equipo?.nombre}</h3><p className="text-[10px] text-zinc-500">{r.fecha}</p></div>
                   </div>
                   <div className="text-right"><p className="text-lg font-black text-green-500">${r.total_efectivo_esperado}</p><p className="text-[9px] text-zinc-500 uppercase">Efectivo Total</p></div>
                </div>
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-blue-600 w-1/3"></div></div>
              </div>
            ))}

            {/* EQUIPO (SOCIOS INTERACTIVOS) */}
            {activeTab === 'equipo' && equipo.map(s => (
              <div key={s.id} onClick={() => setSelectedSocio(s)} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[24px] mb-4 flex justify-between items-center active:bg-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-zinc-800 text-zinc-400"><Users size={24} /></div>
                  <div><h3 className="font-bold text-base">{s.nombre}</h3><p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Ver Perfil Socio</p></div>
                </div>
                <ChevronRight size={20} className="text-zinc-700" />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* NOTIFICACIÓN IPHONE STYLE */}
      {alertConfig.show && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900/95 border border-zinc-800 w-full max-w-[280px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-8 text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${alertConfig.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {alertConfig.type === 'success' ? <CheckCircle2 size={32}/> : <AlertTriangle size={32} />}
              </div>
              <h2 className="text-xl font-bold mb-2 italic">{alertConfig.title}</h2>
              <p className="text-xs text-zinc-500 leading-relaxed">{alertConfig.msg}</p>
            </div>
            <button onClick={() => setAlertConfig({...alertConfig, show: false})} className="w-full p-5 text-xs font-black border-t border-zinc-800 active:bg-zinc-800">ENTENDIDO</button>
          </div>
        </div>
      )}

      {/* MODAL MAESTRO (ADAPTABLE) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] bg-black/90 p-4 flex items-end sm:items-center justify-center animate-in slide-in-from-bottom duration-500">
          <div className="bg-zinc-900 w-full max-w-md rounded-t-[40px] sm:rounded-[40px] border border-zinc-800 p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic">NUEVO {activeTab.toUpperCase()}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-600"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleGuardar} className="space-y-4">
              {activeTab === 'panel' && (
                <><input required placeholder="Nombre Tienda" className="w-full bg-black border border-zinc-800 rounded-2xl p-4" value={tNombre} onChange={e => setTNombre(e.target.value)} /><input placeholder="Teléfono" className="w-full bg-black border border-zinc-800 rounded-2xl p-4" value={tTel} onChange={e => setTTel(e.target.value)} /></>
              )}
              {activeTab === 'productos' && (
                <><input required placeholder="Producto / Artículo" className="w-full bg-black border border-zinc-800 rounded-2xl p-4" value={pNombre} onChange={e => setPNombre(e.target.value)} /><div className="grid grid-cols-2 gap-4"><input required type="number" placeholder="Precio $" className="w-full bg-black border border-zinc-800 rounded-2xl p-4" value={pPrecio} onChange={e => setPPrecio(e.target.value)} /><input required type="number" placeholder="Stock" className="w-full bg-black border border-zinc-800 rounded-2xl p-4" value={pStock} onChange={e => setPStock(e.target.value)} /></div></>
              )}
              {activeTab === 'equipo' && (
                <><input required placeholder="Nombre de Socio" className="w-full bg-black border border-zinc-800 rounded-2xl p-4" value={sNombre} onChange={e => setSNombre(e.target.value)} /><input placeholder="Teléfono WhatsApp" className="w-full bg-black border border-zinc-800 rounded-2xl p-4" value={sTel} onChange={e => setSTel(e.target.value)} /></>
              )}
              {activeTab === 'rutas' && (
                <div className="space-y-4">
                  <select required className="w-full bg-black border border-zinc-800 rounded-2xl p-4" value={repartidorId} onChange={e => setRepartidorId(e.target.value)}><option value="">Seleccionar Repartidor</option>{equipo.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select>
                  <select required className="w-full bg-black border border-zinc-800 rounded-2xl p-4" value={tempTiendaId} onChange={e => setTempTiendaId(e.target.value)}><option value="">Seleccionar Tienda</option>{tiendas.map(t => <option key={t.id} value={t.id}>{t.nombre_tienda}</option>)}</select>
                  <div className="bg-black border border-zinc-800 rounded-2xl p-4 space-y-2">
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-2">Agregar Pedido</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">{productos.map(p => <button key={p.id} type="button" onClick={() => addItemARuta(p.id)} className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap">+{p.nombre}</button>)}</div>
                    <div className="mt-4 space-y-2">{tempItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-zinc-900 p-3 rounded-xl">
                        <span>{item.nombre} x {item.cantidad}</span>
                        <span className="font-bold text-blue-500">${item.precio * item.cantidad}</span>
                      </div>
                    ))}</div>
                  </div>
                  <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-600/20 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase">Total a Cobrar:</span>
                    <span className="text-xl font-black text-blue-500">${tempItems.reduce((acc, i) => acc + (i.precio * i.cantidad), 0)}</span>
                  </div>
                </div>
              )}
              <button type="submit" className="w-full bg-blue-600 p-5 rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-blue-600/30">GUARDAR REGISTRO</button>
            </form>
          </div>
        </div>
      )}

      {/* PERFIL DE SOCIO (INTERACCIÓN) */}
      {selectedSocio && (
        <div className="fixed inset-0 z-[500] bg-black p-8 animate-in fade-in duration-300">
           <button onClick={() => setSelectedSocio(null)} className="absolute top-10 right-10 text-zinc-500"><X size={32}/></button>
           <div className="text-center mt-20">
              <div className="w-24 h-24 bg-zinc-900 rounded-[40px] flex items-center justify-center mx-auto mb-6 border border-zinc-800"><Users size={40} className="text-blue-500" /></div>
              <h2 className="text-4xl font-black italic">{selectedSocio.nombre}</h2>
              <p className="text-zinc-500 font-bold tracking-widest mt-2">{selectedSocio.telefono}</p>
              
              <div className="mt-12 space-y-4">
                 <button onClick={() => { setSelectedSocio(null); setActiveTab('rutas'); handlePlusButton(); }} className="w-full bg-zinc-900 border border-zinc-800 p-6 rounded-[32px] flex items-center justify-between">
                    <div className="flex items-center gap-4"><Truck className="text-blue-500" /><span className="font-bold">Asignar Nueva Ruta</span></div>
                    <ChevronRight className="text-zinc-700" />
                 </button>
                 <button className="w-full bg-zinc-900 border border-zinc-800 p-6 rounded-[32px] flex items-center justify-between opacity-50">
                    <div className="flex items-center gap-4"><LayoutDashboard className="text-green-500" /><span className="font-bold">Monitorear en Vivo</span></div>
                    <ChevronRight className="text-zinc-700" />
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* QR VIEW (LIMPIO) */}
      {selectedTienda && (
        <div className="fixed inset-0 z-[400] bg-black flex flex-col items-center justify-center p-8 animate-in fade-in">
           <button onClick={() => setSelectedTienda(null)} className="absolute top-10 right-10 bg-zinc-900 p-3 rounded-full"><X size={24}/></button>
           <div className="text-center">
              <h2 className="text-4xl font-black italic mb-2">{selectedTienda.nombre_tienda}</h2>
              <p className="text-blue-500 font-bold text-xs tracking-[0.5em] mb-12 uppercase">{selectedTienda.codigo_qr}</p>
              <div className="bg-white p-10 rounded-[60px] inline-block shadow-2xl shadow-blue-500/40 animate-in zoom-in">
                <QRCodeSVG value={selectedTienda.codigo_qr} size={260} />
              </div>
              <p className="mt-12 text-zinc-600 text-[10px] font-black tracking-widest uppercase">Escanea para Validar Entrega</p>
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
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`p-4 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? 'bg-blue-600 text-white scale-110' : 'text-zinc-500'}`}>
            {tab.icon}
          </button>
        ))}
      </nav>
    </div>
  );
}
