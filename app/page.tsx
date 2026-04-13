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

  // --- UI & MODALES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTienda, setSelectedTienda] = useState<any>(null);
  const [selectedSocio, setSelectedSocio] = useState<any>(null);
  const [activeRouteDetail, setActiveRouteDetail] = useState<any>(null);
  const [selectorType, setSelectorType] = useState<'repartidor' | 'tienda' | null>(null);
  
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [tempQuantityInput, setTempQuantityInput] = useState('1');

  const [alertConfig, setAlertConfig] = useState<any>({ show: false, type: 'success', title: '', msg: '' });

  // --- FORMULARIOS (ESTADOS INDEPENDIENTES) ---
  const [editId, setEditId] = useState<string | null>(null);
  const [tNombre, setTNombre] = useState(''); const [tTel, setTTel] = useState('');
  const [tDir, setTDir] = useState(''); const [tDueno, setTDueno] = useState('');
  const [tCoords, setTCoords] = useState({ lat: null, lng: null });

  const [pNombre, setPNombre] = useState(''); const [pPrecio, setPPrecio] = useState(''); const [pStock, setPStock] = useState('');
  const [sNombre, setSNombre] = useState(''); const [sTel, setSTel] = useState('');

  // --- LÓGICA DE RUTA ---
  const [rutaSocio, setRutaSocio] = useState<any>(null);
  const [paradas, setParadas] = useState<any[]>([]); 
  const [currentTienda, setCurrentTienda] = useState<any>(null);
  const [filtroProd, setFiltroProd] = useState('');

  useEffect(() => { cargarDatos(); }, [activeTab]);

  async function cargarDatos() {
    setLoading(true);
    try {
      // Jalar todo de golpe para que los selectores siempre tengan info
      const { data: e } = await supabase.from('sfa_equipo').select('*').order('nombre');
      const { data: t } = await supabase.from('sfa_tiendas').select('*').order('nombre_tienda');
      const { data: p } = await supabase.from('sfa_productos').select('*').order('nombre');
      const { data: r } = await supabase.from('sfa_rutas').select('*, sfa_equipo(nombre), sfa_pedidos(*, sfa_tiendas(*))').order('created_at', { ascending: false });

      setEquipo(e || []); setTiendas(t || []); setProductos(p || []); setRutas(r || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  const handlePlusButton = () => {
    setEditId(null); setRutaSocio(null); setParadas([]); setCurrentTienda(null);
    setTNombre(''); setTTel(''); setTDir(''); setTDueno(''); setTCoords({lat:null, lng:null});
    setPNombre(''); setPPrecio(''); setPStock(''); setSNombre(''); setSTel('');
    setIsModalOpen(true);
  };

  const prepararEdicionTienda = (t: any) => {
    setEditId(t.id);
    setTNombre(t.nombre_tienda); setTTel(t.telefono || '');
    setTDir(t.direccion || ''); setTDueno(t.dueno || '');
    setTCoords({ lat: t.latitud, lng: t.longitud });
    setIsModalOpen(true);
  };

  const showAlert = (type: 'error' | 'success', title: string, msg: string) => {
    setAlertConfig({ show: true, type, title, msg });
  };

  const prodsFiltrados = useMemo(() => {
    if (!filtroProd) return [];
    return productos.filter(p => p.nombre.toLowerCase().includes(filtroProd.toLowerCase()));
  }, [productos, filtroProd]);

  const confirmarCantidad = () => {
    const cant = parseInt(tempQuantityInput) || 1;
    const paradaIdx = paradas.findIndex(p => p.tienda.id === currentTienda.id);
    let nuevasParadas = [...paradas];

    if (paradaIdx === -1) {
      nuevasParadas.push({ tienda: currentTienda, items: [{ ...pendingProduct, cantidad: cant }] });
    } else {
      const itemIdx = nuevasParadas[paradaIdx].items.findIndex((i: any) => i.id === pendingProduct.id);
      if (itemIdx === -1) nuevasParadas[paradaIdx].items.push({ ...pendingProduct, cantidad: cant });
      else nuevasParadas[paradaIdx].items[itemIdx].cantidad += cant;
    }
    setParadas(nuevasParadas); setFiltroProd(''); setIsQuantityModalOpen(false);
  };

  async function handleGuardarGral(e: React.FormEvent) {
    e.preventDefault();
    let res;

    if (activeTab === 'panel') {
      const payload = { nombre_tienda: tNombre, telefono: tTel, direccion: tDir, dueno: tDueno, latitud: tCoords.lat, longitud: tCoords.lng };
      if (editId) res = await supabase.from('sfa_tiendas').update(payload).eq('id', editId);
      else res = await supabase.from('sfa_tiendas').insert([{ ...payload, codigo_qr: `SFA-${Math.random().toString(36).substr(2, 7).toUpperCase()}` }]);
    } 
    else if (activeTab === 'productos') {
      const payload = { nombre: pNombre, precio: parseFloat(pPrecio), stock: parseInt(pStock) };
      if (editId) res = await supabase.from('sfa_productos').update(payload).eq('id', editId);
      else res = await supabase.from('sfa_productos').insert([payload]);
    } 
    else if (activeTab === 'equipo') {
      res = await supabase.from('sfa_equipo').insert([{ nombre: sNombre, telefono: sTel }]);
    }
    else if (activeTab === 'rutas') {
      const total = paradas.reduce((acc, p) => acc + p.items.reduce((ai:any, i:any)=> ai + (i.precio * i.cantidad), 0), 0);
      const { data: rData } = await supabase.from('sfa_rutas').insert([{ repartidor_id: rutaSocio.id, total_efectivo_esperado: total }]).select().single();
      if (rData) {
        for (const p of paradas) {
          const totalP = p.items.reduce((ai:any, i:any)=> ai + (i.precio * i.cantidad), 0);
          const { data: ped } = await supabase.from('sfa_pedidos').insert([{ ruta_id: rData.id, tienda_id: p.tienda.id, total_pago: totalP }]).select().single();
          const items = p.items.map((i:any) => ({ pedido_id: ped.id, producto_id: i.id, cantidad: i.cantidad, precio_unitario: i.precio, subtotal: i.precio * i.cantidad }));
          await supabase.from('sfa_pedido_items').insert(items);
        }
      }
      res = { error: null };
    }

    if (!res?.error) {
      setIsModalOpen(false); await cargarDatos();
      showAlert('success', '¡Al puro chingazo!', 'Datos guardados correctamente.');
    } else {
      showAlert('error', 'Error Velasco', res.error.message);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans antialiased overflow-x-hidden">
      
      {/* HEADER */}
      <header className="p-6 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <div><h1 className="text-2xl font-black text-blue-500 tracking-tighter italic">VELASCO DIGITAL</h1><p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{activeTab}</p></div>
          <button onClick={handlePlusButton} className="bg-blue-600 p-2.5 rounded-full shadow-lg active:scale-90 transition-transform"><PlusCircle size={26} /></button>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" /></div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* TIENDAS */}
            {activeTab === 'panel' && tiendas.map(t => (
              <div key={t.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[24px] mb-4 flex justify-between items-center">
                <div onClick={() => setSelectedTienda(t)} className="flex items-center gap-4 flex-1">
                  <div className={`p-4 rounded-2xl ${t.latitud ? 'bg-blue-600' : 'bg-zinc-800 text-zinc-500'}`}><MapPin size={24} /></div>
                  <div><h3 className="font-bold text-base">{t.nombre_tienda}</h3><p className="text-xs text-zinc-500">{t.telefono || 'Sin contacto'}</p></div>
                </div>
                <button onClick={() => prepararEdicionTienda(t)} className="p-2 text-zinc-600 active:text-blue-500"><Edit2 size={20}/></button>
              </div>
            ))}

            {/* STOCK */}
            {activeTab === 'productos' && (
              <div className="grid grid-cols-2 gap-4">
                {productos.map(p => (
                  <div key={p.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[32px]"><div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500 w-fit mb-4"><Package size={22}/></div><h3 className="font-bold text-sm mb-1">{p.nombre}</h3><p className="text-blue-500 font-black text-lg">${p.precio}</p></div>
                ))}
              </div>
            )}

            {/* RUTAS */}
            {activeTab === 'rutas' && rutas.map(r => (
              <div key={r.id} onClick={() => setActiveRouteDetail(r)} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[32px] mb-4 active:scale-[0.98] transition-all">
                <div className="flex justify-between items-start mb-6"><div><h3 className="text-lg font-black italic">{r.sfa_equipo?.nombre}</h3><p className="text-[10px] text-zinc-500 uppercase">{r.fecha}</p></div><div className="text-right"><p className="text-2xl font-black text-green-500">${r.total_efectivo_esperado}</p><p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter italic">Total Cobro</p></div></div>
                <div className="flex items-center gap-4"><div className="flex -space-x-2">{r.sfa_pedidos?.map((p:any, i:number) => (<div key={i} className={`w-3 h-3 rounded-full border border-black ${p.estado === 'entregado' ? 'bg-green-500' : 'bg-zinc-700'}`} />))}</div><span className="text-[10px] font-black text-blue-500 uppercase">Progreso: {r.sfa_pedidos?.filter((p:any)=>p.estado==='entregado').length}/{r.sfa_pedidos?.length}</span></div>
              </div>
            ))}

            {/* EQUIPO */}
            {activeTab === 'equipo' && equipo.map(s => (
              <div key={s.id} onClick={() => setSelectedSocio(s)} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[24px] mb-4 flex justify-between items-center active:bg-zinc-800">
                <div className="flex items-center gap-4"><div className="p-4 rounded-2xl bg-zinc-800 text-zinc-400"><Users size={24} /></div><div><h3 className="font-bold text-base">{s.nombre}</h3><p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Socio Activo</p></div></div>
                <ChevronRight size={20} className="text-zinc-700" />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL ADAPTABLE (NUEVO/EDITAR) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[400] bg-black/90 p-4 flex items-end sm:items-center justify-center animate-in slide-in-from-bottom duration-500">
          <div className="bg-zinc-900 w-full max-w-md rounded-t-[40px] sm:rounded-[40px] border border-zinc-800 p-8 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black italic uppercase">{editId ? 'EDITAR' : 'NUEVO'} {activeTab}</h2><button onClick={() => setIsModalOpen(false)} className="bg-zinc-800 p-2 rounded-full text-zinc-500"><X size={20}/></button></div>
            <form onSubmit={handleGuardarGral} className="space-y-4">
              {activeTab === 'panel' && (
                <>
                  <input required placeholder="Nombre de la Tienda" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none focus:border-blue-500" value={tNombre} onChange={e => setTNombre(e.target.value)} />
                  <input placeholder="Dueño / Encargado" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={tDueno} onChange={e => setTDueno(e.target.value)} />
                  <input placeholder="Teléfono" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={tTel} onChange={e => setTTel(e.target.value)} />
                  <input placeholder="Dirección" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 outline-none" value={tDir} onChange={e => setTDir(e.target.value)} />
                  <button type="button" onClick={() => navigator.geolocation.getCurrentPosition(p => setTCoords({lat: p.coords.latitude as any, lng: p.coords.longitude as any}))} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold ${tCoords.lat ? 'border-blue-500 text-blue-500' : 'border-zinc-800 text-zinc-500'}`}><Navigation size={20}/> {tCoords.lat ? 'Ubicación GPS Capturada ✓' : 'Fijar Ubicación GPS'}</button>
                </>
              )}
              {activeTab === 'rutas' && (
                <div className="space-y-5">
                   <button type="button" onClick={() => setSelectorType('repartidor')} className="w-full bg-black border border-zinc-800 p-5 rounded-2xl flex justify-between items-center text-left"><div><p className="text-[10px] font-black text-zinc-600 uppercase">Socio</p><p className="font-bold text-blue-500">{rutaSocio?.nombre || 'Elegir Socio'}</p></div><Users size={20}/></button>
                   <div className="bg-zinc-950 border border-zinc-800 rounded-[32px] p-6 space-y-4 shadow-inner">
                      <div className="flex justify-between items-center px-1"><p className="text-[11px] font-black text-zinc-500 uppercase italic">Paradas: {paradas.length}</p><button type="button" onClick={() => setSelectorType('tienda')} className="text-blue-500 text-[11px] font-black italic">+ AGREGAR TIENDA</button></div>
                      {currentTienda && (
                        <div className="bg-blue-600/5 border border-blue-500/20 p-5 rounded-[24px] animate-in zoom-in">
                           <div className="flex justify-between items-center mb-4"><p className="text-[10px] font-black text-blue-500 uppercase">Cargar para: {currentTienda.nombre_tienda}</p><button type="button" onClick={()=>setCurrentTienda(null)} className="text-zinc-600"><X size={16}/></button></div>
                           <div className="relative mb-4"><Search className="absolute left-3 top-3 text-zinc-600" size={16} /><input placeholder="Buscar producto..." className="w-full bg-black border border-zinc-800 rounded-xl p-3 pl-10 text-xs text-white" value={filtroProd} onChange={e => setFiltroProd(e.target.value)} /></div>
                           <div className="max-h-48 overflow-y-auto space-y-2">{prodsFiltrados.map(p => (<button key={p.id} type="button" onClick={() => { setPendingProduct(p); setIsQuantityModalOpen(true); }} className="w-full bg-zinc-900 p-3 rounded-xl text-[10px] font-bold text-left border border-zinc-800 flex justify-between items-center"><span>{p.nombre}</span> <span className="text-blue-500 font-black">${p.precio}</span></button>))}</div>
                        </div>
                      )}
                      <div className="space-y-3">{paradas.map((p, idx) => (<div key={idx} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl"><div className="flex justify-between items-center mb-2"><span className="text-xs font-black text-blue-400 uppercase">{p.tienda.nombre_tienda}</span><span className="text-xs font-black text-green-500">${p.items.reduce((acc:any, i:any)=> acc + (i.precio*i.cantidad), 0)}</span></div><div className="space-y-1.5 border-t border-zinc-800/50 pt-2">{p.items.map((i:any, ix:number)=> (<p key={ix} className="text-[10px] text-zinc-500 flex justify-between font-medium"><span>{i.nombre} <span className="text-white font-black">x{i.cantidad}</span></span> <span>${i.precio*i.cantidad}</span></p>))}</div></div>))}</div>
                   </div>
                   <div className="bg-blue-600 p-6 rounded-[32px] flex justify-between items-center shadow-xl shadow-blue-600/40"><div><p className="text-[10px] font-black text-blue-100 uppercase tracking-widest italic">Cobro Total</p><p className="text-2xl font-black text-white italic">${paradas.reduce((acc, p) => acc + p.items.reduce((accI:number, i:any) => accI + (i.precio*i.cantidad), 0), 0)}</p></div><button type="submit" className="bg-white text-blue-600 p-3.5 rounded-2xl active:scale-90 transition-all shadow-xl"><Save size={24}/></button></div>
                </div>
              )}
              {activeTab !== 'rutas' && (<button type="submit" className="w-full bg-blue-600 p-5 rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl active:scale-95 transition-all">Sincronizar Datos</button>)}
            </form>
          </div>
        </div>
      )}

      {/* SELECTORES (BOTTOM SHEETS) */}
      {selectorType && (
        <div className="fixed inset-0 z-[800] bg-black/70 backdrop-blur-sm flex items-end animate-in fade-in" onClick={() => setSelectorType(null)}>
          <div className="bg-zinc-900 w-full rounded-t-[40px] p-8 max-h-[70vh] overflow-y-auto animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-8" />
            <h2 className="text-xl font-black italic mb-6">SELECCIONAR {selectorType.toUpperCase()}</h2>
            <div className="space-y-3 pb-10">
              {(selectorType === 'repartidor' ? equipo : tiendas).map((item: any) => (
                <button key={item.id} onClick={() => { if (selectorType === 'repartidor') setRutaSocio(item); else setCurrentTienda(item); setSelectorType(null); }} className="w-full bg-black border border-zinc-800 p-5 rounded-2xl flex justify-between items-center active:bg-blue-600 transition-all"><span className="font-bold text-white uppercase text-sm">{item.nombre || item.nombre_tienda}</span><ChevronRight size={18} className="text-zinc-700" /></button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CANTIDAD */}
      {isQuantityModalOpen && pendingProduct && (
        <div className="fixed inset-0 z-[900] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-[300px] rounded-[36px] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-8 text-center"><div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500 w-fit mb-5 mx-auto"><Hash size={24}/></div><h2 className="text-lg font-bold mb-2">{pendingProduct.nombre}</h2><input type="number" value={tempQuantityInput} onChange={e => setTempQuantityInput(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-center text-3xl font-black text-blue-500 outline-none focus:border-blue-500" autoFocus /></div>
            <div className="flex border-t border-zinc-800"><button onClick={() => setIsQuantityModalOpen(false)} className="flex-1 p-5 text-xs font-medium border-r border-zinc-800 text-zinc-400">Cancelar</button><button onClick={confirmarCantidad} className="flex-1 p-5 text-xs font-black text-blue-500">Confirmar ✓</button></div>
          </div>
        </div>
      )}

      {/* MONITOR DE RUTA (DETALLE) */}
      {activeRouteDetail && (
        <div className="fixed inset-0 z-[600] bg-black p-8 animate-in fade-in overflow-y-auto">
           <div className="max-w-2xl mx-auto"><button onClick={() => setActiveRouteDetail(null)} className="absolute top-10 right-10 bg-zinc-900 p-3 rounded-full text-zinc-500 shadow-lg"><X size={24}/></button><div className="mt-12 mb-12"><h2 className="text-4xl font-black italic tracking-tighter text-blue-500 uppercase">{activeRouteDetail.sfa_equipo?.nombre}</h2><p className="text-zinc-500 font-bold uppercase text-[10px] mt-1">Socio en Ruta • Monitoreo 24/7</p></div><div className="grid grid-cols-2 gap-4 mb-10"><div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[36px]"><p className="text-[10px] font-black text-zinc-500 uppercase mb-2 italic">Efectivo Total</p><p className="text-2xl font-black text-green-500">${activeRouteDetail.total_efectivo_esperado}</p></div><div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[36px]"><p className="text-[10px] font-black text-zinc-500 uppercase mb-2 italic">Visitas</p><p className="text-2xl font-black text-white">{activeRouteDetail.sfa_pedidos?.filter((p:any)=>p.estado==='entregado').length}/{activeRouteDetail.sfa_pedidos?.length}</p></div></div><div className="space-y-5">{activeRouteDetail.sfa_pedidos?.map((pedido: any, idx: number) => (<div key={idx} className={`bg-zinc-900/50 border ${pedido.estado === 'entregado' ? 'border-green-500/30 shadow-lg shadow-green-500/5' : 'border-zinc-800'} p-6 rounded-[36px] transition-all`}><div className="flex justify-between items-start mb-6"><div className="flex items-center gap-4"><div className={`p-4 rounded-2xl ${pedido.estado === 'entregado' ? 'bg-green-500 text-white shadow-xl shadow-green-500/30' : 'bg-zinc-800 text-zinc-600'}`}><MapPin size={22}/></div><div><h4 className="font-bold text-base leading-tight uppercase italic text-white">{pedido.sfa_tiendas?.nombre_tienda}</h4><p className={`text-[10px] font-black uppercase mt-1 ${pedido.estado === 'entregado' ? 'text-green-500' : 'text-zinc-500'}`}>{pedido.estado}</p></div></div><div className="text-right"><p className="text-base font-black text-white">${pedido.total_pago}</p></div></div><div className="flex items-center gap-6 py-4 border-t border-zinc-800/50"><div className="flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase"><Clock size={12} className="text-blue-500"/> Escaneo: {pedido.hora_escaneo ? new Date(pedido.hora_escaneo).toLocaleTimeString() : '--:--'}</div><div className="flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase"><CheckCircle2 size={12} className={pedido.estado === 'entregado' ? 'text-green-500' : 'text-zinc-700'}/> Validado ✓</div></div></div>))}</div></div>
        </div>
      )}

      {/* QR MODAL (REGRESADO A CENTRADO) */}
      {selectedTienda && (
        <div className="fixed inset-0 z-[1100] bg-black flex flex-col items-center justify-center p-8 animate-in fade-in">
           <button onClick={() => setSelectedTienda(null)} className="absolute top-10 right-10 bg-zinc-900 p-3 rounded-full active:scale-90 shadow-xl"><X size={24}/></button>
           <div className="text-center animate-in zoom-in duration-300">
              <h2 className="text-5xl font-black italic mb-2 tracking-tighter text-white uppercase italic">{selectedTienda.nombre_tienda}</h2>
              <div className="bg-white p-12 rounded-[70px] inline-block shadow-2xl shadow-blue-500/40 mt-8 mb-8"><QRCodeSVG value={selectedTienda.codigo_qr} size={280} /></div>
              <p className="text-blue-500 font-black text-sm tracking-[0.6em] uppercase italic">{selectedTienda.codigo_qr}</p>
           </div>
        </div>
      )}

      {/* ALERTAS IPHONE */}
      {alertConfig.show && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in"><div className="bg-zinc-900/95 border border-zinc-800 w-full max-w-[280px] rounded-[36px] overflow-hidden shadow-2xl animate-in zoom-in-95"><div className="p-8 text-center"><div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 ${alertConfig.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{alertConfig.type === 'success' ? <CheckCircle2 size={36}/> : <AlertTriangle size={36} />}</div><h2 className="text-2xl font-black mb-2 italic tracking-tight">{alertConfig.title}</h2><p className="text-[11px] text-zinc-500 leading-relaxed font-bold uppercase tracking-tighter">{alertConfig.msg}</p></div><button onClick={() => setAlertConfig({...alertConfig, show: false})} className="w-full p-6 text-[10px] font-black border-t border-zinc-800 active:bg-zinc-800 uppercase tracking-[0.2em] text-white">Entendido</button></div></div>
      )}

      <nav className="fixed bottom-8 left-6 right-6 bg-zinc-900/80 backdrop-blur-2xl border border-white/5 p-2 rounded-[36px] flex justify-around items-center z-40 shadow-2xl">
        {[{id:'panel', icon: <LayoutDashboard size={22}/>},{id:'productos', icon: <ShoppingBag size={22}/>},{id:'rutas', icon: <Truck size={22}/>},{id:'equipo', icon: <Users size={22}/>}].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`p-4 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-600/30' : 'text-zinc-500 hover:text-white'}`}>{tab.icon}</button>
        ))}
      </nav>
    </div>
  );
}
