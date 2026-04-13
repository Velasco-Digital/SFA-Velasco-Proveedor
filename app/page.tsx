'use client'
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  PlusCircle, MapPin, QrCode, Truck, Users, LayoutDashboard, 
  X, Save, Navigation, Edit2, Phone, Trash2, AlertTriangle, Package, ShoppingBag, CheckCircle2, ChevronRight, Search, Clock, Hash
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

  // --- MODALES & UI ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTienda, setSelectedTienda] = useState<any>(null);
  const [selectedSocio, setSelectedSocio] = useState<any>(null);
  const [activeRouteDetail, setActiveRouteDetail] = useState<any>(null);
  const [selectorType, setSelectorType] = useState<'repartidor' | 'tienda' | null>(null);
  
  // Modal de Cantidad (iPhone Style)
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [tempQuantityInput, setTempQuantityInput] = useState('1');

  // Notificación (iPhone Style)
  const [alertConfig, setAlertConfig] = useState<any>({ show: false, type: 'success', title: '', msg: '' });

  // --- FORMULARIOS ---
  const [editId, setEditId] = useState<string | null>(null);
  const [tNombre, setTNombre] = useState(''); const [tTel, setTTel] = useState('');
  const [pNombre, setPNombre] = useState(''); const [pPrecio, setPPrecio] = useState(''); const [pStock, setPStock] = useState('');
  const [sNombre, setSNombre] = useState(''); const [sTel, setSTel] = useState('');

  // --- LÓGICA DE RUTA AVANZADA ---
  const [rutaSocio, setRutaSocio] = useState<any>(null);
  const [paradas, setParadas] = useState<any[]>([]); 
  const [currentTienda, setCurrentTienda] = useState<any>(null);
  const [filtroProd, setFiltroProd] = useState('');

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
        const { data } = await supabase.from('sfa_rutas').select('*, sfa_equipo(nombre), sfa_pedidos(*, sfa_tiendas(*))').order('created_at', { ascending: false });
        setRutas(data || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const handlePlusButton = () => {
    setEditId(null);
    setRutaSocio(null); setParadas([]); setCurrentTienda(null);
    setTNombre(''); setTTel(''); setPNombre(''); setPPrecio(''); setPStock(''); setSNombre(''); setSTel('');
    setIsModalOpen(true);
  };

  const showAlert = (type: 'error' | 'success', title: string, msg: string) => {
    setAlertConfig({ show: true, type, title, msg });
  };

  const prodsFiltrados = useMemo(() => {
    if (!filtroProd) return []; 
    return productos.filter(p => p.nombre.toLowerCase().includes(filtroProd.toLowerCase()));
  }, [productos, filtroProd]);

  // Abre modal de cantidad pro en lugar del prompt nativo
  const iniciarAgregadoProducto = (prod: any) => {
    setPendingProduct(prod);
    setTempQuantityInput('1');
    setIsQuantityModalOpen(true);
  };

  const confirmarCantidadProducto = () => {
    const cant = parseInt(tempQuantityInput) || 1;
    if (cant <= 0 || !pendingProduct || !currentTienda) {
        setIsQuantityModalOpen(false);
        return;
    }

    const paradaIdx = paradas.findIndex(p => p.tienda.id === currentTienda.id);
    let nuevasParadas = [...paradas];

    if (paradaIdx === -1) {
      nuevasParadas.push({ tienda: currentTienda, items: [{ ...pendingProduct, cantidad: cant }] });
    } else {
      const itemIdx = nuevasParadas[paradaIdx].items.findIndex((i: any) => i.id === pendingProduct.id);
      if (itemIdx === -1) nuevasParadas[paradaIdx].items.push({ ...pendingProduct, cantidad: cant });
      else nuevasParadas[paradaIdx].items[itemIdx].cantidad += cant;
    }
    setParadas(nuevasParadas);
    setFiltroProd('');
    setIsQuantityModalOpen(false);
    setPendingProduct(null);
  };

  // Lógica de guardado de ruta FIX
  async function guardarRuta() {
    if (!rutaSocio) {
        showAlert('error', 'Falta Socio', 'Por favor selecciona un repartidor para la ruta.');
        return;
    }
    if (paradas.length === 0) {
        showAlert('error', 'Sin Paradas', 'Agrega al menos una tienda con productos a la ruta.');
        return;
    }

    const totalRuta = paradas.reduce((acc, p) => acc + p.items.reduce((ai:any, i:any)=> ai + (i.precio * i.cantidad), 0), 0);
    
    // 1. Guardar Ruta Maestra
    const { data: rData, error: rError } = await supabase.from('sfa_rutas').insert([{ repartidor_id: rutaSocio.id, total_efectivo_esperado: totalRuta }]).select().single();
    
    if (rError) {
        showAlert('error', 'Error Nube', rError.message);
        return;
    }

    if (rData) {
      for (const p of paradas) {
        const totalP = p.items.reduce((ai:any, i:any)=> ai + (i.precio * i.cantidad), 0);
        // 2. Guardar Pedido por Tienda
        const { data: pedData, error: pedError } = await supabase.from('sfa_pedidos').insert([{ ruta_id: rData.id, tienda_id: p.tienda.id, total_pago: totalP }]).select().single();
        
        if (pedData) {
          // 3. Guardar Desglose de Productos
          const items = p.items.map((i:any) => ({ pedido_id: pedData.id, producto_id: i.id, cantidad: i.cantidad, precio_unitario: i.precio, subtotal: i.precio * i.cantidad }));
          const { error: itemsError } = await supabase.from('sfa_pedido_items').insert(items);
          if (itemsError) console.error("Error al guardar items de tienda:", p.tienda.nombre_tienda, itemsError.message);
        } else if (pedError) {
            console.error("Error al guardar pedido de tienda:", p.tienda.nombre_tienda, pedError.message);
        }
      }
      setIsModalOpen(false); 
      cargarDatos();
      showAlert('success', 'Ruta Asignada ✓', `Socio ${rutaSocio.nombre} sincronizado.`);
    }
  }

  async function handleGuardarGral(e: React.FormEvent) {
    e.preventDefault();
    if (activeTab === 'rutas') { guardarRuta(); return; }
    
    let res;
    if (activeTab === 'panel') {
      res = await supabase.from('sfa_tiendas').insert([{ nombre_tienda: tNombre, telefono: tTel, codigo_qr: `SFA-${Math.random().toString(36).substr(2, 7).toUpperCase()}` }]);
    } else if (activeTab === 'productos') {
      res = await supabase.from('sfa_productos').insert([{ nombre: pNombre, precio: parseFloat(pPrecio), stock: parseInt(pStock) }]);
    } else if (activeTab === 'equipo') {
      res = await supabase.from('sfa_equipo').insert([{ nombre: sNombre, telefono: sTel }]);
    }
    if (!res?.error) { setIsModalOpen(false); cargarDatos(); showAlert('success', '¡Éxito!', 'Datos sincronizados.'); }
    else { showAlert('error', 'Error', res.error.message); }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans selection:bg-blue-500/30 antialiased overflow-x-hidden">
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
          <div className="flex flex-col items-center justify-center py-32"><div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" /></div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* TIENDAS */}
            {activeTab === 'panel' && tiendas.map(t => (
              <div key={t.id} onClick={() => setSelectedTienda(t)} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[24px] mb-4 flex justify-between items-center active:bg-zinc-800 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${t.latitud ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'bg-zinc-800 text-zinc-500'}`}><MapPin size={24} /></div>
                  <div><h3 className="font-bold text-base leading-tight">{t.nombre_tienda}</h3><p className="text-xs text-zinc-500 mt-0.5">{t.telefono || 'Sin contacto'}</p></div>
                </div>
                <ChevronRight size={20} className="text-zinc-700" />
              </div>
            ))}

            {/* PRODUCTOS (STOCK) */}
            {activeTab === 'productos' && (
              <div className="grid grid-cols-2 gap-4">
                {productos.map(p => (
                  <div key={p.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[32px]">
                    <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500 w-fit mb-4"><Package size={22}/></div>
                    <h3 className="font-bold text-sm mb-1 leading-tight">{p.nombre}</h3>
                    <p className="text-blue-500 font-black text-lg">${p.precio}</p>
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Existencia: {p.stock}</span>
                  </div>
                ))}
              </div>
            )}

            {/* RUTAS (MONITOREO) */}
            {activeTab === 'rutas' && rutas.map(r => (
              <div key={r.id} onClick={() => setActiveRouteDetail(r)} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[32px] mb-4 active:scale-[0.98] transition-all relative">
                <div className="flex justify-between items-start mb-6">
                  <div><h3 className="text-lg font-black italic">{r.sfa_equipo?.nombre}</h3><p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">{r.fecha}</p></div>
                  <div className="text-right"><p className="text-2xl font-black text-green-500">${r.total_efectivo_esperado}</p><p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter italic">Total Ruta</p></div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex -space-x-2">
                     {r.sfa_pedidos?.map((p:any, i:number) => (
                       <div key={i} className={`w-3 h-3 rounded-full border border-black ${p.estado === 'entregado' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-zinc-700'}`} />
                     ))}
                   </div>
                   <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Tiendas Visitadas: {r.sfa_pedidos?.filter((p:any)=>p.estado==='entregado').length}/{r.sfa_pedidos?.length}</span>
                </div>
              </div>
            ))}

            {/* EQUIPO */}
            {activeTab === 'equipo' && equipo.map(s => (
              <div key={s.id} onClick={() => setSelectedSocio(s)} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[24px] mb-4 flex justify-between items-center active:bg-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-zinc-800 text-zinc-400"><Users size={24} /></div>
                  <div><h3 className="font-bold text-base">{s.nombre}</h3><p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Socio Estratégico</p></div>
                </div>
                <ChevronRight size={20} className="text-zinc-700" />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL DE CANTIDAD PRO (IPHONE STYLE) */}
      {isQuantityModalOpen && pendingProduct && (
        <div className="fixed inset-0 z-[800] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-[300px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-8 text-center">
              <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500 w-fit mb-5 mx-auto"><Hash size={24}/></div>
              <h2 className="text-lg font-bold mb-2 italic tracking-tighter">Asignar Cantidad</h2>
              <p className="text-[11px] text-zinc-500 leading-relaxed uppercase font-black mb-5 tracking-widest">{pendingProduct.nombre}</p>
              
              <input 
                type="number"
                value={tempQuantityInput}
                onChange={e => setTempQuantityInput(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-center text-3xl font-black text-blue-500 outline-none focus:border-blue-500"
                placeholder="0"
                autoFocus
              />
            </div>
            <div className="flex border-t border-zinc-800">
              <button onClick={() => setIsQuantityModalOpen(false)} className="flex-1 p-5 text-xs font-medium border-r border-zinc-800 active:bg-zinc-800 text-zinc-400 uppercase tracking-widest">Cancelar</button>
              <button onClick={confirmarCantidadProducto} className="flex-1 p-5 text-xs font-black text-blue-500 active:bg-zinc-800 uppercase tracking-widest">Confirmar ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SHEETS IPHONE STYLE */}
      {selectorType && (
        <div className="fixed inset-0 z-[700] bg-black/60 backdrop-blur-sm flex items-end animate-in fade-in duration-300" onClick={() => setSelectorType(null)}>
          <div className="bg-zinc-900 w-full rounded-t-[40px] p-8 max-h-[70vh] overflow-y-auto animate-in slide-in-from-bottom duration-500 shadow-2xl border-t border-zinc-800" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-8" />
            <h2 className="text-xl font-black italic mb-6 uppercase tracking-tighter">Seleccionar {selectorType === 'repartidor' ? 'Socio' : 'Tienda'}</h2>
            <div className="space-y-3 pb-10">
              {(selectorType === 'repartidor' ? equipo : tiendas).length === 0 ? (
                 <p className="text-center text-zinc-600 text-xs py-10 uppercase font-black">No hay registros aún</p>
              ) : (
                (selectorType === 'repartidor' ? equipo : tiendas).map((item: any) => (
                  <button key={item.id} onClick={() => {
                    if (selectorType === 'repartidor') setRutaSocio(item);
                    else setCurrentTienda(item);
                    setSelectorType(null);
                  }} className="w-full bg-black border border-zinc-800 p-5 rounded-2xl flex justify-between items-center active:bg-blue-600 transition-colors">
                    <span className="font-bold text-white uppercase text-sm tracking-tight">{item.nombre || item.nombre_tienda}</span>
                    <ChevronRight size={18} className="text-zinc-700" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL MAESTRO ADAPTABLE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] bg-black/90 p-4 flex items-end sm:items-center justify-center animate-in slide-in-from-bottom duration-500">
          <div className="bg-zinc-900 w-full max-w-md rounded-t-[40px] sm:rounded-[40px] border border-zinc-800 p-8 max-h-[95vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">{editId ? 'Editar' : 'Nuevo'} {activeTab}</h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-zinc-800 p-2 rounded-full text-zinc-500 active:scale-90"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleGuardarGral} className="space-y-4">
              {activeTab === 'panel' && (
                <><input required placeholder="Nombre de la Tienda" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={tNombre} onChange={e => setTNombre(e.target.value)} /><input placeholder="Teléfono" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={tTel} onChange={e => setTTel(e.target.value)} /></>
              )}
              {activeTab === 'productos' && (
                <><input required placeholder="Nombre del Artículo / Producto" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={pNombre} onChange={e => setPNombre(e.target.value)} /><div className="grid grid-cols-2 gap-4"><input required type="number" placeholder="Precio $" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={pPrecio} onChange={e => setPPrecio(e.target.value)} /><input required type="number" placeholder="Stock" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={pStock} onChange={e => setPStock(e.target.value)} /></div></>
              )}
              {activeTab === 'equipo' && (
                <><input required placeholder="Nombre del Socio" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={sNombre} onChange={e => setSNombre(e.target.value)} /><input placeholder="Teléfono" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={sTel} onChange={e => setSTel(e.target.value)} /></>
              )}
              {activeTab === 'rutas' && (
                <div className="space-y-5 pb-5">
                   <button type="button" onClick={() => setSelectorType('repartidor')} className="w-full bg-black border border-zinc-800 p-5 rounded-2xl flex justify-between items-center text-left active:border-blue-500 transition-all shadow-inner">
                      <div><p className="text-[10px] font-black text-zinc-600 uppercase mb-1">Repartidor Asignado</p><p className="font-bold text-blue-500 text-lg uppercase italic">{rutaSocio?.nombre || 'Elegir Socio'}</p></div>
                      <ChevronRight size={20} className="text-zinc-700"/>
                   </button>

                   <div className="bg-zinc-950 border border-zinc-800 rounded-[32px] p-6 space-y-4 shadow-2xl">
                      <div className="flex justify-between items-center px-1">
                         <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Tiendas en Ruta: {paradas.length}</p>
                         <button type="button" onClick={() => setSelectorType('tienda')} className="text-blue-500 text-[11px] font-black italic">+ AGREGAR PARADA</button>
                      </div>

                      {currentTienda && (
                        <div className="bg-blue-600/5 border border-blue-500/20 p-5 rounded-[24px] animate-in zoom-in duration-300">
                           <div className="flex justify-between items-center mb-4"><p className="text-[10px] font-black text-blue-500 uppercase italic">Cargar para: {currentTienda.nombre_tienda}</p><button type="button" onClick={()=>setCurrentTienda(null)} className="text-zinc-600"><X size={16}/></button></div>
                           <div className="relative mb-4"><Search className="absolute left-3 top-3 text-zinc-600" size={16} /><input placeholder="Buscar producto por nombre..." className="w-full bg-black border border-zinc-800 rounded-xl p-3 pl-10 text-xs text-white" value={filtroProd} onChange={e => setFiltroProd(e.target.value)} /></div>
                           <div className="max-h-48 overflow-y-auto space-y-2 pr-1">{prodsFiltrados.map(p => (
                                <button key={p.id} type="button" onClick={() => iniciarAgregadoProducto(p)} className="w-full bg-zinc-900/50 p-3 rounded-xl text-[10px] font-bold text-left border border-zinc-800 flex justify-between items-center"><span>{p.nombre}</span> <span className="text-blue-500 font-black">${p.precio}</span></button>
                              ))}</div>
                        </div>
                      )}

                      <div className="space-y-3">
                         {paradas.map((p, idx) => (
                           <div key={idx} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-lg animate-in slide-in-from-left">
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-black italic text-blue-400 uppercase">{p.tienda.nombre_tienda}</span>
                                <span className="text-xs font-black text-green-500">${p.items.reduce((acc:any, i:any)=> acc + (i.precio*i.cantidad), 0)}</span>
                              </div>
                              <div className="space-y-1.5 border-t border-zinc-800/50 pt-2">{p.items.map((i:any, ix:number)=> (
                                <p key={ix} className="text-[10px] text-zinc-500 flex justify-between font-medium"><span>{i.nombre} <span className="text-white font-black">x{i.cantidad}</span></span> <span>${i.precio*i.cantidad}</span></p>
                              ))}</div>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="bg-blue-600 p-6 rounded-[32px] flex justify-between items-center shadow-2xl shadow-blue-600/40">
                      <div><p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Total Ruta GDL</p><p className="text-2xl font-black text-white italic">${paradas.reduce((acc, p) => acc + p.items.reduce((accI:number, i:any) => accI + (i.precio*i.cantidad), 0), 0)}</p></div>
                      {/* FIXED SAVE BUTTON TYPE */}
                      <button type="submit" className="bg-white text-blue-600 p-3.5 rounded-2xl active:scale-90 transition-all shadow-xl"><Save size={24}/></button>
                   </div>
                </div>
              )}
              {activeTab !== 'rutas' && (
                <button type="submit" className="w-full bg-blue-600 p-5 rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-blue-600/30 active:scale-95 transition-all">Sincronizar Velasco Digital</button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* DETALLE DE MONITOREO (RUTAS 24/7) */}
      {activeRouteDetail && (
        <div className="fixed inset-0 z-[600] bg-black p-8 animate-in fade-in duration-300 overflow-y-auto antialiased relative">
           <div className="max-w-2xl mx-auto">
              <button onClick={() => setActiveRouteDetail(null)} className="absolute top-10 right-10 bg-zinc-900 p-3 rounded-full text-zinc-500 active:scale-90 shadow-lg"><X size={24}/></button>
              <div className="mt-12 mb-12">
                 <h2 className="text-4xl font-black italic tracking-tighter text-blue-500 uppercase">{activeRouteDetail.sfa_equipo?.nombre}</h2>
                 <p className="text-zinc-500 font-bold tracking-[0.3em] uppercase text-[10px] mt-1">Socio en Ruta • Monitoreo 24/7</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-10">
                 <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[36px]"><p className="text-[10px] font-black text-zinc-500 uppercase mb-2 italic">Efectivo Total</p><p className="text-2xl font-black text-green-500">${activeRouteDetail.total_efectivo_esperado}</p></div>
                 <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[36px]"><p className="text-[10px] font-black text-zinc-500 uppercase mb-2 italic">Visitas OK</p><p className="text-2xl font-black text-white">{activeRouteDetail.sfa_pedidos?.filter((p:any)=>p.estado==='entregado').length}/{activeRouteDetail.sfa_pedidos?.length}</p></div>
              </div>

              <h3 className="text-xs font-black text-zinc-600 uppercase tracking-[0.4em] mb-6 ml-4">Desglose de Paradas</h3>
              <div className="space-y-5 pb-10">
                 {activeRouteDetail.sfa_pedidos?.map((pedido: any, idx: number) => (
                   <div key={idx} className={`bg-zinc-900/50 border ${pedido.estado === 'entregado' ? 'border-green-500/30 shadow-lg shadow-green-500/5' : 'border-zinc-800'} p-6 rounded-[36px] transition-all`}>
                      <div className="flex justify-between items-start mb-6">
                         <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl ${pedido.estado === 'entregado' ? 'bg-green-500 text-white shadow-xl shadow-green-500/30' : 'bg-zinc-800 text-zinc-600'}`}><MapPin size={22}/></div>
                            <div><h4 className="font-bold text-base leading-tight uppercase italic">{pedido.sfa_tiendas?.nombre_tienda}</h4><p className={`text-[10px] font-black uppercase mt-1 ${pedido.estado === 'entregado' ? 'text-green-500' : 'text-zinc-500'}`}>{pedido.estado}</p></div>
                         </div>
                         <div className="text-right"><p className="text-base font-black text-white">${pedido.total_pago}</p></div>
                      </div>
                      <div className="flex items-center gap-6 py-4 border-t border-zinc-800/50">
                         <div className="flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase"><Clock size={12} className="text-blue-500"/> Escaneo: {pedido.hora_escaneo ? new Date(pedido.hora_escaneo).toLocaleTimeString() : '--:--:--'}</div>
                         <div className="flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase"><CheckCircle2 size={12} className={pedido.estado === 'entregado' ? 'text-green-500' : 'text-zinc-700'}/> Validado QR ✓</div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* PERFIL INTERACTIVO (LUIS) */}
      {selectedSocio && (
        <div className="fixed inset-0 z-[500] bg-black p-8 animate-in fade-in duration-300">
           <button onClick={() => setSelectedSocio(null)} className="absolute top-10 right-10 bg-zinc-900 p-3 rounded-full shadow-lg"><X size={24}/></button>
           <div className="text-center mt-20 max-w-md mx-auto">
              <div className="w-24 h-24 bg-zinc-900 rounded-[44px] flex items-center justify-center mx-auto mb-6 border border-zinc-800 shadow-2xl shadow-blue-500/20"><Users size={44} className="text-blue-500" /></div>
              <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">{selectedSocio.nombre}</h2>
              <p className="text-zinc-500 font-bold tracking-[0.5em] text-[10px] mt-2 uppercase">{selectedSocio.telefono}</p>
              
              <div className="mt-16 space-y-4 text-left">
                 <button onClick={() => { setSelectedSocio(null); setActiveTab('rutas'); handlePlusButton(); setRutaSocio(selectedSocio); }} className="w-full bg-zinc-900 border border-zinc-800 p-6 rounded-[36px] flex items-center justify-between group active:bg-blue-600 transition-all shadow-lg">
                    <div className="flex items-center gap-4"><Truck className="text-blue-500 group-active:text-white" /><span className="font-black text-sm uppercase tracking-widest">Asignar Nueva Ruta</span></div>
                    <ChevronRight size={24} className="text-zinc-700 group-active:text-white" />
                 </button>
                 <button onClick={() => { setSelectedSocio(null); setActiveTab('rutas'); }} className="w-full bg-zinc-900 border border-zinc-800 p-6 rounded-[36px] flex items-center justify-between group active:bg-green-600 transition-all shadow-lg">
                    <div className="flex items-center gap-4"><LayoutDashboard className="text-green-500 group-active:text-white" /><span className="font-black text-sm uppercase tracking-widest">Monitorear Actividad</span></div>
                    <ChevronRight size={24} className="text-zinc-700 group-active:text-white" />
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* ALERTA TIPO IPHONE */}
      {alertConfig.show && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-zinc-900/95 border border-zinc-800 w-full max-w-[280px] rounded-[36px] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-8 text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 ${alertConfig.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {alertConfig.type === 'success' ? <CheckCircle2 size={36}/> : <AlertTriangle size={36} />}
              </div>
              <h2 className="text-2xl font-black mb-2 italic tracking-tight">{alertConfig.title}</h2>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-bold uppercase tracking-tighter">{alertConfig.msg}</p>
            </div>
            <button onClick={() => setAlertConfig({...alertConfig, show: false})} className="w-full p-6 text-[10px] font-black border-t border-zinc-800 active:bg-zinc-800 uppercase tracking-[0.2em] text-white">Entendido</button>
          </div>
        </div>
      )}

      {/* QR VIEW */}
      {selectedTienda && (
        <div className="fixed inset-0 z-[400] bg-black flex flex-col items-center justify-center p-8 animate-in fade-in relative">
           <button onClick={() => setSelectedTienda(null)} className="absolute top-10 right-10 bg-zinc-900 p-3 rounded-full shadow-xl"><X size={24}/></button>
           <div className="text-center animate-in zoom-in duration-300">
              <h2 className="text-5xl font-black italic mb-2 tracking-tighter text-white uppercase">{selectedTienda.nombre_tienda}</h2>
              <p className="text-blue-500 font-black text-xs tracking-[0.6em] mb-12 uppercase">{selectedTienda.codigo_qr}</p>
              <div className="bg-white p-12 rounded-[70px] inline-block shadow-2xl shadow-blue-500/40">
                <QRCodeSVG value={selectedTienda.codigo_qr} size={280} />
              </div>
              <p className="mt-12 text-zinc-600 text-[10px] font-black tracking-[0.4em] uppercase italic">Auditoría Digital Velasco</p>
           </div>
        </div>
      )}

      {/* NAV INFERIOR */}
      <nav className="fixed bottom-8 left-6 right-6 bg-zinc-900/80 backdrop-blur-2xl border border-white/5 p-2 rounded-[36px] flex justify-around items-center z-40 shadow-2xl">
        {[
          {id:'panel', icon: <LayoutDashboard size={22}/>},
          {id:'productos', icon: <ShoppingBag size={22}/>},
          {id:'rutas', icon: <Truck size={22}/>},
          {id:'equipo', icon: <Users size={22}/>}
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`p-4 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-600/30' : 'text-zinc-500 hover:text-white'}`}>
            {tab.icon}
          </button>
        ))}
      </nav>
    </div>
  );
}
