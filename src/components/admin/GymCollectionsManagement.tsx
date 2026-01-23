'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Phone, Search, Filter, MessageSquare } from 'lucide-react';
import { CollectionItem } from '@/types/gym';

export default function GymCollectionsManagement() {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDays, setFilterDays] = useState<string>('all');

  useEffect(() => {
    loadCollections();
  }, [filterDays]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/admin/gym/collections', window.location.origin);
      if (filterDays !== 'all') {
        url.searchParams.set('days_overdue', filterDays);
      }
      url.searchParams.set('status', 'expired');

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Error al cargar cobranza');
      const data = await response.json();
      setCollections(data);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppReminder = (item: CollectionItem) => {
    const message = encodeURIComponent(
      `Hola ${item.client_name}, te recordamos que tu plan "${item.plan_name}" vence el ${new Date(item.membership_end_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}. Por favor realiza el pago para continuar disfrutando de nuestros servicios.`
    );
    const whatsappUrl = `https://wa.me/${item.whatsapp.replace(/\D/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const filteredCollections = collections.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.client_name.toLowerCase().includes(searchLower) ||
      item.document_id.toLowerCase().includes(searchLower) ||
      item.plan_name.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[#85ea10] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#164151] dark:text-white">Gestión de Planes - Cobranza</h2>
        <p className="text-sm text-[#164151]/80 dark:text-white/60 mt-1">
          Clientes con pagos pendientes o vencidos
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-4 shadow-sm dark:shadow-none">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula o plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
            />
          </div>

          {/* Days Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40" />
            <select
              value={filterDays}
              onChange={(e) => setFilterDays(e.target.value)}
              className="pl-12 pr-10 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 appearance-none cursor-pointer"
            >
              <option value="all">Todos los vencidos</option>
              <option value="7">Últimos 7 días</option>
              <option value="15">Últimos 15 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="60">Últimos 60 días</option>
            </select>
          </div>
        </div>
      </div>

      {/* Collections List */}
      {filteredCollections.length === 0 ? (
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-4" />
          <p className="text-[#164151] dark:text-white font-medium mb-2">
            {searchTerm ? 'No se encontraron resultados' : 'No hay deudores'}
          </p>
          <p className="text-sm text-[#164151]/60 dark:text-white/60">
            {searchTerm
              ? 'Intenta con otros términos de búsqueda'
              : 'Todos los clientes están al día con sus pagos'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-transparent">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                    Días Vencidos
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredCollections.map((item) => (
                  <tr key={item.membership_id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-[#164151] dark:text-white">{item.client_name}</p>
                        <p className="text-xs text-[#164151]/60 dark:text-white/60">CC: {item.document_id}</p>
                        {item.email && (
                          <p className="text-xs text-[#164151]/60 dark:text-white/60">{item.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-[#164151] dark:text-white">{item.plan_name}</p>
                        <p className="text-xs text-[#164151]/60 dark:text-white/60">
                          ${item.plan_price.toLocaleString('es-CO')}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#164151] dark:text-white">
                        {new Date(item.membership_end_date).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          item.days_overdue > 30
                            ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                            : item.days_overdue > 15
                            ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400'
                            : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                        }`}
                      >
                        {item.days_overdue} días
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-[#164151] dark:text-white">
                        ${item.plan_price.toLocaleString('es-CO')}
                      </p>
                      {item.last_payment_date && (
                        <p className="text-xs text-[#164151]/60 dark:text-white/60">
                          Último pago: {new Date(item.last_payment_date).toLocaleDateString('es-CO')}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleWhatsAppReminder(item)}
                          className="px-3 py-2 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors flex items-center gap-2 text-sm"
                          title="Enviar recordatorio por WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span className="hidden sm:inline">Recordatorio</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
