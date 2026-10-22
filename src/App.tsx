import React, { useState, useEffect } from 'react';
import { db, Garment, DEFAULT_TYPES, DEFAULT_OCCASIONS } from './db';
import { Sun, Sparkles, Shirt, PlusCircle, Trash2, Edit } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'hoy' | 'crear' | 'armario' | 'añadir'>('hoy');
  const [garments, setGarments] = useState<Garment[]>([]);
  const [types, setTypes] = useState<string[]>(DEFAULT_TYPES);
  const [occasions, setOccasions] = useState<string[]>(DEFAULT_OCCASIONS);

  // Filtros para la pestaña ARMARIO
  const [filterType, setFilterType] = useState<string>('TODOS');
  const [filterOccasion, setFilterOccasion] = useState<string>('TODAS');

  // Formulario Añadir / Editar
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formType, setFormType] = useState<string>(DEFAULT_TYPES[0]);
  const [formOccasions, setFormOccasions] = useState<string[]>([]);
  const [formClimates, setFormClimates] = useState<string[]>(['TEMPLADO']);
  const [formImage, setFormImage] = useState<string>('');

  // Selección de Look en CREAR
  const [selectedOutfit, setSelectedOutfit] = useState<Record<string, Garment>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allGarments = await db.garments.toArray();
    setGarments(allGarments);

    const savedTypes = await db.configs.get({ key: 'types' });
    if (savedTypes && savedTypes.values.length > 0) setTypes(savedTypes.values);

    const savedOccasions = await db.configs.get({ key: 'occasions' });
    if (savedOccasions && savedOccasions.values.length > 0) setOccasions(savedOccasions.values);
  };

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

  const handleSaveGarment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formImage) {
      alert('Por favor selecciona o toma una foto de la prenda.');
      return;
    }

    if (formOccasions.length === 0) {
      alert('Por favor selecciona al menos una ocasión.');
      return;
    }

    const occasionString = formOccasions.join(', ');
    const minTemp = formClimates.includes('FRÍO') ? 0 : formClimates.includes('TEMPLADO') ? 10 : 20;
    const maxTemp = formClimates.includes('CALOR') ? 35 : formClimates.includes('TEMPLADO') ? 25 : 15;

    if (editingId) {
      await db.garments.update(editingId, {
        type: formType,
        occasion: occasionString,
        minTemp,
        maxTemp,
        imageUrl: formImage,
      });
      alert('Prenda actualizada correctamente');
    } else {
      await db.garments.add({
        type: formType,
        occasion: occasionString,
        minTemp,
        maxTemp,
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
    setFormOccasions(garment.occasion ? garment.occasion.split(', ').map(o => o.trim()) : []);
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
    setFormOccasions([DEFAULT_OCCASIONS[0]]);
    setFormClimates(['TEMPLADO']);
    setFormImage('');
  };

  const desiredOrder = ['Arriba exterior', 'Arriba interior', 'Abajo', 'Zapatos', 'Abrigo', 'Accesorios', 'Entero'];
  const orderedTypes = Array.from(new Set([...desiredOrder, ...types]));

  const handleSelectGarment = (typeCategory: string, garment: Garment) => {
    if (typeCategory === 'Entero') {
      setSelectedOutfit((prev) => ({
        ...prev,
        'Entero': garment,
        'Arriba interior': garment,
        'Abajo': garment,
      }));
    } else if (typeCategory === 'Arriba interior' || typeCategory === 'Abajo') {
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

  const filteredGarments = garments.filter((item) => {
    const matchesType = filterType === 'TODOS' || item.type === filterType;
    const matchesOccasion = filterOccasion === 'TODAS' || item.occasion.includes(filterOccasion);
    return matchesType && matchesOccasion;
  });

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#111111] font-mono max-w-md mx-auto border-x border-[#111111]">
      {/* Header */}
      <header className="p-4 border-b border-[#111111] bg-[#FAF8F5] flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tighter">ARMARIO</h1>
          <p className="text-xs tracking-widest text-neutral-500">TECHNICAL DRESSING SYSTEM</p>
        </div>
      </header>

      {/* Main Content */}
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

        {/* TAB: CREAR */}
        {activeTab === 'crear' && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold tracking-wider uppercase border-b border-[#111111] pb-1">
              CREAR LOOK INTERACTIVO
            </h2>

            {orderedTypes.map((typeCategory) => {
              const items = garments.filter((g) => g.type === typeCategory);
              if (items.length === 0) return null;

              return (
                <div key={typeCategory} className="border border-[#111111] p-3 bg-white">
                  <span className="text-xs font-black uppercase tracking-widest block mb-2">
                    {typeCategory} ({items.length})
                  </span>

                  <div className="flex gap-3 overflow-x-auto pb-2">
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
                </div>
              );
            })}
          </div>
        )}

        {/* TAB: ARMARIO CON FILTROS */}
        {activeTab === 'armario' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#111111] pb-1">
              <h2 className="text-sm font-bold uppercase tracking-wider">MI ARMARIO ({filteredGarments.length})</h2>
            </div>

            {/* Filtros de prendas */}
            <div className="grid grid-cols-2 gap-2 bg-white p-2 border border-[#111111]">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1">Filtrar por Tipo</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full border border-[#111111] p-1 text-[11px] font-mono bg-[#FAF8F5]"
                >
                  <option value="TODOS">TODOS LOS TIPOS</option>
                  {orderedTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase mb-1">Filtrar por Ocasión</label>
                <select
                  value={filterOccasion}
                  onChange={(e) => setFilterOccasion(e.target.value)}
                  className="w-full border border-[#111111] p-1 text-[11px] font-mono bg-[#FAF8F5]"
                >
                  <option value="TODAS">TODAS LAS OCASIONES</option>
                  {occasions.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Listado de prendas filtradas */}
            <div className="grid grid-cols-2 gap-3">
              {filteredGarments.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-xs text-neutral-500 italic">
                  No hay prendas que coincidan con los filtros.
                </div>
              ) : (
                filteredGarments.map((item) => (
                  <div key={item.id} className="border border-[#111111] bg-white p-2 flex flex-col justify-between">
                    <img src={item.imageUrl} alt={item.type} className="w-full h-32 object-cover border mb-2" />
                    <div className="text-xs space-y-1">
                      <p className="font-bold uppercase">{item.type}</p>
                      <p className="text-[10px] text-neutral-600">{item.occasion}</p>
                    </div>
                    <div className="flex gap-2 mt-3 pt-2 border-t border-neutral-200">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="flex-1 bg-neutral-900 text-white text-[10px] py-1 font-bold hover:bg-black flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3 h-3" /> EDITAR
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item.id)}
                        className="px-2 border border-[#111111] text-[10px] font-bold hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB: AÑADIR */}
        {activeTab === 'añadir' && (
          <form onSubmit={handleSaveGarment} className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider border-b border-[#111111] pb-1">
              {editingId ? 'EDITAR PRENDA' : 'AÑADIR NUEVA PRENDA'}
            </h2>

            {/* Selector de Imagen: Cámara o Galería */}
            <div className="border border-dashed border-[#111111] p-
