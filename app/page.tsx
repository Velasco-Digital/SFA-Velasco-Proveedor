'use client'
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  PlusCircle, MapPin, QrCode, Truck, Users, LayoutDashboard, 
  X, Save, Navigation, Edit2, Phone, Trash2, AlertTriangle, Package, ShoppingBag, CheckCircle2, ChevronRight, Search, Clock, Hash
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function SFADashboard() {
  // --- NAVEGACIÓN Y CARGA ---
  const [activeTab, setActiveTab] = useState('panel');
  const [loading, setLoading] = useState(true);
  
  // --- REPOSITORIO DE DATOS ---
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [equipo, setEquipo] = useState<any[]>([]);
  const [rutas, setRutas] = useState<any[]>([]);

  // --- INTERFAZ (MODALES Y POPUPS) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTienda, setSelectedTienda] = useState<any>(null);
  const [selectedSocio, setSelectedSocio] = useState<any>(null);
  const [activeRouteDetail, setActiveRouteDetail] = useState<any>(null);
  
  // Selectores Tipo iPhone (Bottom Sheets)
  const [selectorType, setSelectorType] = useState<'repartidor' | 'tienda' | null>(null);
  
  // Modal de Cantidad (No más prompts feos)
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [tempQuantityInput, setTempQuantityInput] = useState('1');

  // Alertas iPhone Style
  const [alertConfig, setAlertConfig] = useState<any>({ show: false, type: 'success', title: '', msg: '' });

  // --- ESTADOS DE FORMULARIOS ---
  const [editId, setEditId] = useState<string | null>(null);
  const [tNombre, setTNombre] = useState(''); const [tTel, setTTel] = useState('');
  const [pNombre, setPNombre] = useState(''); const [pPrecio, setPPrecio] = useState(''); const [pStock, setPStock] = useState('');
  const [sNombre, setSNombre] = useState(''); const [sTel, setSTel] = useState('');

  // --- LÓGICA DE RUTAS MULTITIENDA ---
  const [rutaSocio, setRutaSocio] = useState<any>(null);
  const [paradas, setParadas] = useState<any[]>([]); 
  const [currentTienda, setCurrentTienda] = useState<any>(null);
  const [filtroProd, setFiltroProd] = useState('');

  useEffect(() => { cargarDatos(); }, [activeTab]);

  async function cargarDatos() {
    setLoading(true);
    try {
      // Cargamos todo lo necesario para que los selectores siempre tengan datos
      const { data: eData } = await supabase.from('sfa_equipo').select('*').order('nombre');
      const { data: tData } = await supabase.from('sfa_tiendas').select('*').order('nombre_tienda');
      const { data: pData } = await supabase.from('sfa_productos').select('*').order('nombre');
      
      setEquipo(eData || []);
      setTiendas(tData || []);
      setProductos(pData || []);

      if (activeTab === 'rutas') {
        const { data: rData } = await supabase.from('sfa_rutas').select('*, sfa_equipo(nombre), sfa_pedidos(*, sfa_tiendas(*))').order('created_at', { ascending: false });
        setRutas(rData || []);
      }
    } catch (e) { console.error("Error Velasco:", e); }
    setLoading(false);
  }

  // --- MANEJO DE NOTIFICACIONES ---
  const showAlert = (type: 'error' | 'success', title: string, msg: string) => {
    setAlertConfig({ show: true, type, title, msg });
  };

  // --- ACCIÓN PRINCIPAL (+) ---
  const handlePlusButton = () => {
    setEditId(null);
    setRutaSocio(null); setParadas([]); setCurrentTienda(null);
    setTNombre(''); setTTel(''); setPNombre(''); setPPrecio(''); setPStock(''); setSNombre(''); setSTel('');
    setIsModalOpen(true);
  };

  // --- BUSCADOR INTELIGENTE ---
  const prodsFiltrados = useMemo(() => {
    if (!filtroProd) return [];
    return productos.filter(p => p.nombre.toLowerCase().includes(filtroProd.toLowerCase()));
  }, [productos, filtroProd]);

  // --- LÓGICA DE AGREGAR PRODUCTOS (MODAL IPHONE) ---
  const abrirModalCantidad = (prod: any) => {
    setPendingProduct(prod);
    setTempQuantityInput('1');
    setIsQuantityModalOpen(true);
  };

  const confirmarCantidad = () => {
    const cant = parseInt(tempQuantityInput) || 1;
    if (!currentTienda || !pendingProduct) return;

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

  // --- GUARDADO DE RUTA (LÓGICA MAESTRA) ---
  async function ejecutarGuardadoRuta() {
    if (!rutaSocio || paradas.length === 0) {
      showAlert('error', 'Faltan Datos', 'Asegúrate de tener socio y al menos una tienda.');
      return;
    }

    const totalRuta = paradas.reduce((acc, p) => acc + p.items.reduce((ai:any, i:any)=> ai + (i.precio * i.cantidad), 0), 0);
    
    // 1. Crear la Ruta
    const { data: rData, error: rError } = await supabase.from('sfa_rutas').insert([{ 
      repartidor_id: rutaSocio.id, 
      total_efectivo_esperado: totalRuta 
    }]).select().single();

    if (rError) { showAlert('error', 'Error SQL', rError.message); return; }

    if (rData) {
      for (const p of paradas) {
        const totalP = p.items.reduce((ai:any, i:any)=> ai + (i.precio * i.cantidad), 0);
        // 2. Crear Pedido por Tienda
        const { data: pedData } = await supabase.from('sfa_pedidos').insert([{ 
          ruta_id: rData.id, 
          tienda_id: p.tienda.id, 
          total_pago: totalP,
          estado: 'pendiente'
        }]).select().single();

        if (pedData) {
          // 3. Crear Items del Pedido
          const items = p.items.map((i:any) => ({ 
            pedido_id: pedData.id, 
            producto_id: i.id, 
            cantidad: i.cantidad, 
            precio_unitario: i.precio, 
            subtotal: i.precio * i.cantidad 
          }));
          await supabase.from('sfa_pedido_items').insert(items);
        }
      }
      setIsModalOpen(false);
      await cargarDatos();
      showAlert('success', 'Ruta Creada', `Socio ${rutaSocio.nombre} sincronizado con éxito.`);
    }
  }

  async function handleGuardarGeneral(e: React.FormEvent) {
    e.preventDefault();
    if (activeTab === 'rutas') { await ejecutarGuardadoRuta(); return; }
    
    let res;
    if (activeTab === 'panel') {
      res = await supabase.from('sfa_tiendas').insert([{ nombre_tienda: tNombre, telefono: tTel, codigo_qr: `SFA-${Math.random().toString(36).substr(2, 7).toUpperCase()}` }]);
    } else if (activeTab === 'productos') {
      res = await supabase.from('sfa_productos').insert([{ nombre: pNombre, precio: parseFloat(pPrecio), stock: parseInt(pStock) }]);
    } else if (activeTab === 'equipo') {
      res = await supabase.from('sfa_equipo').insert([{ nombre: sNombre, telefono: sTel }]);
    }

    if (!res?.error) { 
      setIsModalOpen(false); 
      await cargarDatos(); 
      showAlert('success', 'Guardado', 'Sincronizado con Velasco Digital.'); 
    } else {
      showAlert('error', 'Error', res.error.message);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans selection:bg-blue-500/30 antialiased overflow-x-hidden">
      
      {/* HEADER PREMIUM */}
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

      {/* CONTENIDO PRINCIPAL */}
      <main className="p-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32"><div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" /></div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* VISTA TIENDAS */}
            {activeTab === 'panel' && tiendas.map(t => (
              <div key={t.id} onClick={() => setSelectedTienda(t)} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[24px] mb-4 flex justify-between items-center active:bg-zinc-800 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${t.latitud ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'bg-zinc-800 text-zinc-500'}`}><MapPin size={24} /></div>
                  <div><h3 className="font-bold text-base leading-tight uppercase italic">{t.nombre_tienda}</h3><p className="text-xs text-zinc-500 mt-0.5">{t.telefono || 'Sin WhatsApp'}</p></div>
                </div>
                <ChevronRight size={20} className="text-zinc-700" />
              </div>
            ))}

            {/* VISTA STOCK */}
            {activeTab === 'productos' && (
              <div className="grid grid-cols-2 gap-4">
                {productos.map(p => (
                  <div key={p.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[32px] hover:border-blue-500/30 transition-colors">
                    <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500 w-fit mb-4"><Package size={22}/></div>
                    <h3 className="font-bold text-sm mb-1 uppercase tracking-tight">{p.nombre}</h3>
                    <p className="text-blue-500 font-black text-lg">${p.precio}</p>
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Stock: {p.stock}</span>
                  </div>
                ))}
              </div>
            )}

            {/* VISTA RUTAS (MONITOREO) */}
            {activeTab === 'rutas' && (
              rutas.length === 0 ? (
                <div className="text-center py-20 text-zinc-600 uppercase font-black text-xs">No hay rutas asignadas hoy</div>
              ) : (
                rutas.map(r => (
                  <div key={r.id} onClick={() => setActiveRouteDetail(r)} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[32px] mb-4 active:scale-[0.98] transition-all">
                    <div className="flex justify-between items-start mb-6">
                      <div><h3 className="text-lg font-black italic text-blue-500 uppercase">{r.sfa_equipo?.nombre}</h3><p className="text-[10px] text-zinc-500 font-bold uppercase">{r.fecha}</p></div>
                      <div className="text-right"><p className="text-2xl font-black text-green-500">${r.total_efectivo_esperado}</p><p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">Cobro Global</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="flex -space-x-2">
                         {r.sfa_pedidos?.map((p:any, i:number) => (
                           <div key={i} className={`w-3 h-3 rounded-full border border-black ${p.estado === 'entregado' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-zinc-700'}`} />
                         ))}
                       </div>
                       <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Paradas: {r.sfa_pedidos?.filter((p:any)=>p.estado==='entregado').length}/{r.sfa_pedidos?.length}</span>
                    </div>
                  </div>
                ))
              )
            )}

            {/* VISTA EQUIPO */}
            {activeTab === 'equipo' && equipo.map(s => (
              <div key={s.id} onClick={() => setSelectedSocio(s)} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[24px] mb-4 flex justify-between items-center active:bg-zinc-800 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-zinc-800 text-zinc-400"><Users size={24} /></div>
                  <div><h3 className="font-bold text-base leading-tight">{s.nombre}</h3><p className="text-[10px] text-blue-500 font-black uppercase tracking-widest italic">Socio Activo</p></div>
                </div>
                <ChevronRight size={20} className="text-zinc-700" />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL DE CANTIDAD PRO (IPHONE STYLE) */}
      {isQuantityModalOpen && pendingProduct && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-[300px] rounded-[36px] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-8 text-center">
              <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500 w-fit mb-5 mx-auto"><Hash size={24}/></div>
              <h2 className="text-2xl font-black italic mb-2 tracking-tight uppercase">{pendingProduct.nombre}</h2>
              <p className="text-[10px] text-zinc-500 font-black mb-6 tracking-widest uppercase">Indicar Cantidad</p>
              <input 
                type="number"
                value={tempQuantityInput}
                onChange={e => setTempQuantityInput(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-center text-4xl font-black text-blue-500 outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
            <div className="flex border-t border-zinc-800">
              <button onClick={() => setIsQuantityModalOpen(false)} className="flex-1 p-6 text-[10px] font-black border-r border-zinc-800 text-zinc-500 uppercase tracking-widest">Cancelar</button>
              <button onClick={confirmarCantidad} className="flex-1 p-6 text-[10px] font-black text-blue-500 uppercase tracking-widest">Confirmar ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SHEETS IPHONE STYLE */}
      {selectorType && (
        <div className="fixed inset-0 z-[800] bg-black/60 backdrop-blur-sm flex items-end animate-in fade-in duration-300" onClick={() => setSelectorType(null)}>
          <div className="bg-zinc-900 w-full rounded-t-[44px] p-8 max-h-[75vh] overflow-y-auto animate-in slide-in-from-bottom duration-500 shadow-2xl border-t border-zinc-800" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-10" />
            <h2 className="text-2xl font-black italic mb-8 uppercase tracking-tighter text-center">Seleccionar {selectorType === 'repartidor' ? 'Socio' : 'Tienda'}</h2>
            <div className="space-y-3 pb-12">
              {(selectorType === 'repartidor' ? equipo : tiendas).map((item: any) => (
                <button key={item.id} onClick={() => {
                  if (selectorType === 'repartidor') setRutaSocio(item);
                  else setCurrentTienda(item);
                  setSelectorType(null);
                }} className="w-full bg-black border border-zinc-800 p-6 rounded-[24px] flex justify-between items-center active:bg-blue-600 transition-all">
                  <span className="font-black text-white uppercase text-sm tracking-tight italic">{item.nombre || item.nombre_tienda}</span>
                  <ChevronRight size={20} className="text-zinc-700" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADAPTABLE (FORMULARIOS) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] bg-black/90 p-4 flex items-end sm:items-center justify-center animate-in slide-in-from-bottom duration-500">
          <div className="bg-zinc-900 w-full max-w-md rounded-t-[44px] sm:rounded-[44px] border border-zinc-800 p-8 max-h-[96vh] overflow-y-auto shadow-2xl shadow-blue-500/5">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">{editId ? 'Editar' : 'Nuevo'} {activeTab}</h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-zinc-800 p-2 rounded-full text-zinc-500 active:scale-90 shadow-lg"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleGuardarGeneral} className="space-y-4">
              {activeTab === 'panel' && (
                <><input required placeholder="Nombre de la Tienda" className="w-full bg-black border border-zinc-800 rounded-2xl p-5 outline-none focus:border-blue-500 font-bold" value={tNombre} onChange={e => setTNombre(e.target.value)} /><input placeholder="Teléfono WhatsApp" className="w-full bg-black border border-zinc-800 rounded-2xl p-5 outline-none font-bold" value={tTel} onChange={e => setTTel(e.target.value)} /></>
              )}
              {activeTab === 'productos' && (
                <><input required placeholder="Nombre del Artículo / Producto" className="w-full bg-black border border-zinc-800 rounded-2xl p-5 outline-none focus:border-blue-500 font-bold" value={pNombre} onChange={e => setPNombre(e.target.value)} /><div className="grid grid-cols-2 gap-4"><input required type="number" placeholder="Precio $" className="w-full bg-black border border-zinc-800 rounded-2xl p-5 outline-none font-bold" value={pPrecio} onChange={e => setPPrecio(e.target.value)} /><input required type="number" placeholder="Stock Inicial" className="w-full bg-black border border-zinc-800 rounded-2xl p-5 outline-none font-bold" value={pStock} onChange={e => setPStock(e.target.value)} /></div></>
              )}
              {activeTab === 'equipo' && (
                <><input required placeholder="Nombre del Socio" className="w-full bg-black border border-zinc-800 rounded-2xl p-5 outline-none focus:border-blue-500 font-bold" value={sNombre} onChange={e => setSNombre(e.target.value)} /><input placeholder="Número de Contacto" className="w-full bg-black border border-zinc-800 rounded-2xl p-5 outline-none font-bold" value={sTel} onChange={e => setSTel(e.target.value)} /></>
              )}
              {activeTab === 'rutas' && (
                <div className="space-y-6 pb-6">
                   <button type="button" onClick={() => setSelectorType('repartidor')} className="w-full bg-black border border-zinc-800 p-6 rounded-[28px] flex justify-between items-center text-left active:border-blue-500 transition-all shadow-inner">
                      <div><p className="text-[10px] font-black text-zinc-600 uppercase mb-1 tracking-widest">Socio Repartidor</p><p className="font-black text-blue-500 text-lg uppercase italic">{rutaSocio?.nombre || 'Elegir Miembro'}</p></div>
                      <Users size={24} className="text-zinc-700"/>
                   </button>

                   <div className="bg-zinc-950 border border-zinc-800 rounded-[36px] p-7 space-y-5 shadow-2xl relative">
                      <div className="flex justify-between items-center px-1">
                         <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest italic">Logística de Paradas: {paradas.length}</p>
                         <button type="button" onClick={() => setSelectorType('tienda')} className="text-blue-500 text-[11px] font-black italic underline decoration-blue-500/30">+ AGREGAR TIENDA</button>
                      </div>

                      {currentTienda && (
                        <div className="bg-blue-600/5 border border-blue-500/20 p-6 rounded-[32px] animate-in zoom-in duration-300">
                           <div className="flex justify-between items-center mb-5"><p className="text-[11px] font-black text-blue-500 uppercase italic">Cargar para: {currentTienda.nombre_tienda}</p><button type="button" onClick={()=>setCurrentTienda(null)} className="text-zinc-600"><X size={18}/></button></div>
                           <div className="relative mb-5"><Search className="absolute left-4 top-4 text-zinc-600" size={18} /><input placeholder="Buscar artículo..." className="w-full bg-black border border-zinc-800 rounded-2xl p-4 pl-12 text-xs text-white outline-none focus:border-blue-500 transition-all" value={filtroProd} onChange={e => setFiltroProd(e.target.value)} /></div>
                           <div className="max-h-52 overflow-y-auto space-y-2.5 pr-1">
                              {filtroProd && prodsFiltrados.length === 0 && <p className="text-center text-[10px] text-zinc-700 font-black uppercase py-4">No se encontró el producto</p>}
                              {prodsFiltrados.map(p => (
                                <button key={p.id} type="button" onClick={() => abrirModalCantidad(p)} className="w-full bg-zinc-900 p-4 rounded-2xl text-[11px] font-black text-left border border-zinc-800 flex justify-between items-center active:scale-95 transition-all uppercase tracking-tight"><span>{p.nombre}</span> <span className="text-blue-500">${p.precio}</span></button>
                              ))}
                           </div>
                        </div>
                      )}

                      <div className="space-y-4">
                         {paradas.map((p, idx) => (
                           <div key={idx} className="bg-zinc-900 border border-zinc-800 p-5 rounded-[28px] shadow-lg animate-in slide-in-from-left">
                              <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-black italic text-blue-400 uppercase tracking-tighter">{p.tienda.nombre_tienda}</span>
                                <span className="text-xs font-black text-green-500 bg-green-500/5 px-2 py-1 rounded-lg">${p.items.reduce((acc:any, i:any)=> acc + (i.precio*i.cantidad), 0)}</span>
                              </div>
                              <div className="space-y-2 border-t border-zinc-800/50 pt-3">{p.items.map((i:any, ix:number)=> (
                                <p key={ix} className="text-[10px] text-zinc-500 flex justify-between font-bold uppercase tracking-tighter"><span>{i.nombre} <span className="text-white">x{i.cantidad}</span></span> <span>${i.precio*i.cantidad}</span></p>
                              ))}</div>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="bg-blue-600 p-7 rounded-[40px] flex justify-between items-center shadow-2xl shadow-blue-600/40 border border-white/10">
                      <div><p className="text-[11px] font-black text-blue-100 uppercase tracking-widest italic mb-1">Total Global de Ruta</p><p className="text-3xl font-black text-white italic tracking-tighter">${paradas.reduce((acc, p) => acc + p.items.reduce((accI:number, i:any) => accI + (i.precio*i.cantidad), 0), 0)}</p></div>
                      <button type="submit" className="bg-white text-blue-600 p-4 rounded-[22px] active:scale-90 transition-all shadow-2xl"><Save size={28}/></button>
                   </div>
                </div>
              )}
              {activeTab !== 'rutas' && (
                <button type="submit" className="w-full bg-blue-600 p-6 rounded-[28px] font-black text-xs tracking-widest uppercase shadow-xl shadow-blue-600/30 active:scale-95 transition-all">Sincronizar Velasco Digital</button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* MONITOR DE RUTA 24/7 (DETALLE) */}
      {activeRouteDetail && (
        <div className="fixed inset-0 z-[600] bg-black p-8 animate-in fade-in duration-300 overflow-y-auto antialiased">
           <div className="max-w-2xl mx-auto relative">
              <button onClick={() => setActiveRouteDetail(null)} className="fixed top-10 right-10 bg-zinc-900 p-3 rounded-full text-zinc-500 active:scale-90 shadow-2xl border border-white/5 z-[610]"><X size={24}/></button>
              <div className="mt-14 mb-14">
                 <h2 className="text-5xl font-black italic tracking-tighter text-blue-500 uppercase">{activeRouteDetail.sfa_equipo?.nombre}</h2>
                 <p className="text-zinc-500 font-black tracking-[0.4em] uppercase text-[10px] mt-2">Logística Activa • Monitoreo Velasco Digital</p>
              </div>

              <div className="grid grid-cols-2 gap-5 mb-12">
                 <div className="bg-zinc-900 border border-zinc-800 p-7 rounded-[40px] shadow-2xl"><p className="text-[11px] font-black text-zinc-600 uppercase mb-3 italic tracking-widest">Efectivo Cobrado</p><p className="text-3xl font-black text-green-500 tracking-tighter">${activeRouteDetail.total_efectivo_esperado}</p></div>
                 <div className="bg-zinc-900 border border-zinc-800 p-7 rounded-[40px] shadow-2xl"><p className="text-[11px] font-black text-zinc-600 uppercase mb-3 italic tracking-widest">Visitas OK</p><p className="text-3xl font-black text-white tracking-tighter">{activeRouteDetail.sfa_pedidos?.filter((p:any)=>p.estado==='entregado').length}/{activeRouteDetail.sfa_pedidos?.length}</p></div>
              </div>

              <h3 className="text-xs font-black text-zinc-700 uppercase tracking-[0.5em] mb-8 ml-4">Reporte de Paradas</h3>
              <div className="space-y-6 pb-20">
                 {activeRouteDetail.sfa_pedidos?.map((pedido: any, idx: number) => (
                   <div key={idx} className={`bg-zinc-900/50 border ${pedido.estado === 'entregado' ? 'border-green-500/30 shadow-lg shadow-green-500/5' : 'border-zinc-800'} p-7 rounded-[44px] transition-all`}>
                      <div className="flex justify-between items-start mb-8">
                         <div className="flex items-center gap-5">
                            <div className={`p-5 rounded-[22px] ${pedido.estado === 'entregado' ? 'bg-green-500 text-white shadow-2xl shadow-green-500/40' : 'bg-zinc-800 text-zinc-600'}`}><MapPin size={24}/></div>
                            <div><h4 className="font-black text-lg leading-none uppercase italic tracking-tighter text-white">{pedido.sfa_tiendas?.nombre_tienda}</h4><p className={`text-[11px] font-black uppercase mt-2 tracking-widest ${pedido.estado === 'entregado' ? 'text-green-500' : 'text-zinc-500'}`}>{pedido.estado}</p></div>
                         </div>
                         <div className="text-right"><p className="text-lg font-black text-white italic">${pedido.total_pago}</p></div>
                      </div>
                      <div className="flex items-center gap-8 py-5 border-t border-zinc-800/50">
                         <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-tight"><Clock size={14} className="text-blue-500"/> Escaneo: {pedido.hora_escaneo ? new Date(pedido.hora_escaneo).toLocaleTimeString() : '--:--:--'}</div>
                         <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-tight"><CheckCircle2 size={14} className={pedido.estado === 'entregado' ? 'text-green-500' : 'text-zinc-700'}/> Validado QR ✓</div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* PERFIL DE LUIS INTERACTIVO */}
      {selectedSocio && (
        <div className="fixed inset-0 z-[500] bg-black p-8 animate-in fade-in duration-300">
           <button onClick={() => setSelectedSocio(null)} className="absolute top-10 right-10 bg-zinc-900 p-3 rounded-full shadow-2xl text-zinc-500 active:scale-90"><X size={24}/></button>
           <div className="text-center mt-24 max-w-md mx-auto">
              <div className="w-28 h-28 bg-zinc-900 rounded-[50px] flex items-center justify-center mx-auto mb-8 border border-zinc-800 shadow-2xl shadow-blue-500/10"><Users size={52} className="text-blue-500" /></div>
              <h2 className="text-5xl font-black italic tracking-tighter text-white uppercase">{selectedSocio.nombre}</h2>
              <p className="text-zinc-500 font-bold tracking-[0.6em] text-[11px] mt-3 uppercase italic">{selectedSocio.telefono}</p>
              
              <div className="mt-20 space-y-5 text-left">
                 <button onClick={() => { setSelectedSocio(null); setActiveTab('rutas'); handlePlusButton(); setRutaSocio(selectedSocio); }} className="w-full bg-zinc-900 border border-zinc-800 p-7 rounded-[40px] flex items-center justify-between group active:bg-blue-600 transition-all shadow-2xl border-white/5">
                    <div className="flex items-center gap-5"><Truck className="text-blue-500 group-active:text-white" size={28}/><span className="font-black text-sm uppercase tracking-widest italic">Asignar Nueva Ruta</span></div>
                    <ChevronRight size={28} className="text-zinc-700 group-active:text-white" />
                 </button>
                 <button onClick={() => { setSelectedSocio(null); setActiveTab('rutas'); }} className="w-full bg-zinc-900 border border-zinc-800 p-7 rounded-[40px] flex items-center justify-between group active:bg-green-600 transition-all shadow-2xl border-white/5">
                    <div className="flex items-center gap-5"><LayoutDashboard className="text-green-500 group-active:text-white" size={28}/><span className="font-black text-sm uppercase tracking-widest italic">Monitorear Actividad</span></div>
                    <ChevronRight size={28} className="text-zinc-700 group-active:text-white" />
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* NOTIFICACIÓN IPHONE STYLE */}
      {alertConfig.show && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-zinc-900/95 border border-zinc-800 w-full max-w-[300px] rounded-[44px] overflow-hidden shadow-2xl animate-in zoom-in-95 border-white/5">
            <div className="p-10 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${alertConfig.type === 'success' ? 'bg-green-500/10 text-green-500 shadow-lg shadow-green-500/10' : 'bg-red-500/10 text-red-500 shadow-lg shadow-red-500/10'}`}>
                {alertConfig.type === 'success' ? <CheckCircle2 size={40}/> : <AlertTriangle size={40} />}
              </div>
              <h2 className="text-3xl font-black mb-3 italic tracking-tight uppercase text-white">{alertConfig.title}</h2>
              <p className="text-[12px] text-zinc-500 leading-relaxed font-black uppercase tracking-tighter italic">{alertConfig.msg}</p>
            </div>
            <button onClick={() => setAlertConfig({...alertConfig, show: false})} className="w-full p-7 text-[11px] font-black border-t border-zinc-800 active:bg-zinc-800 uppercase tracking-[0.3em] text-white transition-colors">Entendido</button>
          </div>
        </div>
      )}

      {/* QR MODAL (CENTRADO Y PRO) */}
      {selectedTienda && (
        <div className="fixed inset-0 z-[1100] bg-black flex flex-col items-center justify-center p-8 animate-in fade-in">
           <button onClick={() => setSelectedTienda(null)} className="absolute top-10 right-10 bg-zinc-900 p-4 rounded-full active:scale-90 shadow-2xl border border-white/5"><X size={28}/></button>
           <div className="text-center animate-in zoom-in duration-300">
              <h2 className="text-6xl font-black italic mb-3 tracking-tighter text-white uppercase italic">{selectedTienda.nombre_tienda}</h2>
              <p className="text-blue-500 font-black text-sm tracking-[0.8em] mb-14 uppercase italic">{selectedTienda.codigo_qr}</p>
              <div className="bg-white p-14 rounded-[80px] inline-block shadow-2xl shadow-blue-500/50">
                <QRCodeSVG value={selectedTienda.codigo_qr} size={300} />
              </div>
              <p className="mt-16 text-zinc-700 text-[11px] font-black tracking-[0.6em] uppercase italic">Control de Auditoría Velasco Digital</p>
           </div>
        </div>
      )}

      {/* NAV INFERIOR PREMIUM */}
      <nav className="fixed bottom-8 left-6 right-6 bg-zinc-900/80 backdrop-blur-3xl border border-white/5 p-2.5 rounded-[44px] flex justify-around items-center z-40 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {[
          {id:'panel', icon: <LayoutDashboard size={24}/>},
          {id:'productos', icon: <ShoppingBag size={24}/>},
          {id:'rutas', icon: <Truck size={24}/>},
          {id:'equipo', icon: <Users size={24}/>}
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`p-4 rounded-[24px] transition-all duration-300 ${activeTab === tab.id ? 'bg-blue-600 text-white scale-110 shadow-2xl shadow-blue-600/40' : 'text-zinc-500 hover:text-white'}`}>
            {tab.icon}
          </button>
        ))}
      </nav>
    </div>
  );
}
