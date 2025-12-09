'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Play, ChevronLeft, ChevronRight, Check, Video, Calendar, X, Edit } from 'lucide-react';

interface WeeklyComplement {
  id: string;
  week_number: number;
  year: number;
  day_of_week: number;
  title: string;
  description: string | null;
  mux_playback_id: string | null;
  mux_asset_id: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  is_published: boolean;
  created_at: string;
}

const DAYS_OF_WEEK = [
  { id: 1, name: 'Lunes', short: 'Lun' },
  { id: 2, name: 'Martes', short: 'Mar' },
  { id: 3, name: 'Miércoles', short: 'Mié' },
  { id: 4, name: 'Jueves', short: 'Jue' },
  { id: 5, name: 'Viernes', short: 'Vie' },
];

// Función para obtener el número de semana del año
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Función para obtener la fecha de inicio de una semana
function getWeekStartDate(week: number, year: number): Date {
  const jan1 = new Date(year, 0, 1);
  const daysToMonday = (jan1.getDay() + 6) % 7;
  const firstMonday = new Date(year, 0, 1 + (7 - daysToMonday) % 7);
  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
  return weekStart;
}

export default function ComplementManagement() {
  const [complements, setComplements] = useState<WeeklyComplement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estado para la semana seleccionada
  const today = new Date();
  const [selectedWeek, setSelectedWeek] = useState(getWeekNumber(today));
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  
  // Estado para el formulario de edición
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mux_playback_id: '',
  });

  useEffect(() => {
    fetchComplements();
  }, [selectedWeek, selectedYear]);

  const fetchComplements = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/complements?week=${selectedWeek}&year=${selectedYear}`);
      const data = await response.json();
      setComplements(data.complements || []);
    } catch (error) {
      console.error('Error fetching complements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousWeek = () => {
    if (selectedWeek === 1) {
      setSelectedWeek(52);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedWeek(selectedWeek - 1);
    }
  };

  const handleNextWeek = () => {
    if (selectedWeek === 52) {
      setSelectedWeek(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedWeek(selectedWeek + 1);
    }
  };

  const getComplementForDay = (dayOfWeek: number): WeeklyComplement | undefined => {
    return complements.find(c => c.day_of_week === dayOfWeek);
  };

  const handleEditDay = (dayOfWeek: number) => {
    const existing = getComplementForDay(dayOfWeek);
    setEditingDay(dayOfWeek);
    setFormData({
      title: existing?.title || `Complemento ${DAYS_OF_WEEK.find(d => d.id === dayOfWeek)?.name}`,
      description: existing?.description || '',
      mux_playback_id: existing?.mux_playback_id || '',
    });
  };

  const handleSave = async () => {
    if (!editingDay) return;
    if (!formData.mux_playback_id.trim()) {
      alert('Por favor ingresa el Playback ID de Mux');
      return;
    }

    setSaving(true);
    try {
      const existing = getComplementForDay(editingDay);
      const method = existing ? 'PUT' : 'POST';
      const url = existing ? `/api/admin/complements/${existing.id}` : '/api/admin/complements';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_number: selectedWeek,
          year: selectedYear,
          day_of_week: editingDay,
          title: formData.title,
          description: formData.description || null,
          mux_playback_id: formData.mux_playback_id,
        }),
      });

      if (response.ok) {
        await fetchComplements();
        setEditingDay(null);
        setFormData({ title: '', description: '', mux_playback_id: '' });
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving complement:', error);
      alert('Error al guardar el complemento');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este complemento?')) return;

    try {
      const response = await fetch(`/api/admin/complements/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchComplements();
      }
    } catch (error) {
      console.error('Error deleting complement:', error);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/complements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !currentStatus }),
      });

      if (response.ok) {
        setComplements(prev =>
          prev.map(c => (c.id === id ? { ...c, is_published: !currentStatus } : c))
        );
      }
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  const weekStartDate = getWeekStartDate(selectedWeek, selectedYear);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
            Complementos Semanales
          </h2>
          <p className="text-xs text-gray-600 dark:text-white/60 mt-1">
            Videos cortos (reels) para cada día de la semana
          </p>
        </div>
      </div>

      {/* Selector de semana */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePreviousWeek}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-[#85ea10]/20 text-gray-600 dark:text-white hover:text-[#85ea10] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="flex items-center gap-2 justify-center">
              <Calendar className="w-5 h-5 text-[#85ea10]" />
              <span className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                Semana {selectedWeek}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-white/60 mt-1">
              {weekStartDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          <button
            onClick={handleNextWeek}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-[#85ea10]/20 text-gray-600 dark:text-white hover:text-[#85ea10] transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid de días */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-12 h-12 border-4 border-[#85ea10]/30 border-t-[#85ea10] rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {DAYS_OF_WEEK.map((day) => {
            const complement = getComplementForDay(day.id);
            const isEditing = editingDay === day.id;

            return (
              <div
                key={day.id}
                className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border transition-all shadow-lg overflow-hidden ${
                  complement
                    ? 'border-[#85ea10]/50'
                    : 'border-gray-200 dark:border-white/20'
                }`}
              >
                {/* Header del día */}
                <div className={`p-4 ${complement ? 'bg-[#85ea10]/10' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                      {day.name}
                    </span>
                    {complement && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          complement.is_published
                            ? 'bg-[#85ea10] text-black'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {complement.is_published ? 'Publicado' : 'Borrador'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-4">
                  {isEditing ? (
                    // Formulario de edición
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 dark:text-white/60 uppercase mb-1">
                          Título *
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10]"
                          placeholder="Título del video"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 dark:text-white/60 uppercase mb-1">
                          Descripción
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10]"
                          placeholder="Descripción opcional..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 dark:text-white/60 uppercase mb-1">
                          Mux Playback ID *
                        </label>
                        <input
                          type="text"
                          value={formData.mux_playback_id}
                          onChange={(e) => setFormData({ ...formData, mux_playback_id: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10]"
                          placeholder="abc123..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex-1 bg-[#85ea10] hover:bg-[#7dd30f] disabled:bg-gray-400 text-black font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1"
                        >
                          {saving ? (
                            <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingDay(null)}
                          className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-bold rounded-lg text-xs transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : complement ? (
                    // Vista de complemento existente
                    <div className="space-y-3">
                      <div className="relative aspect-[9/16] bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
                        {complement.mux_playback_id && (
                          <img
                            src={`https://image.mux.com/${complement.mux_playback_id}/thumbnail.jpg?time=1`}
                            alt={complement.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                            <Play className="w-5 h-5 text-black ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {complement.title}
                        </h4>
                        {complement.description && (
                          <p className="text-[10px] text-gray-600 dark:text-white/60 line-clamp-2 mt-1">
                            {complement.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditDay(day.id)}
                          className="flex-1 bg-[#85ea10]/10 hover:bg-[#85ea10]/20 border border-[#85ea10]/30 text-[#85ea10] py-2 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleTogglePublish(complement.id, complement.is_published)}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1 ${
                            complement.is_published
                              ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                              : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                          }`}
                        >
                          {complement.is_published ? 'Ocultar' : 'Publicar'}
                        </button>
                        <button
                          onClick={() => handleDelete(complement.id)}
                          className="w-8 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 py-2 rounded-lg transition-colors flex items-center justify-center"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Estado vacío - sin complemento
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Video className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-3">
                        Sin video
                      </p>
                      <button
                        onClick={() => handleEditDay(day.id)}
                        className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Agregar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}



