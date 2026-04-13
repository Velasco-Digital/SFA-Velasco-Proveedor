'use client'
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PlusCircle, MapPin, QrCode, Truck, Users, LayoutDashboard, X, Save, Navigation } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function SFADashboard() {
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTienda, setSelectedTienda] = useState<any>(null);
  
  // Estado para la nueva tienda
  const [nombre, setNombre] = useState('');
  const [dueno, setDueno] = useState('');
  const [direccion, setDireccion] = useState('');
  const [coords, setCoords] = useState({ lat: null, lng: null });

  async function cargarTiendas() {
    setLoading(true);
    const { data } = await supabase.from('sfa_tiendas').select('*').order('created_at', { ascending: false });
    if (data) setTiendas(data);
    setLoading(false);
  }

  useEffect(() => { cargarTiendas(); }, []);

  // Función para obtener GPS del celular
  const obtenerUbicacion = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setCoords({ lat: pos.coords.latitude as any, lng: pos.coords.longitude as any });
    }, (err) => alert("Activa el GPS de tu cel, viejo"));
  };

  async function registrarTienda(e: React.FormEvent) {
    e.preventDefault();
    const codigoGenerado = `SFA-${Math.random().toString(36).substr(2, 7).toUpperCase()}`;

    const { error } = await supabase.from('sfa_tiendas').insert([
      { 
        nombre_tienda: nombre, 
        dueno: dueno, 
        direccion: direccion,
        codigo_qr: codigoGenerado,
        latitud: coords.lat,
        longitud: coords.lng
      }
    ]);

    if (!error) {
      setNombre(''); setDueno(''); setDireccion(''); setCoords({ lat: null, lng: null });
      setIsModalOpen(false);
      cargarTiendas();
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-sans">
      <header className="p-6 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-black text-blue-500 tracking-tighter">VD SFA</h1>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 p-2 rounded-full active:scale-90"><PlusCircle size={24} /></button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Resumen */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
            <p className="text-zinc-500 text-[9px] font-bold uppercase">Clientes</p>
            <p className="text-2xl font-black">{tiendas.length}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
            <p className="text-zinc-500 text-[9px] font-bold uppercase">Ubicados</p>
            <p className="text-2xl font-black text-green-500">{tiendas.filter(t => t.latitud).length}</p>
          </div>
        </div>

        {/* Listado de Clientes */}
        <div className="space-y-3">
          {tiendas.map((t) => (
            <div 
              key={t.id} 
              onClick={() => setSelectedTienda(t)}
              className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center active:bg-zinc-800"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${t.latitud ? 'bg-green-500/10 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}>
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{t.nombre_tienda}</h3>
                  <p className="text-[10px] text-zinc-500">{t.direccion || 'Sin GPS registrado'}</p>
                </div>
              </div>
              <QrCode size={18} className="text-blue-500" />
            </div>
          ))}
        </div>
      </main>

      {/* MODAL REGISTRO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 p-4 flex items-center justify-center">
          <div className="bg-zinc-900 w-full max-w-md rounded-3xl border border-zinc-800 p-6">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-bold">Alta de Tienda</h2>
              <button onClick={() => setIsModalOpen(false)}><X /></button>
            </div>
            <form onSubmit={registrarTienda} className="space-y-4">
              <input required placeholder="Nombre del negocio" className="w-full bg-black border border-zinc-800 rounded-xl p-3" value={nombre} onChange={e => setNombre(e.target.value)} />
              <input placeholder="Dueño" className="w-full bg-black border border-zinc-800 rounded-xl p-3" value={dueno} onChange={e => setDueno(e.target.value)} />
              
              <button type="button" onClick={obtenerUbicacion} className={`w-full p-3 rounded-xl border flex items-center justify-center gap-2 ${coords.lat ? 'border-green-500 text-green-500' : 'border-zinc-800 text-zinc-400'}`}>
                <Navigation size={18} /> {coords.lat ? 'Ubicación Capturada ✓' : 'Fijar Ubicación GPS'}
              </button>

              <button type="submit" className="w-full bg-blue-600 p-4 rounded-xl font-bold flex items-center justify-center gap-2">
                <Save size={20} /> Guardar Cliente
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QR (VISUALIZADOR) */}
      {selectedTienda && (
        <div className="fixed inset-0 z-[110] bg-black/95 p-6 flex items-center justify-center">
          <div className="text-center w-full">
            <h2 className="text-2xl font-black mb-2">{selectedTienda.nombre_tienda}</h2>
            <p className="text-zinc-500 text-sm mb-8">{selectedTienda.codigo_qr}</p>
            
            <div className="bg-white p-6 rounded-3xl inline-block shadow-2xl shadow-blue-500/20">
              <QRCodeSVG value={selectedTienda.codigo_qr} size={200} />
            </div>
            
            <button onClick={() => setSelectedTienda(null)} className="mt-12 bg-zinc-800 px-8 py-3 rounded-full font-bold">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
