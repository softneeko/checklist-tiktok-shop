/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Briefcase,
  TrendingUp,
  Package,
  Award,
  Circle,
  HelpCircle,
  Clock,
  PlusCircle,
  ChevronRight,
  AlertCircle,
  Info
} from 'lucide-react';
import { DayProduction, DayId, ProductItem } from './types';

// Default initial state
const DEFAULT_DAYS: DayProduction[] = [
  { id: 'segunda', name: 'Segunda-feira', worked: true, products: [] },
  { id: 'terca', name: 'Terça-feira', worked: true, products: [] },
  { id: 'quarta', name: 'Quarta-feira', worked: true, products: [] },
  { id: 'quinta', name: 'Quinta-feira', worked: true, products: [] },
  { id: 'sexta', name: 'Sexta-feira', worked: true, products: [] },
  { id: 'sabado', name: 'Sábado', worked: false, products: [] },
  { id: 'domingo', name: 'Domingo', worked: false, products: [] },
];

const LOCAL_STORAGE_KEY = 'checklist_producao_v1';

export default function App() {
  // State for weekly production data
  const [productionData, setProductionData] = useState<DayProduction[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading saved production data, resetting to default', e);
      }
    }
    return DEFAULT_DAYS;
  });

  // Active day selection
  const [selectedDayId, setSelectedDayId] = useState<DayId>('segunda');

  // Input form states
  const [newProductName, setNewProductName] = useState('');
  const [newProductQty, setNewProductQty] = useState('1');
  const [formError, setFormError] = useState('');

  // Confirmation state for resetting
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Copy click feedback
  const [copied, setCopied] = useState(false);

  // Auto-save changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(productionData));
  }, [productionData]);

  // Find the selected day object
  const selectedDay = useMemo(() => {
    return productionData.find((d) => d.id === selectedDayId) || productionData[0];
  }, [productionData, selectedDayId]);

  // Extract frequently used products across all days for easy tap-to-add UX
  const frequentProducts = useMemo(() => {
    const namesMap: Record<string, number> = {};
    productionData.forEach((day) => {
      day.products.forEach((prod) => {
        const cleaned = prod.name.trim();
        if (cleaned) {
          // Normalize to capitalized to look cleaner
          const formatted = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
          namesMap[formatted] = (namesMap[formatted] || 0) + 1;
        }
      });
    });

    const entries = Object.entries(namesMap);
    if (entries.length === 0) {
      // Default recommended video styles for TikTok Shop creators
      return [
        'Vídeo de Unboxing',
        'Review de Produto',
        'UGC de Moda / Beleza',
        'Vídeo de Demonstração',
        'Trends do TikTok',
        'Vídeo Narrado (Voiceover)',
        'Anúncio de Promoção'
      ];
    }

    // Sort by frequency of entry
    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7) // limit to top 7 frequent recommendations
      .map(([name]) => name);
  }, [productionData]);

  // Calculation of Stats
  const totalWorkedDays = useMemo(() => {
    return productionData.filter((d) => d.worked).length;
  }, [productionData]);

  const statsByProduct = useMemo(() => {
    const totals: Record<string, number> = {};
    productionData.forEach((day) => {
      // Only count items in days that are marked as worked
      if (day.worked) {
        day.products.forEach((prod) => {
          const capitalizedName = prod.name.trim().charAt(0).toUpperCase() + prod.name.trim().slice(1).toLowerCase();
          totals[capitalizedName] = (totals[capitalizedName] || 0) + Number(prod.quantity);
        });
      }
    });

    return Object.entries(totals)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [productionData]);

  const totalQuantityOfAllProducts = useMemo(() => {
    return statsByProduct.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [statsByProduct]);

  // Daily outputs for benchmarking
  const dailyProductionTotals = useMemo(() => {
    return productionData.map((day) => {
      const sum = day.worked
        ? day.products.reduce((acc, p) => acc + Number(p.quantity), 0)
        : 0;
      return {
        id: day.id,
        name: day.name,
        worked: day.worked,
        total: sum,
      };
    });
  }, [productionData]);

  const maxDailyTotal = useMemo(() => {
    const totals = dailyProductionTotals.map((d) => d.total);
    return Math.max(...totals, 1); // fallback to 1 to avoid division by zero
  }, [dailyProductionTotals]);

  const mostProductiveDay = useMemo(() => {
    if (totalQuantityOfAllProducts === 0) return null;
    const sorted = [...dailyProductionTotals].sort((a, b) => b.total - a.total);
    return sorted[0].total > 0 ? sorted[0] : null;
  }, [dailyProductionTotals, totalQuantityOfAllProducts]);

  // Handlers
  const handleToggleWorked = (dayId: DayId) => {
    setProductionData((prev) =>
      prev.map((day) => {
        if (day.id === dayId) {
          const newWorked = !day.worked;
          return {
            ...day,
            worked: newWorked,
            // optional: keep products or clear them when unworking. User might want to keep history, so let's preserve them.
          };
        }
        return day;
      })
    );
  };

  const handleAddProduct = (e?: FormEvent) => {
    if (e) e.preventDefault();
    setFormError('');

    const trimmedName = newProductName.trim();
    if (!trimmedName) {
      setFormError('Por favor, informe o nome do produto.');
      return;
    }

    const qty = Number(newProductQty);
    if (isNaN(qty) || qty <= 0) {
      setFormError('A quantia deve ser um número maior que zero.');
      return;
    }

    // Format item nicely with Capitalized Letter
    const formattedName = trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1);

    setProductionData((prev) =>
      prev.map((day) => {
        if (day.id === selectedDayId) {
          // If product name already exists, update quantity, otherwise add a new item
          const existingItemIndex = day.products.findIndex(
            (p) => p.name.toLowerCase() === formattedName.toLowerCase()
          );

          let updatedProducts = [...day.products];

          if (existingItemIndex > -1) {
            const existingItem = updatedProducts[existingItemIndex];
            updatedProducts[existingItemIndex] = {
              ...existingItem,
              quantity: existingItem.quantity + qty,
            };
          } else {
            updatedProducts.push({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
              name: formattedName,
              quantity: qty,
            });
          }

          return {
            ...day,
            // If the user adds a product, they probably worked that day. Let's auto-check it as worked!
            worked: true,
            products: updatedProducts,
          };
        }
        return day;
      })
    );

    // Reset inputs
    setNewProductName('');
    setNewProductQty('1');
    setFormError('');
  };

  const handleUpdateProductQuantity = (dayId: DayId, productId: string, change: number) => {
    setProductionData((prev) =>
      prev.map((day) => {
        if (day.id === dayId) {
          const updatedProducts = day.products
            .map((prod) => {
              if (prod.id === productId) {
                const newQty = prod.quantity + change;
                return { ...prod, quantity: Math.max(1, newQty) };
              }
              return prod;
            })
            // Remove item if user decreases to 0 or manual check (in this design, we stop at 1, but they can delete)
          return {
            ...day,
            products: updatedProducts,
          };
        }
        return day;
      })
    );
  };

  const handleManualQuantityChange = (dayId: DayId, productId: string, valueStr: string) => {
    const val = Number(valueStr);
    if (isNaN(val) || val < 1) return; // ignore invalid changes

    setProductionData((prev) =>
      prev.map((day) => {
        if (day.id === dayId) {
          return {
            ...day,
            products: day.products.map((p) =>
              p.id === productId ? { ...p, quantity: Math.floor(val) } : p
            ),
          };
        }
        return day;
      })
    );
  };

  const handleDeleteProduct = (dayId: DayId, productId: string) => {
    setProductionData((prev) =>
      prev.map((day) => {
        if (day.id === dayId) {
          return {
            ...day,
            products: day.products.filter((p) => p.id !== productId),
          };
        }
        return day;
      })
    );
  };

  const handleResetWeek = () => {
    setProductionData(
      DEFAULT_DAYS.map((day) => ({
        ...day,
        worked: day.id !== 'sabado' && day.id !== 'domingo', // reset default weekday values
        products: [],
      }))
    );
    setSelectedDayId('segunda');
    setShowResetConfirm(false);
  };

  // Generate beautiful text report
  const handleCopyReport = () => {
    let reportText = `🎬 *RELATÓRIO DE VÍDEOS - TIKTOK SHOP*\n`;
    reportText += `------------------------------------\n`;
    reportText += `Dias de gravação ativos: ${totalWorkedDays} de 7\n\n`;

    productionData.forEach((day) => {
      const dayStatus = day.worked ? '✅ Trabalhado/Gravado' : '❌ Não gravado';
      reportText += `*${day.name}* (${dayStatus})\n`;

      if (day.worked) {
        if (day.products.length === 0) {
          reportText += `  • Nenhum vídeo registrado\n`;
        } else {
          day.products.forEach((p) => {
            reportText += `  • ${p.name}: ${p.quantity} vídeo(s)\n`;
          });
        }
      }
      reportText += `\n`;
    });

    reportText += `------------------------------------\n`;
    reportText += `*DESEMPENHO TOTAL DE VÍDEOS:*\n`;
    if (statsByProduct.length === 0) {
      reportText += `Nenhum vídeo produzido nesta semana.\n`;
    } else {
      statsByProduct.forEach((item) => {
        reportText += `• ${item.name}: ${item.quantity} vídeo(s)\n`;
      });
      reportText += `\n*TOTAL ACUMULADO DE VÍDEOS:* ${totalQuantityOfAllProducts} vídeos criados\n`;
    }

    if (mostProductiveDay) {
      reportText += `🏆 *Dia mais produtivo:* ${mostProductiveDay.name} (${mostProductiveDay.total} vídeos)\n`;
    }

    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-rose-50/20 py-8 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <header id="app-header" className="mb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-rose-100 pb-6">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <Package className="w-6 h-6 text-pink-600" />
              <span className="text-xs font-semibold tracking-wider text-pink-600 uppercase font-display">
                Criador TikTok Shop
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display sm:text-4xl">
              Checklist de Vídeos
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Gerencie seus dias de gravação e registre a quantidade de vídeos produzidos para a TikTok Shop de segunda a domingo.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              id="btn-copy-report"
              onClick={handleCopyReport}
              className="inline-flex items-center gap-2 bg-pink-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-pink-700 active:bg-pink-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Resumo</span>
                </>
              )}
            </button>

            <button
              id="btn-reset-week"
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-2 border border-rose-200 bg-white text-slate-600 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-rose-50 active:bg-rose-100 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2"
              title="Reiniciar todos os dados da semana"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Limpar Semana</span>
            </button>
          </div>
        </header>

        {/* Confirmation Modal Overlay for Resetting */}
        <AnimatePresence>
          {showResetConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-rose-100"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-50 rounded-xl text-red-600">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-display">Limpar todos os dados?</h3>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                      Esta ação irá apagar definitivamente todos os registros de produção e dias trabalhados desta semana. Tem certeza de que deseja continuar?
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleResetWeek}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
                  >
                    Sim, Limpar Tudo
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Info Banner if no items produced yet */}
        {totalQuantityOfAllProducts === 0 && (
          <div className="mb-6 bg-pink-50/60 border border-pink-100 rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-pink-600 shrink-0 mt-0.5" />
            <div className="text-sm text-slate-600">
              <span className="font-semibold text-pink-900">Como funciona:</span> Marque os dias que você gravou vídeos no painel de dias da semana, selecione o dia correspondente para cadastrar os tipos de vídeos produzidos e a quantidade de cada um, e acompanhe o resumo semanal de rendimento automático no final da página!
            </div>
          </div>
        )}

        {/* Main Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          {/* LEFT PANEL: Days of the week (4 cols) */}
          <section id="panel-days" className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-lg font-bold text-slate-950 font-display flex items-center gap-2">
                <Calendar className="w-5 h-5 text-pink-600" />
                <span>Dias de Gravação</span>
              </h2>
              <span className="text-xs bg-pink-100 text-pink-700 font-medium px-2.5 py-1 rounded-full">
                {totalWorkedDays} de 7 ativos
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {productionData.map((day) => {
                const totalItems = day.products.reduce((acc, p) => acc + Number(p.quantity), 0);
                const uniqueItems = day.products.length;
                const isSelected = day.id === selectedDayId;

                return (
                  <div
                    key={day.id}
                    id={`day-card-${day.id}`}
                    onClick={() => setSelectedDayId(day.id)}
                    className={`group cursor-pointer relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? 'border-pink-500 bg-pink-50/40 shadow-sm ring-1 ring-pink-500'
                        : 'border-pink-100 bg-white hover:border-pink-200 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Interactive Custom Checkbox (Checklist style) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // prevent resetting selected day
                          handleToggleWorked(day.id);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-pink-700 hover:bg-pink-50 transition-colors focus:outline-none"
                        title={day.worked ? 'Marcar como dia sem gravação' : 'Marcar como dia de gravação'}
                      >
                        {day.worked ? (
                          <CheckCircle2 className="w-6 h-6 text-pink-600 fill-pink-50" />
                        ) : (
                          <Circle className="w-6 h-6 text-pink-200" />
                        )}
                      </button>

                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          {day.name}
                          {!day.worked && (
                            <span className="text-[10px] bg-rose-50 text-pink-600 border border-rose-100 px-2 py-0.5 rounded font-normal">
                              Descanso
                            </span>
                          )}
                        </div>
                        {day.worked && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            {uniqueItems === 0 ? (
                              <span className="text-slate-400 italic">Nenhum vídeo registrado</span>
                            ) : (
                              <span>
                                {uniqueItems} {uniqueItems === 1 ? 'tipo' : 'tipos'} • {totalItems} {totalItems === 1 ? 'vídeo' : 'vídeos'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Bullet values for production display */}
                      {day.worked && totalItems > 0 && (
                        <div className="bg-pink-100 text-pink-700 font-bold text-xs px-2.5 py-1 rounded-xl">
                          {totalItems} vd(s).
                        </div>
                      )}
                      <ChevronRight className={`w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform ${isSelected ? 'text-pink-650 translate-x-0.5' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* RIGHT PANEL: Selected day production entries (7 cols) */}
          <section id="panel-details" className="lg:col-span-7 flex flex-col gap-4">
            <div className="h-full bg-white rounded-2xl border border-rose-100 p-6 flex flex-col min-h-[480px]">
              {/* Day title header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-rose-100 pb-5 mb-5 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
                    <Calendar className="w-5.5 h-5.5 text-pink-600" />
                    <span>Registro de {selectedDay.name}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Adicione ou altere os vídeos gravados neste dia específico.
                  </p>
                </div>

                {/* Worked status quick toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">Gravei hoje?</span>
                  <button
                    onClick={() => handleToggleWorked(selectedDay.id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      selectedDay.worked ? 'bg-pink-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        selectedDay.worked ? 'translate-x-[20px]' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {!selectedDay.worked ? (
                /* Unworked screen promotion */
                <div className="grow flex flex-col items-center justify-center text-center p-6 bg-rose-50/10 rounded-2xl border border-dashed border-rose-200">
                  <Clock className="w-12 h-12 text-pink-300 mb-3" />
                  <h3 className="font-semibold text-slate-800 text-base">Dia de Descanso ou Sem Gravações</h3>
                  <p className="text-sm text-slate-500 max-w-sm mt-1 mb-5">
                    Este dia está marcado como descanso. Deseja realizar lançamentos de vídeos produzidos nele?
                  </p>
                  <button
                    id="btn-mark-worked"
                    onClick={() => handleToggleWorked(selectedDay.id)}
                    className="inline-flex items-center gap-2 bg-pink-50 hover:bg-pink-100 text-pink-700 font-semibold text-sm px-4 py-2 rounded-xl transition-colors active:scale-[0.98]"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Marcar como Dia de Gravação</span>
                  </button>
                </div>
              ) : (
                /* Worked content panel */
                <div className="grow flex flex-col justify-between">
                  {/* Form to add item */}
                  <form onSubmit={handleAddProduct} className="mb-6 bg-pink-50/30 border border-pink-100 p-4 rounded-xl shrink-0">
                    <span className="text-xs font-bold text-pink-700 block mb-3 uppercase tracking-wider font-display">
                      + Registrar Novo Vídeo
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      {/* Name input */}
                      <div className="sm:col-span-7">
                        <label htmlFor="product-name" className="text-xs font-semibold text-slate-600 block mb-1">
                          Título ou Tipo do Vídeo
                        </label>
                        <input
                          id="product-name"
                          type="text"
                          value={newProductName}
                          onChange={(e) => {
                            setNewProductName(e.target.value);
                            setFormError('');
                          }}
                          placeholder="Ex: Unboxing Fone de Ouvido, Review Corretivo, Trend de Look..."
                          className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                        />
                      </div>

                      {/* Quantity input */}
                      <div className="sm:col-span-3">
                        <label htmlFor="product-qty" className="text-xs font-semibold text-slate-600 block mb-1">
                          Quantidade
                        </label>
                        <div className="relative flex items-center w-full">
                          <button
                            type="button"
                            onClick={() => {
                              const v = Number(newProductQty) || 1;
                              setNewProductQty(String(Math.max(1, v - 1)));
                            }}
                            className="absolute left-1 text-slate-500 hover:bg-slate-100 p-1 rounded-md"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            id="product-qty"
                            type="number"
                            min="1"
                            value={newProductQty}
                            onChange={(e) => {
                              setNewProductQty(e.target.value);
                              setFormError('');
                            }}
                            className="w-full text-center bg-white border border-rose-200 rounded-xl py-2 px-6 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const v = Number(newProductQty) || 0;
                              setNewProductQty(String(v + 1));
                            }}
                            className="absolute right-1 text-slate-500 hover:bg-slate-100 p-1 rounded-md"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Button */}
                      <div className="sm:col-span-2">
                        <button
                          id="btn-add-item"
                          type="submit"
                          className="w-full inline-flex justify-center items-center gap-1 bg-pink-600 text-white font-medium text-sm rounded-xl py-2 px-3 hover:bg-pink-700 transition-colors focus:ring-1 focus:ring-pink-500"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Suggestions / Frequentes */}
                    {frequentProducts.length > 0 && (
                      <div className="mt-3.5">
                        <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
                          Usados recentemente:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {frequentProducts.map((prodName) => (
                            <button
                              key={prodName}
                              type="button"
                              onClick={() => {
                                setNewProductName(prodName);
                                setFormError('');
                              }}
                              className="text-xs bg-white text-slate-600 border border-rose-200 hover:border-pink-300 hover:text-pink-700 rounded-lg px-2.5 py-1 text-left transition-colors font-medium cursor-pointer"
                            >
                              {prodName}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {formError && (
                      <div className="mt-3 text-xs text-red-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-red-605 rounded-full inline-block"></span>
                        <span>{formError}</span>
                      </div>
                    )}
                  </form>

                  {/* List of active day products */}
                  <div className="grow overflow-y-auto max-h-[280px] border border-rose-100 rounded-xl">
                    {selectedDay.products.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 bg-rose-50/10">
                        <Package className="w-10 h-10 text-pink-300 mb-2" />
                        <span className="text-sm font-medium">Nenhum vídeo registrado para hoje</span>
                        <span className="text-xs text-slate-400 mt-1 max-w-xs">
                          Adicione os tipos ou títulos de vídeo acima e preencha suas respectivas quantidades produzidas.
                        </span>
                      </div>
                    ) : (
                      <div className="divide-y divide-rose-100">
                        {selectedDay.products.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between py-3.5 px-4 bg-white hover:bg-rose-50/20 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-2.5 h-2.5 bg-pink-500 rounded-full"></span>
                              <span className="text-sm font-bold text-slate-800">{item.name}</span>
                            </div>

                            <div className="flex items-center gap-5">
                              {/* Quantity controls */}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateProductQuantity(selectedDay.id, item.id, -1)}
                                  className="w-7 h-7 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:bg-slate-100 transition-colors"
                                  title="Diminuir unidade"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>

                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleManualQuantityChange(selectedDay.id, item.id, e.target.value)}
                                  className="w-12 text-center text-sm font-bold text-slate-800 bg-transparent border-none p-0 focus:outline-none"
                                />

                                <button
                                  type="button"
                                  onClick={() => handleUpdateProductQuantity(selectedDay.id, item.id, 1)}
                                  className="w-7 h-7 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:bg-slate-100 transition-colors"
                                  title="Aumentar unidade"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Delete button */}
                              <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(selectedDay.id, item.id)}
                                  className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Remover vídeo de hoje"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* BOTTOM METRICS SECTION: Aggregate Overview (Weekly Totals and benchmark charts) */}
          <section id="weekly-overview" className="mt-8">
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
              {/* Background design elements to make it premium */}
              <div className="absolute right-0 top-0 w-80 h-80 bg-pink-500/20 rounded-full filter blur-[120px] -mr-20 -mt-20"></div>

              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
                  <div>
                    <h2 className="text-xl font-bold font-display tracking-tight flex items-center gap-2">
                      <TrendingUp className="w-5.5 h-5.5 text-pink-400" />
                      <span>Rendimento Acumulado Geral</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Veja o volume de vídeos gravados compilado ao longo de toda a semana.
                    </p>
                  </div>

                {mostProductiveDay && (
                  <div className="flex items-center gap-2 bg-pink-950/40 border border-pink-900/60 rounded-2xl px-4 py-2 font-display text-sm text-pink-300">
                    <Award className="w-4.5 h-4.5 text-amber-400" />
                    <span>
                      Dia mais produtivo: <strong className="text-white">{mostProductiveDay.name}</strong> ({mostProductiveDay.total} vídeos)
                    </span>
                  </div>
                )}
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* 1. PRODUCT QUANTITY TOTALS BOARD */}
                <div className="md:col-span-5 flex flex-col gap-4">
                  <h3 className="text-sm font-semibold uppercase text-slate-400 tracking-wider font-display">
                    Vídeos por tipo / categoria
                  </h3>

                  {statsByProduct.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-sm italic bg-slate-800 hover:bg-slate-850/50 rounded-2xl border border-slate-800">
                      Nenhum vídeo registrado na semana
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
                      {statsByProduct.map((product) => (
                        <div
                          key={product.name}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-slate-850 border border-slate-800"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-pink-400"></span>
                            <span className="text-sm font-semibold">{product.name}</span>
                          </div>
                          <span className="text-sm font-bold bg-pink-900/50 px-2.5 py-1 rounded-lg text-pink-300">
                            {product.quantity} vídeo(s)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* General accumulator Counter */}
                  {totalQuantityOfAllProducts > 0 && (
                    <div className="mt-2 bg-pink-950/20 border border-pink-950/40 p-4 rounded-xl flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-pink-300 font-semibold block">Total de Vídeos na Semana</span>
                        <span className="text-[11px] text-slate-400">{totalWorkedDays} dias de gravação ativos</span>
                      </div>
                      <div className="text-2xl font-bold font-display text-pink-400">
                        {totalQuantityOfAllProducts} <span className="text-xs font-normal text-white">vídeos</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. PRODUCTION GRAPH benchmarking per day of the week */}
                <div className="md:col-span-7 flex flex-col gap-4">
                  <h3 className="text-sm font-semibold uppercase text-slate-400 tracking-wider font-display">
                    Volume de Gravação Diária
                  </h3>

                  <div className="flex flex-col gap-3">
                    {dailyProductionTotals.map((day) => {
                      // Calculate width percentage relative to maximum daily output
                      const percentage = maxDailyTotal > 0 ? (day.total / maxDailyTotal) * 100 : 0;

                      return (
                        <div key={day.id} className="flex items-center gap-3">
                          {/* Day Column label */}
                          <div className="w-24 text-xs font-semibold text-slate-300 truncate">
                            {day.name}
                          </div>

                          {/* Progress bar and quantity value */}
                          <div className="grow bg-slate-800 rounded-full h-8 overflow-hidden relative border border-slate-800">
                            {day.worked ? (
                              <div
                                style={{ width: `${Math.max(4, percentage)}%` }}
                                className={`h-full rounded-full transition-all duration-300 ${
                                  day.id === selectedDayId
                                    ? 'bg-pink-500'
                                    : 'bg-pink-600/80 hover:bg-pink-700'
                                }`}
                              ></div>
                            ) : (
                              <div className="absolute inset-0 bg-slate-800/40 border border-dashed border-slate-800 rounded-full flex items-center px-4 text-[10px] text-slate-500">
                                Descanso
                              </div>
                            )}

                            {day.worked && (
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-white">
                                {day.total > 0 ? `${day.total} vídeo(s)` : 'Sem gravações'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="max-w-6xl mx-auto mt-12 pt-6 border-t border-rose-200 text-center text-xs text-rose-400">
        <p>© {new Date().getFullYear()} Checklist de Vídeos para TikTok Shop. Localmente persistido no seu navegador com amor.</p>
      </footer>
    </div>
  );
}
