import { useEffect, useRef, useState, useCallback } from 'react';
import { Star, Save, Package, RotateCcw, ChevronDown } from 'lucide-react';
import { api } from '../lib/api';
import type { Product } from '../lib/types';
import { formatCurrency } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

interface FeaturedItem {
  _id: string;
  name: string;
  thumbnail: string | null;
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  category?: { name: string } | null;
  isFeatured: boolean;
  featuredOrder?: number;
}

interface FeaturedProductsReorderProps {
  products: Product[];
  onSaved?: () => void;
}

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function FeaturedProductsReorder({ products, onSaved }: FeaturedProductsReorderProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const initItems = useCallback(
    () =>
      (products.filter((p) => p.isFeatured) as unknown as FeaturedItem[]).sort(
        (a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0)
      ),
    [products]
  );

  const [items, setItems] = useState<FeaturedItem[]>(initItems);
  const [originalItems, setOriginalItems] = useState<FeaturedItem[]>(initItems);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  useEffect(() => {
    const fresh = initItems();
    setItems(fresh);
    setOriginalItems(fresh);
  }, [initItems]);

  const isDirty =
    items.length > 0 &&
    items.some((item, idx) => item._id !== originalItems[idx]?._id);

  const dragIdx = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    dragIdx.current = idx;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(idx);
  };

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === idx) return;
    setItems((prev) => arrayMove(prev, dragIdx.current!, idx));
    dragIdx.current = null;
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    dragIdx.current = null;
    setDragOverIdx(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.reorderFeatured(items.map((i) => i._id));
      setOriginalItems([...items]);
      toast('Urutan produk unggulan berhasil disimpan', 'success');
      onSaved?.();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menyimpan urutan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setItems([...originalItems]);
    setConfirmOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* ── Collapsible Header ── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Produk Unggulan
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
            {items.length} produk
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isOpen && isDirty && (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmOpen(true); }}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
          {isOpen && (
            <Button
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleSave(); }}
              disabled={!isDirty || saving}
              className={`transition-all ${!isDirty ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {saving ? 'Menyimpan...' : <><Save className="h-3.5 w-3.5" /> Simpan Urutan</>}
            </Button>
          )}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* ── Content ── */}
      {isOpen && (
        <>
          {items.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-10 text-center">
              <Star className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Belum ada produk unggulan
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Aktifkan toggle "Unggulan" pada produk untuk menampilkannya di sini.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Drag kartu untuk mengubah urutan. Nomor di pojok kiri atas adalah posisi tampilan di halaman utama.
              </p>

              {/* ── Visual Grid ── */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {items.map((item, idx) => {
                  const isDraggingThis = dragIdx.current === idx;
                  const isOver = dragOverIdx === idx && dragIdx.current !== idx;

                  return (
                    <div
                      key={item._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing select-none group
                        ${isDraggingThis
                          ? 'opacity-40 scale-95 border-brand-400'
                          : isOver
                          ? 'border-brand-500 scale-105 shadow-lg shadow-brand-500/20'
                          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      style={{ aspectRatio: '3/4' }}
                    >
                      {/* Thumbnail */}
                      <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800">
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.name}
                            className="h-full w-full object-cover pointer-events-none"
                            draggable={false}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                          </div>
                        )}
                      </div>

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                      {/* Rank badge */}
                      <div className="absolute top-2 left-2 h-6 w-6 rounded-md bg-yellow-400 flex items-center justify-center shadow">
                        <span className="text-[11px] font-bold text-yellow-900">
                          {idx + 1}
                        </span>
                      </div>

                      {/* Drop indicator */}
                      {isOver && (
                        <div className="absolute inset-0 rounded-xl border-2 border-brand-500 bg-brand-500/10 flex items-center justify-center">
                          <div className="h-8 w-0.5 bg-brand-500 rounded-full" />
                        </div>
                      )}

                      {/* Product name at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-[11px] font-medium text-white leading-tight line-clamp-2">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-white/60 mt-0.5 truncate">
                          {item.minPrice === item.maxPrice
                            ? formatCurrency(item.minPrice)
                            : formatCurrency(item.minPrice)}
                        </p>
                      </div>

                      {/* Stock warning */}
                      {item.totalStock <= 10 && (
                        <div className="absolute top-2 right-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            item.totalStock === 0
                              ? 'bg-red-500 text-white'
                              : 'bg-amber-400 text-amber-900'
                          }`}>
                            {item.totalStock === 0 ? 'Habis' : `Sisa ${item.totalStock}`}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Confirm reset modal */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Reset urutan?"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Semua perubahan urutan yang belum disimpan akan dikembalikan ke posisi semula.
        </p>
      </Modal>
    </div>
  );
}
