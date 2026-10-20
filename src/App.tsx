import React, { useState, useEffect, useRef } from 'react';
import { 
  Shirt, 
  Sparkles, 
  Grid, 
  Plus, 
  Settings as SettingsIcon, 
  Sun, 
  Cloud, 
  CloudRain, 
  ChevronLeft, 
  ChevronRight, 
  Camera, 
  Upload, 
  Check, 
  Trash2, 
  Star, 
  RefreshCw, 
  Download, 
  MapPin,
  X
} from 'lucide-react';
import { Prenda, Look, Uso, getPrendas, savePrenda, deletePrenda, getLooks, saveLook, deleteLook, getUsos, registrarUso, clearAllData } from './db';

const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Compression failed'));
          }, 'image/jpeg', 0.8);
        } else {
          reject(new Error('Canvas context failed'));
        }
      };
    };
    reader.onerror = (err) => reject(err);
  });
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const base64ToBlob = (base64: string): Blob => {
  const byteString = atob(base64.split(',')[1]);
  const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

export default function App() {
  const [tab, setTab] = useState<'hoy' | 'armar' | 'placard' | 'agregar' | 'ajustes'>('hoy');
  const [prendas, setPrendas] = useState<Prenda[]>([]);
  const [looks, setLooks] = useState<Look[]>([]);
  const [usos, setUsos] = useState<Uso[]>([]);
  const [loading, setLoading] = useState(true);

  const [ciudad, setCiudad] = useState<string>(() => localStorage.getItem('armario_ciudad') || 'Vitoria-Gasteiz');
  const [tempActual, setTempActual] = useState<number | null>(18);
  const [tempMin, setTempMin] = useState<number | null>(11);
  const [tempMax, setTempMax] = useState<number | null>(20);
  const [ocasionFiltro, setOcasionFiltro] = useState<string>(() => localStorage.getItem('armario_ocasion') || 'Trabajo');

  const loadData = async () => {
    try {
      setLoading(true);
      const p = await getPrendas();
      const l = await getLooks();
      const u = await getUsos();
      setPrendas(p);
      setLooks(l);
      setUsos(u);
    } catch (e) {
      console.error('Error cargando datos', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then((persistent) => {
        console.log(`Persistencia de almacenamiento: ${persistent}`);
      });
    }

    const fetchWeather = async (lat: number, lon: number, name?: string) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
        const data = await res.json();
        if (data.current_weather) {
          setTempActual(Math.round(data.current_weather.temperature));
          if (data.daily) {
            setTempMin(Math.round(data.daily.temperature_2m_min[0]));
            setTempMax(Math.round(data.daily.temperature_2m_max[0]));
          }
          if (name) {
            setCiudad(name);
            localStorage.setItem('armario_ciudad', name);
          }
        }
      } catch (err) {
        console.warn('Weather fetch fallback', err);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude, 'Ubicación actual'),
        () => fetchWeather(42.8467, -2.6716, 'Vitoria-Gasteiz')
      );
    } else {
      fetchWeather(42.8467, -2.6716, 'Vitoria-Gasteiz');
    }
  }, []);

  const handleOcasionChange = (val: string) => {
    setOcasionFiltro(val);
    localStorage.setItem('armario_ocasion', val);
  };

  const [selectedPrenda, setSelectedPrenda] = useState<Prenda | null>(null);

  const renderImage = (prenda: Prenda) => {
    if (prenda.fotoBase64) return prenda.fotoBase64;
    if (prenda.fotoBlob) return URL.createObjectURL(prenda.fotoBlob);
    return null;
  };

  return (
    <div className="max-w-[420px] mx-auto min-h-screen bg-[#F4F1EA] text-[#111111] flex flex-col justify-between border-x border-[#111111]/10 relative shadow-2xl">
      <header className="px-5 pt-6 pb-3 border-b border-[#111111] bg-[#FAF8F5] flex justify-between items-center sticky top-0 z-30">
        <div>
          <h1 className="font-condensed text-3xl font-bold tracking-wider text-[#111111]">ARMARIO</h1>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#111111]/60">TECHNICAL DRESSING SYSTEM</p>
        </div>
        <button 
          onClick={() => setTab('ajustes')}
          className={`p-2 border border-[#111111] transition-all ${tab === 'ajustes' ? 'bg-[#111111] text-[#F4F1EA]' : 'bg-[#F4F1EA] text-[#111111] hover:bg-black/5'}`}
          title="Ajustes"
        >
          <SettingsIcon size={18} />
        </button>
      </header>

      <main className="flex-1 pb-24 overflow-y-auto px-4 pt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 font-mono text-sm">
            <RefreshCw className="animate-spin mb-2" size={24} />
            <span>CARGANDO SISTEMA...</span>
          </div>
        ) : (
          <>
            {tab === 'hoy' && (
              <TabHoy 
                prendas={prendas} 
                looks={looks} 
                usos={usos}
                ciudad={ciudad} 
                tempActual={tempActual} 
                tempMin={tempMin} 
                tempMax={tempMax} 
                ocasion={ocasionFiltro}
                setOcasion={handleOcasionChange}
                renderImage={renderImage}
                onRegistrarUso={loadData}
                onGoToAdd={() => setTab('agregar')}
              />
            )}

            {tab === 'armar' && (
              <TabArmar 
                prendas={prendas} 
                renderImage={renderImage}
                onSaveLook={async (look) => {
                  await saveLook(look);
                  await loadData();
                  alert('¡Combinación guardada con éxito!');
                }}
              />
            )}

            {tab === 'placard' && (
              <TabPlacard 
                prendas={prendas} 
                looks={looks}
                renderImage={renderImage}
                onSelectPrenda={(p) => setSelectedPrenda(p)}
                onGoToAdd={() => setTab('agregar')}
              />
            )}

            {tab === 'agregar' && (
              <TabAgregar 
                onSaved={async () => {
                  await loadData();
                  setTab('placard');
                }}
              />
            )}

            {tab === 'ajustes' && (
              <TabAjustes 
                prendasCount={prendas.length}
                looksCount={looks.length}
                onDataChanged={loadData}
              />
            )}
          </>
        )}
      </main>

      {selectedPrenda && (
        <ModalPrenda 
          prenda={selectedPrenda} 
          looks={looks}
          renderImage={renderImage}
          onClose={() => setSelectedPrenda(null)}
          onDelete={async (id) => {
            if (confirm('¿Eliminar esta prenda permanentemente?')) {
              await deletePrenda(id);
              setSelectedPrenda(null);
              await loadData();
            }
          }}
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto bg-[#FAF8F5] border-t-2 border-[#111111] z-40 flex justify-around p-2">
        <NavButton active={tab === 'hoy'} onClick={() => setTab('hoy')} icon={<Sparkles size={20} />} label="HOY" />
        <NavButton active={tab === 'armar'} onClick={() => setTab('armar')} icon={<Shirt size={20} />} label="ARMAR" />
        <NavButton active={tab === 'placard'} onClick={() => setTab('placard')} icon={<Grid size={20} />} label="PLACARD" />
        <NavButton active={tab === 'agregar'} onClick={() => setTab('agregar')} icon={<Plus size={20} />} label="AGREGAR" />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center flex-1 py-1 px-2 font-mono text-[11px] font-bold tracking-wider transition-all border ${active ? 'bg-[#111111] text-[#F4F1EA] border-[#111111]' : 'border-transparent text-[#111111]/70 hover:text-[#111111]'}`}
    >
      {icon}
      <span className="mt-1">{label}</span>
    </button>
  );
}

function TabHoy({ 
  prendas, 
  looks, 
  usos, 
  ciudad, 
  tempActual, 
  tempMin, 
  tempMax, 
  ocasion, 
  setOcasion,
  renderImage,
  onRegistrarUso,
  onGoToAdd
}: {
  prendas: Prenda[];
  looks: Look[];
  usos: Uso[];
  ciudad: string;
  tempActual: number | null;
  tempMin: number | null;
  tempMax: number | null;
  ocasion: string;
  setOcasion: (o: string) => void;
  renderImage: (p: Prenda) => string | null;
  onRegistrarUso: () => void;
  onGoToAdd: () => void;
}) {
  const [currentLook, setCurrentLook] = useState<{ arriba?: Prenda; abajo?: Prenda; abrigo?: Prenda } | null>(null);
  const [lookIndex, setLookIndex] = useState(0);

  const getClimaActual = () => {
    if (tempActual === null) return 'Templado';
    if (tempActual >= 20) return 'Calor';
    if (tempActual >= 14) return 'Templado';
    return 'Frío';
  };

  const climaValido = getClimaActual();

  const generarSugerencias = () => {
    const arribaOpts = prendas.filter(p => 
      p.parte === 'Arriba' && 
      (p.clima.includes(climaValido) || p.clima.length === 0) &&
      (p.ocasiones.includes(ocasion) || p.ocasiones.length === 0)
    );

    const abajoOpts = prendas.filter(p => 
      p.parte === 'Abajo' && 
      (p.clima.includes(climaValido) || p.clima.length === 0) &&
      (p.ocasiones.includes(ocasion) || p.ocasiones.length === 0)
    );

    const abrigoOpts = prendas.filter(p => p.parte === 'Abrigo');

    if (arribaOpts.length === 0 || abajoOpts.length === 0) return [];

    const ultimosTresDias = new Date();
    ultimosTresDias.setDate(ultimosTresDias.getDate() - 3);
    const fechaLimite = ultimosTresDias.toISOString().split('T')[0];

    const recientesIds = usos
      .filter(u => u.fecha >= fechaLimite)
      .map(u => u.lookId);

    const combos: { arriba: Prenda; abajo: Prenda; abrigo?: Prenda; score: number }[] = [];

    for (const a of arribaOpts) {
      for (const b of abajoOpts) {
        const lookObj = looks.find(l => l.prendasIds.includes(a.id) && l.prendasIds.includes(b.id));
        if (lookObj && recientesIds.includes(lookObj.id)) {
          continue;
        }

        let score = (a.vecesUsada || 0) + (b.vecesUsada || 0);
        
        let chosenAbrigo: Prenda | undefined = undefined;
        if (tempMin !== null && tempMin < 16 && abrigoOpts.length > 0) {
          chosenAbrigo = abrigoOpts[Math.floor(Math.random() * abrigoOpts.length)];
        }

        combos.push({ arriba: a, abajo: b, abrigo: chosenAbrigo, score });
      }
    }

    combos.sort((x, y) => x.score - y.score);
    return combos;
  };

  const sugerencias = generarSugerencias();

  useEffect(() => {
    if (sugerencias.length > 0) {
      const idx = lookIndex % sugerencias.length;
      setCurrentLook(sugerencias[idx]);
    } else {
      setCurrentLook(null);
    }
  }, [ocasion, tempActual, prendas, lookIndex]);

  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'short'
  });

  const tienePrendasSuficientes = 
    prendas.some(p => p.parte === 'Arriba') && 
    prendas.some(p => p.parte === 'Abajo');

  return (
    <div className="space-y-5">
      <div className="border-b-2 border-[#111111] pb-2 flex justify-between items-baseline">
        <span className="font-mono text-xs uppercase tracking-widest text-[#111111]/70">DÍA ACTUAL</span>
        <span className="font-condensed text-xl font-bold uppercase">{fechaHoy}</span>
      </div>

      <div className="border border-[#111111] bg-[#FAF8F5] p-4 corner-mark relative">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1.5">
            <MapPin size={16} className="text-[#111111]" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider">{ciudad}</span>
          </div>
          <span className="font-mono text-[10px] bg-[#111111] text-[#F4F1EA] px-2 py-0.5 uppercase">
            Clima: {climaValido}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tempActual !== null && tempActual >= 20 ? (
              <Sun size={32} className="text-[#111111]" />
            ) : tempActual !== null && tempActual >= 14 ? (
              <Cloud size={32} className="text-[#111111]" />
            ) : (
              <CloudRain size={32} className="text-[#111111]" />
            )}
            <div>
              <span className="font-condensed text-4xl font-bold">{tempActual !== null ? `${tempActual}°C` : '--'}</span>
            </div>
          </div>
          <div className="text-right font-mono text-xs space-y-0.5">
            <div>MÍN: <span className="font-bold">{tempMin !== null ? `${tempMin}°` : '--'}</span></div>
            <div>MÁX: <span className="font-bold">{tempMax !== null ? `${tempMax}°` : '--'}</span></div>
          </div>
        </div>
      </div>

      <div>
        <label className="block font-mono text-[10px] uppercase tracking-wider text-[#111111]/70 mb-1">OCASIÓN</label>
        <div className="grid grid-cols-3 gap-1 bg-[#E8E4D9] p-1 border border-[#111111]">
          {['Trabajo', 'Salida', 'Finde'].map((oc) => (
            <button
              key={oc}
              onClick={() => {
                setOcasion(oc);
                setLookIndex(0);
              }}
              className={`py-2 font-mono text-xs font-bold uppercase transition-all ${ocasion === oc ? 'bg-[#111111] text-[#F4F1EA]' : 'text-[#111111] hover:bg-black/5'}`}
            >
              {oc}
            </button>
          ))}
        </div>
      </div>

      {!tienePrendasSuficientes ? (
        <div className="border border-dashed border-[#111111] p-8 text-center bg-[#FAF8F5] my-6">
          <p className="font-mono text-sm mb-4">TODAVÍA NO CARGASTE ROPA SUFICIENTE</p>
          <p className="font-sans text-xs text-[#111111]/70 mb-6">Para sugerir un look necesitas al menos 1 prenda de Arriba y 1 de Abajo.</p>
          <button 
            onClick={onGoToAdd}
            className="w-full py-3 bg-[#111111] text-[#F4F1EA] font-mono text-xs font-bold uppercase hover:bg-black/80 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} /> CARGAR PRIMERA PRENDA
          </button>
        </div>
      ) : currentLook ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-mono text-xs font-bold uppercase">LOOK SUGERIDO</span>
            <span className="font-mono text-[10px] text-[#111111]/60">OPCIÓN {(lookIndex % sugerencias.length) + 1} DE {sugerencias.length}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="border border-[#111111] bg-[#FAF8F5] p-2 corner-mark flex flex-col justify-between">
              <span className="font-mono text-[9px] bg-[#111111]/10 px-1 py-0.5 self-start uppercase font-bold">ARRIBA</span>
              <div className="h-36 my-2 flex items-center justify-center overflow-hidden">
                {renderImage(currentLook.arriba!) ? (
                  <img 
                    src={renderImage(currentLook.arriba!)!} 
                    alt={currentLook.arriba!.nombre}
                    className="max-h-full max-w-full object-contain mix-blend-multiply" 
                  />
                ) : (
                  <Shirt size={48} className="text-[#111111]/20" />
                )}
              </div>
              <div>
                <p className="font-condensed font-bold text-sm uppercase truncate">{currentLook.arriba!.nombre}</p>
                <p className="font-mono text-[10px] text-[#111111]/60 uppercase">{currentLook.arriba!.tela}</p>
              </div>
            </div>

            <div className="border border-[#111111] bg-[#FAF8F5] p-2 corner-mark flex flex-col justify-between">
              <span className="font-mono text-[9px] bg-[#111111]/10 px-1 py-0.5 self-start uppercase font-bold">ABAJO</span>
              <div className="h-36 my-2 flex items-center justify-center overflow-hidden">
                {renderImage(currentLook.abajo!) ? (
                  <img 
                    src={renderImage(currentLook.abajo!)!} 
                    alt={currentLook.abajo!.nombre}
                    className="max-h-full max-w-full object-contain mix-blend-multiply" 
                  />
                ) : (
                  <Shirt size={48} className="text-[#111111]/20" />
                )}
              </div>
              <div>
                <p className="font-condensed font-bold text-sm uppercase truncate">{currentLook.abajo!.nombre}</p>
                <p className="font-mono text-[10px] text-[#111111]/60 uppercase">{currentLook.abajo!.tela}</p>
              </div>
            </div>
          </div>

          {currentLook.abrigo && (
            <div className="border border-[#111111] bg-[#FAF8F5] p-3 flex items-center gap-3">
              <div className="w-12 h-12 border border-[#111111] flex items-center justify-center shrink-0 bg-white">
                {renderImage(currentLook.abrigo) ? (
                  <img src={renderImage(currentLook.abrigo)!} alt="Abrigo" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                ) : (
                  <Shirt size={20} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-mono text-[9px] bg-blue-600 text-white px-1 font-bold">RECOMENDACIÓN ABRIGO</span>
                <p className="font-condensed font-bold text-xs uppercase truncate">{currentLook.abrigo.nombre}</p>
              </div>
            </div>
          )}

          <div className="border border-[#111111] p-3 bg-[#FAF8F5] font-sans text-xs leading-relaxed">
            <p className="font-bold font-mono text-[10px] text-[#111111]/60 mb-0.5">ANÁLISIS DE COMBINACIÓN:</p>
            <p>
              {currentLook.arriba!.nombre} ({currentLook.arriba!.tela}) y {currentLook.abajo!.nombre} ({currentLook.abajo!.tela}): combinación idónea para {ocasion.toLowerCase()} con clima {climaValido.toLowerCase()}.
              {tempMin !== null && tempMin < 16 && " A la mañana hace frío: añade un abrigo para las primeras horas."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setLookIndex(prev => prev + 1)}
              className="py-3 px-4 border border-[#111111] bg-[#FAF8F5] font-mono text-xs font-bold uppercase hover:bg-black/5 active:bg-black/10 transition-all flex items-center justify-center gap-2 h-11"
            >
              <RefreshCw size={14} /> OTRA OPCIÓN
            </button>

            <button
              onClick={async () => {
                const pIds = [currentLook.arriba!.id, currentLook.abajo!.id];
                if (currentLook.abrigo) pIds.push(currentLook.abrigo.id);

                let lookObj = looks.find(l => 
                  l.prendasIds.length === pIds.length && 
                  l.prendasIds.every(id => pIds.includes(id))
                );

                const newLookId = lookObj ? lookObj.id : Date.now().toString();

                if (!lookObj) {
                  await saveLook({
                    id: newLookId,
                    prendasIds: pIds,
                    ocasion,
                    nota: 'Look registrado desde Hoy',
                    fecha: new Date().toISOString().split('T')[0],
                    favorito: false
                  });
                }

                await registrarUso(newLookId, pIds);
                alert('¡Look registrado como usado hoy!');
                onRegistrarUso();
              }}
              className="py-3 px-4 bg-[#111111] text-[#F4F1EA] font-mono text-xs font-bold uppercase hover:bg-black/80 active:bg-black transition-all flex items-center justify-center gap-2 h-11"
            >
              <Check size={14} /> USAR ESTE LOOK
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-[#111111] p-6 text-center bg-[#FAF8F5]">
          <p className="font-mono text-xs mb-2">NO HAY COMBINACIONES DISPONIBLES PARA {ocasion.toUpperCase()} EN CLIMA {climaValido.toUpperCase()}</p>
          <p className="font-sans text-xs text-[#111111]/70">Prueba cambiando la ocasión o agregando más prendas clasificadas para este clima.</p>
        </div>
      )}
    </div>
  );
}

function TabArmar({ 
  prendas, 
  renderImage, 
  onSaveLook 
}: { 
  prendas: Prenda[]; 
  renderImage: (p: Prenda) => string | null;
  onSaveLook: (look: Look) => Promise<void>;
}) {
  const arribaItems = prendas.filter(p => p.parte === 'Arriba');
  const abajoItems = prendas.filter(p => p.parte === 'Abajo');

  const [idxArriba, setIdxArriba] = useState(0);
  const [idxAbajo, setIdxAbajo] = useState(0);

  const prendaArriba = arribaItems[idxArriba];
  const prendaAbajo = abajoItems[idxAbajo];

  if (arribaItems.length === 0 || abajoItems.length === 0) {
    return (
      <div className="border border-dashed border-[#111111] p-8 text-center bg-[#FAF8F5] my-6">
        <p className="font-mono text-sm mb-2">FALTAN PRENDAS</p>
        <p className="font-sans text-xs text-[#111111]/70">Necesitas al menos 1 prenda de arriba y 1 de abajo en tu placard para armar outfits.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="border-b-2 border-[#111111] pb-2">
        <h2 className="font-condensed text-xl font-bold uppercase">ESTUDIO DE MEZCLA</h2>
        <p className="font-mono text-[10px] text-[#111111]/60">DESLIZA PARA COMBINAR PIEZAS</p>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center font-mono text-[10px] uppercase font-bold">
          <span>PARTE SUPERIOR</span>
          <span>{idxArriba + 1} / {arribaItems.length}</span>
        </div>
        <div className="border border-[#111111] bg-[#FAF8F5] p-3 corner-mark flex items-center justify-between">
          <button 
            onClick={() => setIdxArriba(prev => (prev > 0 ? prev - 1 : arribaItems.length - 1))}
            className="p-2 border border-[#111111] hover:bg-black/5"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 text-center h-40 flex flex-col items-center justify-center px-2">
            {renderImage(prendaArriba) ? (
              <img src={renderImage(prendaArriba)!} alt={prendaArriba.nombre} className="max-h-32 object-contain mix-blend-multiply" />
            ) : (
              <Shirt size={48} className="text-[#111111]/20" />
            )}
            <p className="font-condensed font-bold text-sm uppercase mt-1">{prendaArriba.nombre}</p>
          </div>
          <button 
            onClick={() => setIdxArriba(prev => (prev < arribaItems.length - 1 ? prev + 1 : 0))}
            className="p-2 border border-[#111111] hover:bg-black/5"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center font-mono text-[10px] uppercase font-bold">
          <span>PARTE INFERIOR</span>
          <span>{idxAbajo + 1} / {abajoItems.length}</span>
        </div>
        <div className="border border-[#111111] bg-[#FAF8F5] p-3 corner-mark flex items-center justify-between">
          <button 
            onClick={() => setIdxAbajo(prev => (prev > 0 ? prev - 1 : abajoItems.length - 1))}
            className="p-2 border border-[#111111] hover:bg-black/5"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 text-center h-40 flex flex-col items-center justify-center px-2">
            {renderImage(prendaAbajo) ? (
              <img src={renderImage(prendaAbajo)!} alt={prendaAbajo.nombre} className="max-h-32 object-contain mix-blend-multiply" />
            ) : (
              <Shirt size={48} className="text-[#111111]/20" />
            )}
            <p className="font-condensed font-bold text-sm uppercase mt-1">{prendaAbajo.nombre}</p>
          </div>
          <button 
            onClick={() => setIdxAbajo(prev => (prev < abajoItems.length - 1 ? prev + 1 : 0))}
            className="p-2 border border-[#111111] hover:bg-black/5"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="border border-[#111111] bg-[#FAF8F5] p-3 space-y-2">
        <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
          <span className="bg-[#111111] text-[#F4F1EA] px-2 py-0.5">{prendaArriba.tela}</span>
          <span className="bg-[#111111] text-[#F4F1EA] px-2 py-0.5">{prendaAbajo.tela}</span>
          <span className="border border-[#111111] px-2 py-0.5">{prendaArriba.color} + {prendaAbajo.color}</span>
        </div>
        <p className="font-sans text-xs text-[#111111]/80 pt-1">
          Combinación manual registrada. Texturas complementarias de {prendaArriba.tela.toLowerCase()} y {prendaAbajo.tela.toLowerCase()}.
        </p>
      </div>

      <button
        onClick={() => {
          onSaveLook({
            id: Date.now().toString(),
            prendasIds: [prendaArriba.id, prendaAbajo.id],
            ocasion: 'Manual',
            nota: 'Guardado desde estudio Armar',
            fecha: new Date().toISOString().split('T')[0],
            favorito: true
          });
        }}
        className="w-full py-3.5 bg-[#111111] text-[#F4F1EA] font-mono text-xs font-bold uppercase hover:bg-black/80 transition-all flex items-center justify-center gap-2 h-11"
      >
        <Star size={16} /> GUARDAR COMBINACIÓN COMO LOOK
      </button>
    </div>
  );
}

function TabPlacard({ 
  prendas, 
  looks, 
  renderImage, 
  onSelectPrenda, 
  onGoToAdd 
}: { 
  prendas: Prenda[]; 
  looks: Look[]; 
  renderImage: (p: Prenda) => string | null; 
  onSelectPrenda: (p: Prenda) => void; 
  onGoToAdd: () => void; 
}) {
  const [filtroParte, setFiltroParte] = useState<string>('Todo');
  const [seccion, setSeccion] = useState<'prendas' | 'looks'>('prendas');

  const prendasFiltradas = filtroParte === 'Todo' 
    ? prendas 
    : prendas.filter(p => p.parte === filtroParte);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 border border-[#111111] bg-[#E8E4D9]">
        <button
          onClick={() => setSeccion('prendas')}
          className={`py-2 font-mono text-xs font-bold uppercase ${seccion === 'prendas' ? 'bg-[#111111] text-[#F4F1EA]' : 'text-[#111111]'}`}
        >
          PRENDAS ({prendas.length})
        </button>
        <button
          onClick={() => setSeccion('looks')}
          className={`py-2 font-mono text-xs font-bold uppercase ${seccion === 'looks' ? 'bg-[#111111] text-[#F4F1EA]' : 'text-[#111111]'}`}
        >
          LOOKS GUARDADOS ({looks.length})
        </button>
      </div>

      {seccion === 'prendas' ? (
        <>
          <div className="flex gap-1 overflow-x-auto pb-1 font-mono text-[11px]">
            {['Todo', 'Arriba', 'Abajo', 'Abrigo'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFiltroParte(cat)}
                className={`px-3 py-1 border border-[#111111] whitespace-nowrap uppercase font-bold ${filtroParte === cat ? 'bg-[#111111] text-[#F4F1EA]' : 'bg-[#FAF8F5]'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {prendasFiltradas.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectPrenda(p)}
                className="border border-[#111111] bg-[#FAF8F5] p-2 corner-mark cursor-pointer hover:border-black/50 flex flex-col justify-between h-48"
              >
                <div className="flex justify-between items-center font-mono text-[9px]">
                  <span className="bg-[#111111]/10 px-1 uppercase font-bold">{p.parte}</span>
                  <span className="text-[#111111]/60">{p.vecesUsada ? `${p.vecesUsada}x` : '0x'}</span>
                </div>

                <div className="h-28 flex items-center justify-center overflow-hidden my-1">
                  {renderImage(p) ? (
                    <img src={renderImage(p)!} alt={p.nombre} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                  ) : (
                    <Shirt size={36} className="text-[#111111]/20" />
                  )}
                </div>

                <div>
                  <p className="font-condensed font-bold text-xs uppercase truncate">{p.nombre}</p>
                  <p className="font-mono text-[9px] text-[#111111]/60">
                    {p.vecesUsada ? `Usada ${p.vecesUsada} veces` : 'Nunca usada'}
                  </p>
                </div>
              </div>
            ))}

            <div
              onClick={onGoToAdd}
              className="border border-dashed border-[#111111] bg-transparent p-2 flex flex-col items-center justify-center h-48 cursor-pointer hover:bg-black/5 transition-all text-center"
            >
              <Plus size={32} className="mb-2 text-[#111111]" />
              <span className="font-mono text-xs font-bold uppercase">+ AGREGAR PRENDA</span>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {looks.length === 0 ? (
            <div className="border border-dashed border-[#111111] p-8 text-center bg-[#FAF8F5]">
              <p className="font-mono text-xs">NO HAY LOOKS GUARDADOS</p>
            </div>
          ) : (
            looks.map((look) => {
              const lookPrendas = prendas.filter(p => look.prendasIds.includes(p.id));
              return (
                <div key={look.id} className="border border-[#111111] bg-[#FAF8F5] p-3 corner-mark space-y-2">
                  <div className="flex justify-between items-center font-mono text-xs">
                    <span className="font-bold uppercase">OCASIÓN: {look.ocasion}</span>
                    <button 
                      onClick={async () => {
                        await saveLook({ ...look, favorito: !look.favorito });
                      }}
                    >
                      <Star size={16} className={look.favorito ? "fill-[#111111] text-[#111111]" : "text-[#111111]/40"} />
                    </button>
                  </div>
                  <div className="flex gap-2 py-1">
                    {lookPrendas.map(p => (
                      <div key={p.id} className="w-16 h-16 border border-[#111111] p-1 bg-white flex items-center justify-center">
                        {renderImage(p) ? (
                          <img src={renderImage(p)!} alt={p.nombre} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                        ) : (
                          <Shirt size={16} />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="font-sans text-xs text-[#111111]/70">{look.nota}</p>
                  <div className="flex justify-between items-center font-mono text-[9px] text-[#111111]/50 border-t border-[#111111]/10 pt-1">
                    <span>FECHA: {look.fecha}</span>
                    <button 
                      onClick={async () => {
                        if (confirm('¿Eliminar look?')) {
                          await deleteLook(look.id);
                        }
                      }}
                      className="text-red-600 font-bold uppercase"
                    >
                      ELIMINAR
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function TabAgregar({ onSaved }: { onSaved: () => void }) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('remera');
  const [parte, setParte] = useState<'Arriba' | 'Abajo' | 'Entero' | 'Abrigo'>('Arriba');
  const [color, setColor] = useState('');
  const [tela, setTela] = useState('');
  const [clima, setClima] = useState<string[]>(['Templado']);
  const [ocasiones, setOcasiones] = useState<string[]>(['Trabajo']);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const compressed = await compressImage(file);
        setImageBlob(compressed);
        setPreviewUrl(URL.createObjectURL(compressed));
      } catch (err) {
        alert('Error procesando imagen');
      }
    }
  };

  const toggleClima = (c: string) => {
    setClima(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const toggleOcasion = (o: string) => {
    setOcasiones(prev => prev.includes(o) ? prev.filter(x => x !== o) : [...prev, o]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !imageBlob) {
      alert('Ingresa el nombre y carga una imagen.');
      return;
    }

    const base64 = await blobToBase64(imageBlob);

    const nuevaPrenda: Prenda = {
      id: Date.now().toString(),
      fotoBlob: imageBlob,
      fotoBase64: base64,
      nombre,
      tipo,
      parte,
      color: color || 'Negro',
      tela: tela || 'Algodón',
      clima,
      ocasiones,
      vecesUsada: 0,
      fechaAlta: new Date().toISOString().split('T')[0]
    };

    await savePrenda(nuevaPrenda);
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-6">
      <div className="border-b-2 border-[#111111] pb-2">
        <h2 className="font-condensed text-xl font-bold uppercase">REGISTRAR NUEVA PRENDA</h2>
      </div>

      <div className="border border-[#111111] bg-[#FAF8F5] p-4 text-center corner-mark">
        {previewUrl ? (
          <div className="space-y-3">
            <div className="h-48 flex items-center justify-center overflow-hidden">
              <img src={previewUrl} alt="Preview" className="max-h-full object-contain mix-blend-multiply" />
            </div>
            <button
              type="button"
              onClick={() => {
                setPreviewUrl(null);
                setImageBlob(null);
              }}
              className="py-1 px-3 border border-[#111111] font-mono text-xs uppercase hover:bg-black/5"
            >
              CAMBIAR FOTO
            </button>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center">
            <Camera size={36} className="mb-2 text-[#111111]" />
            <p className="font-mono text-xs mb-4">CAPTURAR O ELEGIR IMAGEN</p>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-5 bg-[#111111] text-[#F4F1EA] font-mono text-xs uppercase font-bold hover:bg-black/80"
            >
              SELECCIONAR FOTO
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block font-mono text-[10px] uppercase font-bold mb-1">NOMBRE DE PRENDA</label>
          <input
            type="text"
            required
            placeholder="ej. Blusa lino blanca"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-2.5 bg-[#FAF8F5] border border-[#111111] font-sans text-xs focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-mono text-[10px] uppercase font-bold mb-1">PARTE DEL CUERPO</label>
            <select
              value={parte}
              onChange={(e) => setParte(e.target.value as any)}
              className="w-full p-2.5 bg-[#FAF8F5] border border-[#111111] font-mono text-xs focus:outline-none"
            >
              <option value="Arriba">Arriba</option>
              <option value="Abajo">Abajo</option>
              <option value="Entero">Entero</option>
              <option value="Abrigo">Abrigo</option>
            </select>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase font-bold mb-1">TIPO DE PRENDA</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full p-2.5 bg-[#FAF8F5] border border-[#111111] font-mono text-xs focus:outline-none uppercase"
            >
              <option value="remera">Remera</option>
              <option value="camisa">Camisa</option>
              <option value="blusa">Blusa</option>
              <option value="pantalón">Pantalón</option>
              <option value="pollera">Pollera</option>
              <option value="vestido">Vestido</option>
              <option value="abrigo">Abrigo</option>
              <option value="calzado">Calzado</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-mono text-[10px] uppercase font-bold mb-1">COLOR</label>
            <input
              type="text"
              placeholder="ej. Negro, Beige"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full p-2.5 bg-[#FAF8F5] border border-[#111111] font-sans text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase font-bold mb-1">TELA / MATERIAL</label>
            <input
              type="text"
              placeholder="ej. Lino, Algodón"
              value={tela}
              onChange={(e) => setTela(e.target.value)}
              className="w-full p-2.5 bg-[#FAF8F5] border border-[#111111] font-sans text-xs focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-mono text-[10px] uppercase font-bold mb-1">CLIMA APTO</label>
          <div className="flex gap-2">
            {['Calor', 'Templado', 'Frío'].map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => toggleClima(c)}
                className={`flex-1 py-2 font-mono text-xs uppercase border border-[#111111] font-bold ${clima.includes(c) ? 'bg-[#111111] text-[#F4F1EA]' : 'bg-[#FAF8F5]'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-mono text-[10px] uppercase font-bold mb-1">OCASIONES</label>
          <div className="grid grid-cols-2 gap-2">
            {['Trabajo', 'Salida', 'Finde', 'Casa'].map((o) => (
              <button
                type="button"
                key={o}
                onClick={() => toggleOcasion(o)}
                className={`py-2 font-mono text-xs uppercase border border-[#111111] font-bold ${ocasiones.includes(o) ? 'bg-[#111111] text-[#F4F1EA]' : 'bg-[#FAF8F5]'}`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-4 bg-[#111111] text-[#F4F1EA] font-mono text-xs font-bold uppercase hover:bg-black/80 transition-all mt-4 h-12"
      >
        GUARDAR EN EL PLACARD
      </button>
    </form>
  );
}

function TabAjustes({ 
  prendasCount, 
  looksCount, 
  onDataChanged 
}: { 
  prendasCount: number; 
  looksCount: number; 
  onDataChanged: () => void; 
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportBackup = async () => {
    const prendas = await getPrendas();
    const looks = await getLooks();
    const usos = await getUsos();

    const data = {
      version: 1,
      timestamp: new Date().toISOString(),
      prendas,
      looks,
      usos
    };

    const jsonString = JSON.stringify(data);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `armario-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.prendas) {
          await clearAllData();
          for (const p of data.prendas) {
            if (p.fotoBase64 && !p.fotoBlob) {
              p.fotoBlob = base64ToBlob(p.fotoBase64);
            }
            await savePrenda(p);
          }
          if (data.looks) {
            for (const l of data.looks) await saveLook(l);
          }
          alert('¡Copia de seguridad restaurada correctamente!');
          onDataChanged();
        }
      } catch (err) {
        alert('Archivo de backup no válido');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5">
      <div className="border-b-2 border-[#111111] pb-2">
        <h2 className="font-condensed text-xl font-bold uppercase">AJUSTES Y DATOS</h2>
      </div>

      <div className="border border-[#111111] bg-[#FAF8F5] p-4 space-y-3 corner-mark">
        <span className="font-mono text-xs font-bold uppercase">ESTADÍSTICAS DEL VESTIDOR</span>
        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
          <div className="p-3 border border-[#111111] bg-white">
            <p className="text-[10px] text-[#111111]/60">PRENDAS</p>
            <p className="font-condensed text-2xl font-bold">{prendasCount}</p>
          </div>
          <div className="p-3 border border-[#111111] bg-white">
            <p className="text-[10px] text-[#111111]/60">LOOKS</p>
            <p className="font-condensed text-2xl font-bold">{looksCount}</p>
          </div>
        </div>
      </div>

      <div className="border border-[#111111] bg-[#FAF8F5] p-4 space-y-3 corner-mark">
        <span className="font-mono text-xs font-bold uppercase">COPIA DE SEGURIDAD (RESPALDO LOCAL)</span>
        <p className="font-sans text-xs text-[#111111]/70">
          Los datos están almacenados únicamente en este dispositivo. Descarga una copia completa con tus fotos para resguardarlas.
        </p>

        <div className="space-y-2 pt-2">
          <button
            onClick={exportBackup}
            className="w-full py-3 border border-[#111111] bg-[#FAF8F5] font-mono text-xs font-bold uppercase hover:bg-black/5 flex items-center justify-center gap-2"
          >
            <Download size={16} /> EXPORTAR RESPALDO JSON
          </button>

          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={importBackup} 
            className="hidden" 
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 border border-[#111111] bg-[#FAF8F5] font-mono text-xs font-bold uppercase hover:bg-black/5 flex items-center justify-center gap-2"
          >
            <Upload size={16} /> IMPORTAR RESPALDO JSON
          </button>
        </div>
      </div>

      <div className="border border-[#111111] bg-[#FAF8F5] p-4 space-y-2">
        <span className="font-mono text-xs font-bold uppercase">LIMPIAR DATOS</span>
        <button
          onClick={async () => {
            if (confirm('¿ATENCIÓN: Borrar todos los datos y fotos del dispositivo?')) {
              await clearAllData();
              onDataChanged();
              alert('Datos borrados.');
            }
          }}
          className="w-full py-3 bg-red-600 text-white font-mono text-xs font-bold uppercase hover:bg-red-700 flex items-center justify-center gap-2"
        >
          <Trash2 size={16} /> RESETEAR BASE DE DATOS
        </button>
      </div>
    </div>
  );
}

function ModalPrenda({ 
  prenda, 
  looks, 
  renderImage, 
  onClose, 
  onDelete 
}: { 
  prenda: Prenda; 
  looks: Look[]; 
  renderImage: (p: Prenda) => string | null; 
  onClose: () => void; 
  onDelete: (id: string) => void; 
}) {
  const looksDondeAparece = looks.filter(l => l.prendasIds.includes(prenda.id));

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#FAF8F5] border-2 border-[#111111] w-full max-w-[380px] p-4 space-y-4 max-h-[90vh] overflow-y-auto relative corner-mark">
        <button onClick={onClose} className="absolute top-3 right-3 p-1 border border-[#111111]">
          <X size={18} />
        </button>

        <h3 className="font-condensed text-xl font-bold uppercase pr-8">{prenda.nombre}</h3>

        <div className="h-44 border border-[#111111] bg-white flex items-center justify-center p-2">
          {renderImage(prenda) ? (
            <img src={renderImage(prenda)!} alt={prenda.nombre} className="max-h-full max-w-full object-contain mix-blend-multiply" />
          ) : (
            <Shirt size={48} className="text-[#111111]/20" />
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
          <div className="border border-[#111111] p-2 bg-white">
            <span className="text-[9px] text-[#111111]/60 block">PARTE</span>
            <span className="font-bold uppercase">{prenda.parte}</span>
          </div>
          <div className="border border-[#111111] p-2 bg-white">
            <span className="text-[9px] text-[#111111]/60 block">TELA</span>
            <span className="font-bold uppercase">{prenda.tela}</span>
          </div>
          <div className="border border-[#111111] p-2 bg-white">
            <span className="text-[9px] text-[#111111]/60 block">COLOR</span>
            <span className="font-bold uppercase">{prenda.color}</span>
          </div>
          <div className="border border-[#111111] p-2 bg-white">
            <span className="text-[9px] text-[#111111]/60 block">USOS</span>
            <span className="font-bold uppercase">{prenda.vecesUsada || 0} VECES</span>
          </div>
        </div>

        <div>
          <span className="font-mono text-[10px] font-bold uppercase">LOOKS DONDE APARECE ({looksDondeAparece.length})</span>
          {looksDondeAparece.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pt-2">
              {looksDondeAparece.map(l => (
                <div key={l.id} className="p-2 border border-[#111111] bg-white text-[10px] font-mono shrink-0">
                  <span>LOOK {l.ocasion}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-sans text-xs text-[#111111]/50 pt-1">Sin looks guardados aún con esta prenda.</p>
          )}
        </div>

        <div className="pt-2 flex justify-between gap-2">
          <button
            onClick={() => onDelete(prenda.id)}
            className="flex-1 py-2.5 bg-red-600 text-white font-mono text-xs font-bold uppercase hover:bg-red-700"
          >
            ELIMINAR
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#111111] font-mono text-xs font-bold uppercase hover:bg-black/5"
          >
            CERRAR
          </button>
        </div>
      </div>
    </div>
  );
}
