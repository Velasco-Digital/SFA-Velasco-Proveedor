'use client'
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  PlusCircle, MapPin, QrCode, Truck, Users, LayoutDashboard, 
  X, Save, Navigation, Edit2, Phone, Trash2, AlertTriangle, Package, ShoppingBag, CheckCircle2, ChevronRight, Search, Hash, Clock
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

  // --- UI & MODALES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTienda, setSelectedTienda] = useState<any>(null);
  const [selectedSocio, setSelectedSocio] = useState<any>(null);
  const [activeRouteDetail, setActiveRouteDetail] = useState<any>(null);
  const [alertConfig, setAlertConfig] = useState<any>({ show: false, type: 'success', title: '', msg: '' });

  // --- SELECTORES IPHONE STYLE ---
  const [selectorTarget, setSelectorTarget] = useState<'repartidor' | 'tienda' | null>(null);

  // --- FORMULARIOS ---
  const [editId, setEditId] = useState<string | null>(null);
  // Campos CRUD Básicos
  const [tNombre, setTNombre] = useState(''); const [tTel, setTTel] = useState('');
  const [pNombre, setPNombre] = useState(''); const [pPrecio, setPPrecio] = useState(''); const [pStock, setPStock] = useState('');
  const [sNombre, setSNombre] = useState(''); const [sTel, setSTel] = useState('');

  // --- LÓGICA DE RUTA COMPLEJA ---
  const [searchProd, setSearchProd] = useState('');
  const [rutaRepartidor, setRutaRepartidor] = useState<any>(null);
  const [paradasRuta, setParadasRuta] = useState<any[]>([]); // Array de { tienda, items: [] }
  const [currentAddingTienda, setCurrentAddingTienda] = useState<any>(null);

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

  const showAlert = (type: 'error' | 'success', title: string, msg: string) => {
    setAlertConfig({ show: true, type, title, msg });
  };

  const filteredProducts = useMemo(() => {
    return productos.filter(p => p.nombre.toLowerCase().includes(searchProd.toLowerCase()));
  }, [productos, searchProd]);

  // --- ACCIONES DE RUTA ---
  const agregarItemAParada = (prod: any, cant: string) => {
    const cantidad = parseInt(cant) || 1;
    if (!currentAddingTienda) return;
    
    const index = paradasRuta.findIndex(p => p.tienda.id === currentAddingTienda.id);
    let nuevasParadas = [...paradasRuta];

    if (index === -1) {
      nuevasParadas.push({ tienda: currentAddingTienda, items: [{ ...prod, cantidad }] });
    } else {
      const itemIndex = nuevasParadas[index].items.findIndex((i: any) => i.id === prod.id);
      if (itemIndex === -1) nuevasParadas[index].items.push({ ...prod, cantidad });
      else nuevasParadas[index].items[itemIndex].cantidad += cantidad;
    }
    setParadasRuta(nuevasParadas);
    setSearchProd('');
  };

  async function handleGuardarRuta() {
    if (!rutaRepartidor || paradasRuta.length === 0) return;
    
    const totalGlobal = paradasRuta.reduce((acc, p) => 
      acc + p.items.reduce((accI: number, i: any) => accI + (i.precio * i.cantidad), 0), 0
    );

    const { data: rData } = await supabase.from('sfa_rutas').insert([{ 
      repartidor_id: rutaRepartidor.id, 
      total_efectivo_esperado: totalGlobal 
    }]).select().single();

    if (rData) {
      for (const parada of paradasRuta) {
        const subtotal = parada.items.reduce((acc: number, i: any) => acc + (i.precio * i.cantidad), 0);
        const { data: pedData } = await supabase.from('sfa_pedidos').insert([{ 
          ruta_id: rData.id, 
          tienda_id: parada.tienda.id, 
          total_pago: subtotal 
        }]).select().single();

        const items = parada.items.map((i: any) => ({
          pedido_id: pedData.id, producto_id: i.id, 
          cantidad: i.cantidad, precio_unitario: i.precio, subtotal: i.precio * i.cantidad
        }));
        await supabase.from('sfa_pedido_items').insert(items);
      }
      setIsModalOpen(false);
      cargarDatos();
      showAlert('success', 'Ruta Asignada', `Se han cargado ${paradasRuta.length} tiendas a ${rutaRepartidor.nombre}`);
    }
  }

  async function handleGuardarGeneral(e: React.FormEvent) {
    e.preventDefault();
    if (activeTab === 'rutas') { handleGuardarRuta(); return; }
    
    let res;
    if (activeTab === 'panel') {
      const p = { nombre_tienda: tNombre, telefono: tTel };
      res = await supabase.from('sfa_tiendas').insert([{ ...p, codigo_qr: `SFA-${Math.random().toString(36).substr(2, 7).toUpperCase()}` }]);
    } else if (activeTab === 'productos') {
      const p = { nombre: pNombre, precio: parseFloat(pPrecio), stock: parseInt(pStock) };
      res = await supabase.from('sfa_productos').insert([p]);
    } else if (activeTab === 'equipo') {
      res = await supabase.from('sfa_equipo').insert([{ nombre: sNombre, telefono: sTel }]);
    }

    if (!res?.error) { setIsModalOpen(false); cargarDatos(); showAlert('success', '¡Éxito!', 'Sincronizado con Velasco Digital.'); }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans selection:bg-blue-500/30 antialiased overflow-x-hidden">
      {/* HEADER */}
      <header className="p-6 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <div>
            <h1 className="text-2xl font-black text-blue-500 tracking-tighter italic">VELASCO DIGITAL</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{activeTab === 'panel' ? 'Clientes' : activeTab}</p>
          </div>
          <button onClick={() => { setEditId(null); setParadasRuta([]); setRutaRepartidor(null); setIsModalOpen(true); }} className="bg-blue-600 p-2.5 rounded-full shadow-lg shadow-blue-600/40 active:scale-90"><PlusCircle size={26} /></button>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" /></div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* TIENDAS */}
            {activeTab === 'panel' && tiendas.map(t => (
              <div key={t.id} onClick={() => setSelectedTienda(t)} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[24px] mb-4 flex justify-between items-center active:bg-zinc-800 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${t.latitud ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'bg-zinc-800 text-zinc-500'}`}><MapPin size={24} /></div>
                  <div><h3 className="font-bold text-base leading-tight">{t.nombre_tienda}</h3><p className="text-xs text-zinc-500 mt-0.5">{t.telefono || 'Sin WhatsApp'}</p></div>
                </div>
                <ChevronRight size={20} className="text-zinc-700" />
              </div>
            ))}

            {/* PRODUCTOS */}
            {activeTab === 'productos' && (
              <div className="grid grid-cols-2 gap-4">
                {productos.map(p => (
                  <div key={p.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[32px] hover:border-blue-500/50 transition-colors">
                    <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500 w-fit mb-4"><Package size={22}/></div>
                    <h3 className="font-bold text-sm mb-1">{p.nombre}</h3>
                    <p className="text-blue-500 font-black text-lg">${p.precio}</p>
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Stock: {p.stock}</span>
                  </div>
                ))}
              </div>
            )}

            {/* RUTAS (MONITOREO) */}
            {activeTab === 'rutas' && rutas.map(r => (
              <div key={r.id} onClick={() => setActiveRouteDetail(r)} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[32px] mb-4 relative overflow-hidden active:scale-[0.98] transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-black italic text-white">{r.sfa_equipo?.nombre}</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{r.fecha}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-green-500">${r.total_efectivo_esperado}</p>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">Total Ruta</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex -space-x-2">
                      {r.sfa_pedidos?.map((p: any, i: number) => (
                        <div key={i} className={`w-3 h-3 rounded-full border border-black ${p.estado === 'entregado' ? 'bg-green-500' : 'bg-zinc-700'}`} />
                      ))}
                   </div>
                   <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                     {r.sfa_pedidos?.filter((p:any) => p.estado === 'entregado').length} / {r.sfa_pedidos?.length} TIENDAS
                   </span>
                </div>
              </div>
            ))}

            {/* EQUIPO (SOCIOS) */}
            {activeTab === 'equipo' && equipo.map(s => (
              <div key={s.id} onClick={() => setSelectedSocio(s)} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[24px] mb-4 flex justify-between items-center active:bg-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-zinc-800 text-zinc-400 shadow-inner"><Users size={24} /></div>
                  <div><h3 className="font-bold text-base">{s.nombre}</h3><p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Socio Estratégico</p></div>
                </div>
                <ChevronRight size={20} className="text-zinc-700" />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* SELECTOR IPHONE STYLE (BOTTOM SHEET) */}
      {(selectorTarget) && (
        <div className="fixed inset-0 z-[700] bg-black/60 backdrop-blur-sm flex items-end animate-in fade-in duration-300">
          <div className="bg-zinc-900 w-full rounded-t-[40px] p-8 max-h-[70vh] overflow-y-auto animate-in slide-in-from-bottom duration-500 shadow-2xl">
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-8" />
            <h2 className="text-xl font-black italic mb-6">SELECCIONAR {selectorTarget.toUpperCase()}</h2>
            <div className="space-y-3">
              {(selectorTarget === 'repartidor' ? equipo : tiendas).map((item: any) => (
                <button key={item.id} onClick={() => { 
                  if (selectorTarget === 'repartidor') setRutaRepartidor(item);
                  else setCurrentAddingTienda(item);
                  setSelectorTarget(null);
                }} className="w-full bg-black border border-zinc-800 p-5 rounded-2xl flex justify-between items-center active:bg-blue-600 transition-colors">
                  <span className="font-bold">{item.nombre || item.nombre_tienda}</span>
                  <ChevronRight size={18} className="text-zinc-700" />
                </button>
              ))}
            </div>
            <button onClick={() => setSelectorTarget(null)} className="w-full mt-6 p-4 text-zinc-500 font-bold uppercase text-xs">Cerrar</button>
          </div>
        </div>
      )}

      {/* MODAL MAESTRO ADAPTABLE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] bg-black/90 p-4 flex items-end sm:items-center justify-center animate-in slide-in-from-bottom duration-500">
          <div className="bg-zinc-900 w-full max-w-md rounded-t-[40px] sm:rounded-[40px] border border-zinc-800 p-8 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic tracking-tighter">NUEVO {activeTab.toUpperCase()}</h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-zinc-800 p-2 rounded-full text-zinc-500"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleGuardarGeneral} className="space-y-4">
              {activeTab === 'panel' && (
                <><input required placeholder="Nombre de la Tienda" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all" value={tNombre} onChange={e => setTNombre(e.target.value)} /><input placeholder="WhatsApp de Contacto" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={tTel} onChange={e => setTTel(e.target.value)} /></>
              )}
              {activeTab === 'productos' && (
                <><input required placeholder="Nombre del Artículo / Producto" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all" value={pNombre} onChange={e => setPNombre(e.target.value)} /><div className="grid grid-cols-2 gap-4"><input required type="number" placeholder="Precio $" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={pPrecio} onChange={e => setPPrecio(e.target.value)} /><input required type="number" placeholder="Stock" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={pStock} onChange={e => setPStock(e.target.value)} /></div></>
              )}
              {activeTab === 'equipo' && (
                <><input required placeholder="Nombre del Socio" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all" value={sNombre} onChange={e => setSNombre(e.target.value)} /><input placeholder="Teléfono" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={sTel} onChange={e => setSTel(e.target.value)} /></>
              )}
              {activeTab === 'rutas' && (
                <div className="space-y-5">
                   <button type="button" onClick={() => setSelectorTarget('repartidor')} className="w-full bg-black border border-zinc-800 p-5 rounded-2xl flex justify-between items-center text-left">
                      <div><p className="text-[10px] font-black text-zinc-600 uppercase">Repartidor</p><p className="font-bold text-blue-500">{rutaRepartidor?.nombre || 'Elegir Socio'}</p></div>
                      <Users size={20} className="text-zinc-700"/>
                   </button>

                   <div className="bg-zinc-950/50 border border-zinc-800 rounded-[32px] p-6 space-y-4">
                      <div className="flex justify-between items-center">
                         <p className="text-[10px] font-black text-zinc-600 uppercase">Paradas Agregadas: {paradasRuta.length}</p>
                         <button type="button" onClick={() => setSelectorTarget('tienda')} className="text-blue-500 text-[10px] font-black italic">+ TIENDA</button>
                      </div>

                      {currentAddingTienda && (
                        <div className="bg-blue-600/5 border border-blue-500/20 p-4 rounded-2xl animate-in zoom-in">
                           <p className="text-[10px] font-black text-blue-500 uppercase mb-2">Cargando Pedido: {currentAddingTienda.nombre_tienda}</p>
                           <div className="relative mb-3">
                              <Search className="absolute left-3 top-3 text-zinc-600" size={16} />
                              <input placeholder="Buscar producto..." className="w-full bg-black border border-zinc-800 rounded-xl p-3 pl-10 text-xs" value={searchProd} onChange={e => setSearchProd(e.target.value)} />
                           </div>
                           <div className="max-h-40 overflow-y-auto space-y-2">
                              {filteredProducts.map(p => (
                                <div key={p.id} className="flex items-center gap-2">
                                   <button type="button" onClick={() => {
                                      const cant = prompt(`Cantidad de ${p.nombre}:`, "1");
                                      if (cant) agregarItemAParada(p, cant);
                                   }} className="flex-1 bg-zinc-900 p-2 rounded-lg text-[10px] font-bold text-left">+{p.nombre} (${p.precio})</button>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}

                      <div className="space-y-3">
                         {paradasRuta.map((p, idx) => (
                           <div key={idx} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-black text-white italic">{p.tienda.nombre_tienda}</span>
                                <span className="text-[10px] font-bold text-green-500">${p.items.reduce((acc:any, i:any)=> acc + (i.precio*i.cantidad), 0)}</span>
                              </div>
                              <div className="space-y-1">{p.items.map((i:any, ix:number)=> (
                                <p key={ix} className="text-[9px] text-zinc-500 flex justify-between"><span>{i.nombre} x{i.cantidad}</span> <span>${i.precio*i.cantidad}</span></p>
                              ))}</div>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="bg-blue-600 p-6 rounded-[32px] flex justify-between items-center shadow-xl shadow-blue-600/20">
                      <div><p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Total Global Ruta</p><p className="text-2xl font-black text-white italic">${paradasRuta.reduce((acc, p) => acc + p.items.reduce((accI:number, i:any) => accI + (i.precio*i.cantidad), 0), 0)}</p></div>
                      <button type="submit" className="bg-white text-blue-600 p-3 rounded-2xl active:scale-90 transition-all"><Save size={24}/></button>
                   </div>
                </div>
              )}
              {activeTab !== 'rutas' && (
                <button type="submit" className="w-full bg-blue-600 p-5 rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-blue-600/30 active:scale-95 transition-all">GUARDAR REGISTRO</button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* MONITOREO DE RUTA (DETALLE 24/7) */}
      {activeRouteDetail && (
        <div className="fixed inset-0 z-[500] bg-black p-8 animate-in fade-in duration-300 overflow-y-auto">
           <div className="max-w-2xl mx-auto">
              <button onClick={() => setActiveRouteDetail(null)} className="absolute top-10 right-10 bg-zinc-900 p-3 rounded-full text-zinc-500"><X size={24}/></button>
              <div className="mt-10 mb-10">
                 <h2 className="text-4xl font-black italic tracking-tighter text-blue-500">{activeRouteDetail.sfa_equipo?.nombre}</h2>
                 <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs">Monitoreo de Ruta: {activeRouteDetail.fecha}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[32px]"><p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Efectivo Total</p><p className="text-2xl font-black text-green-500">${activeRouteDetail.total_efectivo_esperado}</p></div>
                 <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[32px]"><p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Progreso</p><p className="text-2xl font-black">{activeRouteDetail.sfa_pedidos?.filter((p:any)=>p.estado==='entregado').length}/{activeRouteDetail.sfa_pedidos?.length}</p></div>
              </div>

              <h3 className="text-xs font-black text-zinc-600 uppercase tracking-[0.3em] mb-4 ml-4">Desglose de Paradas</h3>
              <div className="space-y-4">
                 {activeRouteDetail.sfa_pedidos?.map((pedido: any, idx: number) => (
                   <div key={idx} className={`bg-zinc-900/50 border ${pedido.estado === 'entregado' ? 'border-green-500/30' : 'border-zinc-800'} p-6 rounded-[32px] transition-all`}>
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-2xl ${pedido.estado === 'entregado' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-zinc-800 text-zinc-500'}`}><MapPin size={20}/></div>
                            <div><h4 className="font-bold text-sm">{pedido.sfa_tiendas?.nombre_tienda}</h4><p className="text-[10px] text-zinc-500 italic">Estado: {pedido.estado}</p></div>
                         </div>
                         <div className="text-right"><p className="text-sm font-black text-white">${pedido.total_pago}</p></div>
                      </div>
                      
                      <div className="flex items-center gap-4 py-3 border-t border-zinc-800/50">
                         <div className="flex items-center gap-1 text-[9px] font-bold text-zinc-500 uppercase tracking-tighter"><Clock size={12}/> Llegada: {pedido.hora_llegada ? new Date(pedido.hora_llegada).toLocaleTimeString() : '--:--'}</div>
                         <div className="flex items-center gap-1 text-[9px] font-bold text-zinc-500 uppercase tracking-tighter"><CheckCircle2 size={12} className="text-green-500"/> Escaneo: {pedido.estado === 'entregado' ? 'Validado ✓' : 'Pendiente'}</div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* PERFIL DE SOCIO */}
      {selectedSocio && (
        <div className="fixed inset-0 z-[500] bg-black p-8 animate-in fade-in duration-300">
           <button onClick={() => setSelectedSocio(null)} className="absolute top-10 right-10 bg-zinc-900 p-3 rounded-full"><X size={24}/></button>
           <div className="text-center mt-20 max-w-md mx-auto">
              <div className="w-24 h-24 bg-zinc-900 rounded-[40px] flex items-center justify-center mx-auto mb-6 border border-zinc-800 shadow-2xl shadow-blue-500/10"><Users size={40} className="text-blue-500" /></div>
              <h2 className="text-4xl font-black italic tracking-tighter">{selectedSocio.nombre}</h2>
              <p className="text-zinc-500 font-bold tracking-[0.5em] text-xs mt-2">{selectedSocio.telefono}</p>
              
              <div className="mt-16 space-y-4 text-left">
                 <button onClick={() => { setSelectedSocio(null); setActiveTab('rutas'); handlePlusButton(); setRutaRepartidor(selectedSocio); }} className="w-full bg-zinc-900 border border-zinc-800 p-6 rounded-[32px] flex items-center justify-between group active:bg-blue-600 transition-all">
                    <div className="flex items-center gap-4"><Truck className="text-blue-500 group-active:text-white" /><span className="font-bold">Asignar Nueva Ruta</span></div>
                    <ChevronRight className="text-zinc-700 group-active:text-white" />
                 </button>
                 <button onClick={() => { setSelectedSocio(null); setActiveTab('rutas'); }} className="w-full bg-zinc-900 border border-zinc-800 p-6 rounded-[32px] flex items-center justify-between group active:bg-green-600 transition-all">
                    <div className="flex items-center gap-4"><LayoutDashboard className="text-green-500 group-active:text-white" /><span className="font-bold">Monitorear Actividad</span></div>
                    <ChevronRight className="text-zinc-700 group-active:text-white" />
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* NOTIFICACIÓN TIPO IPHONE */}
      {alertConfig.show && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
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

      {/* QR VIEW */}
      {selectedTienda && (
        <div className="fixed inset-0 z-[400] bg-black flex flex-col items-center justify-center p-8 animate-in fade-in">
           <button onClick={() => setSelectedTienda(null)} className="absolute top-10 right-10 bg-zinc-900 p-3 rounded-full"><X size={24}/></button>
           <div className="text-center animate-in zoom-in duration-300">
              <h2 className="text-4xl font-black italic mb-2 tracking-tighter text-white">{selectedTienda.nombre_tienda}</h2>
              <p className="text-blue-500 font-bold text-xs tracking-[0.5em] mb-12 uppercase">{selectedTienda.codigo_qr}</p>
              <div className="bg-white p-10 rounded-[60px] inline-block shadow-2xl shadow-blue-500/40">
                <QRCodeSVG value={selectedTienda.codigo_qr} size={260} />
              </div>
              <p className="mt-12 text-zinc-600 text-[10px] font-black tracking-widest uppercase">Propiedad de Velasco Digital</p>
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
