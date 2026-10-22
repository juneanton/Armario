import React, { useState, useEffect } from 'react';
import { db, Garment, DEFAULT_TYPES, DEFAULT_OCCASIONS } from './db';

export function App() {
  const [activeTab, setActiveTab] = useState<'hoy' | 'crear' | 'armario' | 'añadir'>('hoy');
  const [garments, setGarments] = useState<Garment[]>([]);
  const [types, setTypes] = useState<string[]>(DEFAULT_TYPES);
  const [occasions, setOccasions] = useState<string[]>(DEFAULT_OCCASIONS);

  // Estados para Formulario Añadir / Editar
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formType, setFormType] = useState<string>(DEFAULT_TYPES[0]);
  const [formOccasion, setFormOccasion] = useState<string>(DEFAULT_OCCASIONS[0]);
  const [formMinTemp, setFormMinTemp] = useState<number>(10);
  const [formMaxTemp, setFormMaxTemp] = useState<number>(25);
  const [formImage, setFormImage] = useState<string>('');

  // Estados para Selección de Look en CREAR
  const [selectedOutfit, setSelectedOutfit] = useState<Record<string, Garment>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allGarments = await db.garments.toArray();
    setGarments(allGarments);

    const savedTypes = await db.configs.get({ key: 'types' });
    if (savedTypes) {
      setTypes(savedTypes.values);
    }

    const savedOccasions = await db.configs.get({ key: 'occasions' });
    if (savedOccasions) setOccasions(savedOccasions.values);
  };

  // Manejador de subida de imágenes (Cámara o Galería)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Guardar o Actualizar Prenda
  const handleSaveGarment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formImage) {
      alert('Por favor selecciona o toma una foto de la prenda.');
      return;
    }

    if (editingId) {
      await db.garments.update(editingId, {
        type: formType,
        occasion: formOccasion,
        minTemp: formMinTemp,
        maxTemp: formMaxTemp,
        imageUrl: formImage,
      });
      alert('Prenda actualizada correctamente');
    } else {
      await db.garments.add({
        type: formType,
        occasion: formOccasion,
        minTemp: formMinTemp,
        maxTemp: formMaxTemp,
        imageUrl: formImage,
        createdAt: new Date(),
      });
      alert('Prenda guardada con éxito');
    }

    resetForm();
    loadData();
    setActiveTab('armario');
  };

  const handleEditClick = (garment: Garment) => {
    if (!garment.id) return;
    setEditingId(garment.id);
    setFormType(garment.type);
    setFormOccasion(garment.occasion);
    setFormMinTemp(garment.minTemp);
    setFormMaxTemp(garment.maxTemp);
    setFormImage(garment.imageUrl);
    setActiveTab('añadir');
  };

  const handleDeleteClick = async (id?: number) => {
    if (!id) return;
    if (confirm('¿Eliminar esta prenda del armario?')) {
      await db.garments.delete(id);
      loadData();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormType(types[0] || DEFAULT_TYPES[0]);
    setFormOccasion(occasions[0] || DEFAULT_OCCASIONS[0]);
    setFormMinTemp(10);
    setFormMaxTemp(25);
    setFormImage('');
  };

  // Orden estricto de carruseles solicitado
  const desiredOrder = ['Arriba exterior', 'Arriba interior', 'Abajo', 'Zapatos', 'Abrigo', 'Accesorios', 'Entero'];
  const orderedTypes = Array.from(new Set([...desiredOrder, ...types]));

  // Lógica para manejar la selección de prendas y el comportamiento especial de "Entero"
  const handleSelectGarment = (typeCategory: string, garment: Garment) => {
    if (typeCategory === 'Entero') {
      // Si selecciona un Entero, sustituye a Arriba interior y Abajo
      setSelectedOutfit((prev) => ({
        ...prev,
        'Entero': garment,
        'Arriba interior': garment,
        'Abajo': garment,
      }));
    } else if (typeCategory === 'Arriba interior' || typeCategory === 'Abajo') {
      // Si selecciona Arriba interior o Abajo, limpia el Entero si lo había
      setSelectedOutfit((prev) => {
        const copy = { ...prev, [typeCategory]: garment };
        delete copy['Entero'];
        return copy;
      });
    } else {
      setSelectedOutfit((prev) => ({
        ...prev,
        [typeCategory]: garment,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#111111] font-mono max-w-md mx-auto border-x border-[#111111]">
      {/* Header */}
      <header className="p-4 border-b border-[#111111] bg-[#FAF8F5] flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tighter">ARMARIO</h1>
          <p className="text-xs tracking-widest text-neutral-500">TECHNICAL DRESSING SYSTEM</p>
        </div>
      </header>

      {/* Main Content Areas */}
      <main className="p-4 pb-24">
        {/* TAB: HOY */}
        {activeTab === 'hoy' && (
          <div className="space-y-4">
            <div className="border border-[#111111] p-3 bg-white">
              <h2 className="text-xs font-bold uppercase tracking-wider mb-1">Día Actual</h2>
              <p className="text-lg font-bold">HOY EN VITORIA-GASTEIZ</p>
              <div className="text-2xl font-black mt-2">18°C <span className="text-xs font-normal">TEMPLADO</span></div>
            </div>

            <div className="border border-[#111111] p-4 text-center bg-[#FAF8F5]">
              <p className="text-sm font-bold uppercase">Sugerencia Automática</p>
              {garments.length < 2 ? (
                <div className="py-6 text-xs text-neutral-600">
                  Añade más prendas a tu armario para generar looks automáticos.
                </div>
              ) : (
                <p className="text-xs mt-2">Cargando combinación sugerida...</p>
              )}
            </div>
          </div>
        )}

        {/* TAB: CREAR (Carruseles en orden estricto + Lógica Entero) */}
        {activeTab === 'crear' && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold tracking-wider uppercase border-b border-[#111111] pb-1">
              CREAR LOOK INTERACTIVO
            </h2>

            {orderedTypes.map((typeCategory) => {
              const items = garments.filter((g) => g.type === typeCategory);

              return (
                <div key={typeCategory} className="border border-[#111111] p-3 bg-white">
                  <span className="text-xs font-black uppercase tracking-widest block mb-2">
                    {typeCategory} ({items.length})
                  </span>

                  {items.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">Sin prendas registradas</p>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                      {items.map((garment) => {
                        const isSelected = selectedOutfit[typeCategory]?.id === garment.id;
                        return (
                          <div
                            key={garment.id}
                            onClick={() => handleSelectGarment(typeCategory, garment)}
                            className={`flex-shrink-0 w-24 h-28 border ${
                              isSelected ? 'border-2 border-black bg-neutral-100' : 'border-neutral-300'
                            } p-1 cursor-pointer flex flex-col justify-between`}
                          >
                            <img
                              src={garment.imageUrl}
                              alt={garment.type}
                              className="w-full h-20 object-cover border border-neutral-200"
                            />
                            <span className="text-[10px] text-center font-bold truncate">
                              {garment.occasion}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB: ARMARIO (Listado + Edición) */}
        {activeTab === 'armario' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#111111] pb-1">
              <h2 className="text-sm font-bold uppercase tracking-wider">MI ARMARIO ({garments.length})</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {garments.map((item) => (
                <div key={item.id} className="border border-[#111111] bg-white p-2 flex flex-col justify-between">
                  <img src={item.imageUrl} alt={item.type} className="w-full h-32 object-cover border mb-2" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold uppercase">{item.type}</p>
                    <p className="text-[10px] text-neutral-600">{item.occasion} | {item.minTemp}°C - {item.maxTemp}°C</p>
                  </div>
                  <div className="flex gap-2 mt-3 pt-2 border-t border-neutral-200">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="flex-1 bg-neutral-900 text-white text-[10px] py-1 font-bold hover:bg-black"
                    >
                      EDITAR
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item.id)}
                      className="px-2 border border-[#111111] text-[10px] font-bold hover:bg-red-50"
                    >
                      X
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: AÑADIR / EDITAR PRENDA */}
        {activeTab === 'añadir' && (
          <form onSubmit={handleSaveGarment} className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider border-b border-[#111111] pb-1">
              {editingId ? 'EDITAR PRENDA' : 'AÑADIR NUEVA PRENDA'}
            </h2>

            {/* Subida de Imagen (Cámara o Galería) */}
            <div className="border border-dashed border-[#111111] p-4 text-center bg-white space-y-2">
              {formImage ? (
                <img src={formImage} alt="Vista previa" className="w-32 h-32 object-cover mx-auto border" />
              ) : (
                <div className="text-xs text-neutral-500">Sin foto seleccionada</div>
              )}

              <div className="flex gap-2 justify-center pt-2">
                <label className="bg-[#111111] text-white text-xs px-3 py-2 cursor-pointer font-bold">
                  📷 CÁMARA
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <label className="border border-[#111111] bg-white text-xs px-3 py-2 cursor-pointer font-bold">
                  🖼️ GALERÍA
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Tipo de Prenda */}
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Tipo de Prenda</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full border border-[#111111] p-2 bg-white text-xs font-mono"
              >
                {types.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Ocasión */}
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Ocasión</label>
              <select
                value={formOccasion}
                onChange={(e) => setFormOccasion(e.target.value)}
                className="w-full border border-[#111111] p-2 bg-white text-xs font-mono"
              >
                {occasions.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            {/* Rango de Temperatura */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Mín (°C)</label>
                <input
                  type="number"
                  value={formMinTemp}
                  onChange={(e) => setFormMinTemp(Number(e.target.value))}
                  className="w-full border border-[#111111] p-2 bg-white text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Máx (°C)</label>
                <input
                  type="number"
                  value={formMaxTemp}
                  onChange={(e) => setFormMaxTemp(Number(e.target.value))}
                  className="w-full border border-[#111111] p-2 bg-white text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-[#111111] text-white py-3 text-xs font-bold tracking-widest uppercase hover:bg-neutral-800"
              >
                {editingId ? 'GUARDAR CAMBIOS' : 'AÑADIR AL ARMARIO'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveTab('armario');
                  }}
                  className="px-4 border border-[#111111] text-xs font-bold"
                >
                  CANCELAR
                </button>
              )}
            </div>
          </form>
        )}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 max-w-md w-full bg-[#111111] text-white flex justify-around py-3 border-t border-[#111111]">
        <button
          onClick={() => setActiveTab('hoy')}
          className={`text-xs font-bold tracking-wider ${activeTab === 'hoy' ? 'underline underline-offset-4' : 'opacity-70'}`}
        >
          HOY
        </button>
        <button
          onClick={() => setActiveTab('crear')}
          className={`text-xs font-bold tracking-wider ${activeTab === 'crear' ? 'underline underline-offset-4' : 'opacity-70'}`}
        >
          CREAR
        </button>
        <button
          onClick={() => setActiveTab('armario')}
          className={`text-xs font-bold tracking-wider ${activeTab === 'armario' ? 'underline underline-offset-4' : 'opacity-70'}`}
        >
          ARMARIO
        </button>
        <button
          onClick={() => {
            resetForm();
            setActiveTab('añadir');
          }}
          className={`text-xs font-bold tracking-wider ${activeTab === 'añadir' ? 'underline underline-offset-4' : 'opacity-70'}`}
        >
          AÑADIR
        </button>
      </nav>
    </div>
  );
}

export default App;
