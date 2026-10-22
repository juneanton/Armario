import React, { useState, useEffect } from 'react';
import { db, Garment, DEFAULT_TYPES, DEFAULT_OCCASIONS } from './db';
import { Sun, Sparkles, Shirt, PlusCircle, Trash2, Edit, Settings, X, Plus, Download, Upload, RefreshCw } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'hoy' | 'crear' | 'armario' | 'añadir'>('hoy');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const [garments, setGarments] = useState<Garment[]>([]);
  const [types, setTypes] = useState<string[]>(DEFAULT_TYPES);
  const [occasions, setOccasions] = useState<string[]>(DEFAULT_OCCASIONS);

  // Estados para añadir nuevos Tipos/Ocasiones en Ajustes
  const [newTypeInput, setNewTypeInput] = useState<string>('');
  const [newOccasionInput, setNewOccasionInput] = useState<string>('');

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
    if (savedTypes && savedTypes.values.length > 0) {
      setTypes(savedTypes.values);
    } else {
      setTypes(DEFAULT_TYPES);
    }

    const savedOccasions = await db.configs.get({ key: 'occasions' });
    if (savedOccasions && savedOccasions.values.length > 0) {
      setOccasions(savedOccasions.values);
    } else {
      setOccasions(DEFAULT_OCCASIONS);
    }
  };

  // Exportar datos a un archivo JSON
  const handleExportData = async () => {
    const allGarments = await db.garments.toArray();
    const allConfigs = await db.configs.toArray();

    const dataToExport = {
      garments: allGarments,
      configs: allConfigs,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `armario-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Importar datos desde un archivo JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsedData = JSON.parse(content);

        if (parsedData.garments && Array.isArray(parsedData.garments)) {
          await db.garments.clear();
          await db.garments.bulkAdd(parsedData.garments);
        }

        if (parsedData.configs && Array.isArray(parsedData.configs)) {
          await db.configs.clear();
          await db.configs.bulkAdd(parsedData.configs);
        }

        alert('¡Datos importados con éxito!');
        loadData();
        setShowSettings(false);
      } catch (err) {
        alert('Error al leer el archivo JSON. Verifica que sea un respaldo válido.');
      }
    };
    reader.readAsText(file);
  };

  // Restablecer/Limpiar la base de datos
  const handleResetData = async () => {
    if (confirm('¿Estás seguro de que deseas borrar TODAS las prendas y datos del armario? Esta acción no se puede deshacer.')) {
      await db.garments.clear();
      await db.configs.clear();
      alert('Se han borrado todos los datos.');
      loadData();
      setShowSettings(false);
    }
  };

  // Funciones de Ajustes (Añadir / Eliminar Tipos u Ocasiones)
  const handleAddType = async () => {
    if (!newTypeInput.trim()) return;
    const updatedTypes = [...types, newTypeInput.trim()];
    setTypes(updatedTypes);

    const existing = await db.configs.get({ key: 'types' });
    if (existing && existing.id) {
      await db.configs.update(existing.id, { values: updatedTypes });
    } else {
      await db.configs.add({ key: 'types', values: updatedTypes });
    }
    setNewTypeInput('');
  };

  const handleDeleteType = async (typeToDelete: string) => {
    const updatedTypes = types.filter(t => t !== typeToDelete);
    setTypes(updatedTypes);
    const existing = await db.configs.get({ key: 'types' });
    if (existing && existing.id) {
      await db.configs.update(existing.id, { values: updatedTypes });
    }
  };

  const handleAddOccasion = async () => {
    if (!newOccasionInput.trim()) return;
    const updatedOccasions = [...occasions, newOccasionInput.trim().toUpperCase()];
    setOccasions(updatedOccasions);

    const existing = await db.configs.get({ key: 'occasions' });
    if (existing && existing.id) {
      await db.configs.update(existing.id, { values: updatedOccasions });
    } else {
      await db.configs.add({ key: 'occasions', values: updatedOccasions });
    }
    setNewOccasionInput('');
  };

  const handleDeleteOccasion = async (occToDelete: string) => {
    const updatedOccasions = occasions.filter(o => o !== occToDelete);
    setOccasions(updatedOccasions);
    const existing = await db.configs.get({ key: 'occasions' });
    if (existing && existing.id) {
      await db.configs.update(existing.id, { values: updatedOccasions });
    }
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
      {/* Header con Botón de Ajustes */}
      <header className="p-4 border-b border-[#111111] bg-[#FAF8F5] flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tighter">ARMARIO</h1>
          <p className="text-xs tracking-widest text-neutral-500">TECHNICAL DRESSING SYSTEM</p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 border border-[#111111] bg-white hover:bg-neutral-100 transition-colors"
          title="Ajustes"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* MODAL DE AJUSTES */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] border-2 border-[#111111] p-4 w-full max-w-md max-h-[85vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b border-[#111111] pb-2">
              <h2 className="text-sm font-black uppercase tracking-wider">CONFIGURACIÓN DEL SISTEMA</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 border border-[#111111] hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Gestión de Tipos */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase">Categorías / Tipos de Prenda</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nuevo tipo..."
                  value={newTypeInput}
                  onChange={(e) => setNewTypeInput(e.target.value)}
                  className="flex-1 border border-[#111111] p-1 text-xs font-mono bg-white"
                />
                <button
                  onClick={handleAddType}
                  className="bg-[#111111] text-white px-3 py-1 text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> AÑADIR
                </button>
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {types.map((t) => (
                  <span
                    key={t}
                    className="border border-[#111111] bg-white text-[10px] font-bold px-2 py-1 flex items-center gap-1"
                  >
                    {t}
                    {!DEFAULT_TYPES.includes(t) && (
                      <button onClick={() => handleDeleteType(t)} className="text-red-600 font-black ml-1">×</button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Gestión de Ocasiones */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase">Ocasiones</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nueva ocasión..."
                  value={newOccasionInput}
                  onChange={(e) => setNewOccasionInput(e.target.value)}
                  className="flex-1 border border-[#111111] p-1 text-xs font-mono bg-white uppercase"
                />
                <button
                  onClick={handleAddOccasion}
                  className="bg-[#111111] text-white px-3 py-1 text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> AÑADIR
                </button>
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {occasions.map((o) => (
                  <span
                    key={o}
                    className="border border-[#111111] bg-white text-[10px] font-bold px-2 py-1 flex items-center gap-1"
                  >
                    {o}
                    {!DEFAULT_OCCASIONS.includes(o) && (
                      <button onClick={() => handleDeleteOccasion(o)} className="text-red-600 font-black ml-1">×</button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Copia de Seguridad e Importación/Exportación JSON */}
            <div className="border-t border-[#111111] pt-4 space-y-3">
              <h3 className="text-xs font-bold uppercase">Copia de Seguridad (JSON)</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleExportData}
                  className="border border-[#111111] bg-white text-xs font-bold p-2 flex items-center justify-center gap-1 hover:bg-neutral-100"
                >
                  <Download className="w-3 h-3" /> EXPORTAR JSON
                </button>
                <label className="border border-[#111111] bg-white text-xs font-bold p-2 flex items-center justify-center gap-1 cursor-pointer hover:bg-neutral-100">
                  <Upload className="w-3 h-3" /> IMPORTAR JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Reset / Limpieza de datos */}
            <div className="border-t border-[#111111] pt-4">
              <button
                onClick={handleResetData}
                className="w-full border border-red-600 text-red-600 bg-red-50 p-2 text-xs font-bold uppercase flex items-center justify-center gap-1 hover:bg-red-100"
              >
                <RefreshCw className="w-3 h-3" /> RESTABLECER TODO
              </button>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full bg-[#111111] text-white py-2 text-xs font-bold uppercase tracking-widest mt-4"
            >
              CERRAR Y GUARDAR
            </button>
          </div>
        </div>
      )}

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

            <div>
              <label className="block text-xs font-bold uppercase mb-1">Tipo de Prenda</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full border border-[#111111] p-2 bg-white text-xs font-mono"
              >
                {orderedTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Ocasiones (Selección múltiple) */}
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Ocasiones (Selección múltiple)</label>
              <div className="grid grid-cols-2 gap-2 border border-[#111111] p-2 bg-white">
                {occasions.map((occ) => {
                  const isChecked = formOccasions.includes(occ);
                  return (
                    <label key={occ} className="flex items-center space-x-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormOccasions([...formOccasions, occ]);
                          } else {
                            setFormOccasions(formOccasions.filter(o => o !== occ));
                          }
                        }}
                        className="accent-black"
                      />
                      <span className="uppercase font-bold">{occ}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Clima / Tiempo (Selección múltiple) */}
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Clima (Selección múltiple)</label>
              <div className="grid grid-cols-3 gap-2 border border-[#111111] p-2 bg-white">
                {['FRÍO', 'TEMPLADO', 'CALOR'].map((clim) => {
                  const isChecked = formClimates.includes(clim);
                  return (
                    <label key={clim} className="flex items-center space-x-1 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormClimates([...formClimates, clim]);
                          } else {
                            setFormClimates(formClimates.filter(c => c !== clim));
                          }
                        }}
                        className="accent-black"
                      />
                      <span className="uppercase font-bold text-[10px]">{clim}</span>
                    </label>
                  );
                })}
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

      {/* Navigation Bar con Iconos y Nombres */}
      <nav className="fixed bottom-0 max-w-md w-full bg-[#111111] text-white flex justify-around py-2 border-t border-[#111111]">
        <button
          onClick={() => setActiveTab('hoy')}
          className={`flex flex-col items-center text-[10px] font-bold tracking-wider ${activeTab === 'hoy' ? 'opacity-100 underline underline-offset-4' : 'opacity-60'}`}
        >
          <Sun className="w-5 h-5 mb-1" />
          HOY
        </button>
        <button
          onClick={() => setActiveTab('crear')}
          className={`flex flex-col items-center text-[10px] font-bold tracking-wider ${activeTab === 'crear' ? 'opacity-100 underline underline-offset-4' : 'opacity-60'}`}
        >
          <Sparkles className="w-5 h-5 mb-1" />
          CREAR
        </button>
        <button
          onClick={() => setActiveTab('armario')}
          className={`flex flex-col items-center text-[10px] font-bold tracking-wider ${activeTab === 'armario' ? 'opacity-100 underline underline-offset-4' : 'opacity-60'}`}
        >
          <Shirt className="w-5 h-5 mb-1" />
          ARMARIO
        </button>
        <button
          onClick={() => {
            resetForm();
            setActiveTab('añadir');
          }}
          className={`flex flex-col items-center text-[10px] font-bold tracking-wider ${activeTab === 'añadir' ? 'opacity-100 underline underline-offset-4' : 'opacity-60'}`}
        >
          <PlusCircle className="w-5 h-5 mb-1" />
          AÑADIR
        </button>
      </nav>
    </div>
  );
}

export default App;
