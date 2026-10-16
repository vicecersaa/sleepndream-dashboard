import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Package, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { api } from '../lib/api';
import { formatNumber } from '../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StockItem {
  productId: string;
  productName: string;
  thumbnail?: string;
  variantName?: string;
  sizeName?: string;
  sku: string;
  stock: number;
  type: 'simple' | 'variant' | 'size';
}

interface LowStockAlertProps {
  /** Default threshold, user dapat mengubahnya lewat UI */
  defaultThreshold?: number;
  /** Callback kalau mau redirect ke Products tab */
  onViewProduct?: (productId: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flattenStockItems(products: any[], threshold: number): StockItem[] {
  const items: StockItem[] = [];

  for (const p of products) {
    if (!p.isActive) continue;

    if (p.variants && p.variants.length > 0) {
      for (const v of p.variants) {
        if (v.sizes && v.sizes.length > 0) {
          for (const s of v.sizes) {
            if (s.stock <= threshold) {
              items.push({
                productId: p._id,
                productName: p.name,
                thumbnail: p.thumbnail,
                variantName: v.name,
                sizeName: s.name,
                sku: s.sku,
                stock: s.stock,
                type: 'size',
              });
            }
          }
        } else {
          const stock = v.stock ?? 0;
          if (stock <= threshold) {
            items.push({
              productId: p._id,
              productName: p.name,
              thumbnail: p.thumbnail,
              variantName: v.name,
              sku: v.sku,
              stock,
              type: 'variant',
            });
          }
        }
      }
    } else {
      const stock = p.stock ?? 0;
      if (stock <= threshold) {
        items.push({
          productId: p._id,
          productName: p.name,
          thumbnail: p.thumbnail,
          sku: p.sku,
          stock,
          type: 'simple',
        });
      }
    }
  }

  // Sort: stok 0 dulu, baru yang menipis, lalu A-Z
  return items.sort((a, b) => {
    if (a.stock === 0 && b.stock !== 0) return -1;
    if (a.stock !== 0 && b.stock === 0) return 1;
    return a.stock - b.stock;
  });
}

function stockBadge(stock: number) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />
        Habis
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />
      {formatNumber(stock)} sisa
    </span>
  );
}

function labelFor(item: StockItem) {
  if (item.type === 'size') return `${item.variantName} / ${item.sizeName}`;
  if (item.type === 'variant') return item.variantName!;
  return null;
}

// ─── Threshold Settings Panel ─────────────────────────────────────────────────

interface ThresholdPanelProps {
  value: number;
  onChange: (v: number) => void;
  onClose: () => void;
}

function ThresholdPanel({ value, onChange, onClose }: ThresholdPanelProps) {
  const [input, setInput] = useState(String(value));

  const apply = () => {
    const parsed = parseInt(input, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
      onClose();
    }
  };

  return (
    <div className="absolute right-0 top-8 z-20 w-56 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Batas stok menipis</p>
      <p className="text-xs text-gray-400 leading-snug">
        Produk / varian / ukuran dengan stok ≤ nilai ini akan ditampilkan di sini.
      </p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
          autoFocus
          className="flex-1 h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        />
        <button
          onClick={apply}
          className="h-8 px-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors"
        >
          Terapkan
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {[5, 10, 20].map((preset) => (
          <button
            key={preset}
            onClick={() => { setInput(String(preset)); onChange(preset); onClose(); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              value === preset
                ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-900/20 dark:border-brand-700 dark:text-brand-400'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            ≤ {preset}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const THRESHOLD_KEY = 'sleepndream_lowstock_threshold';
const COLLAPSED_KEY = 'sleepndream_lowstock_collapsed';
const DISMISSED_KEY = 'sleepndream_lowstock_dismissed';

export function LowStockAlert({ defaultThreshold = 10, onViewProduct }: LowStockAlertProps) {
  const [threshold, setThreshold] = useState<number>(() => {
    const saved = localStorage.getItem(THRESHOLD_KEY);
    return saved ? parseInt(saved, 10) : defaultThreshold;
  });
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === 'true');
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === 'true');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const PREVIEW_COUNT = 5;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getProducts({ limit: 1000, isActive: true });
      setItems(flattenStockItems(result.items, threshold));
    } catch {
      // fail silently — ini komponen sekunder
    }
    setLoading(false);
  }, [threshold]);

  useEffect(() => { load(); }, [load]);

  const handleThresholdChange = (v: number) => {
    setThreshold(v);
    localStorage.setItem(THRESHOLD_KEY, String(v));
    // Reset dismissed kalau threshold berubah
    setDismissed(false);
    localStorage.removeItem(DISMISSED_KEY);
  };

  const handleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(COLLAPSED_KEY, String(next));
  };



  // Kalau ada stok baru setelah dismiss, tampil lagi
  useEffect(() => {
    if (dismissed && items.length > 0) {
      // Cek apakah ada item baru (stok 0 selalu muncul lagi)
      const hasOutOfStock = items.some((i) => i.stock === 0);
      if (hasOutOfStock) {
        setDismissed(false);
        localStorage.removeItem(DISMISSED_KEY);
      }
    }
  }, [items, dismissed]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 animate-pulse">
        <div className="h-4 w-40 bg-gray-100 dark:bg-gray-800 rounded mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-50 dark:bg-gray-800/50 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10 px-4 py-3 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
          <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Semua stok aman</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500">Tidak ada produk dengan stok ≤ {threshold}</p>
        </div>
        <div className="relative shrink-0">
          <button
            onClick={() => setSettingsOpen((s) => !s)}
            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
            title="Atur threshold"
          >
            <Settings2 className="h-4 w-4" />
          </button>
          {settingsOpen && (
            <ThresholdPanel
              value={threshold}
              onChange={handleThresholdChange}
              onClose={() => setSettingsOpen(false)}
            />
          )}
        </div>
      </div>
    );
  }

  if (dismissed) {
    return (
      <button
        onClick={() => { setDismissed(false); localStorage.removeItem(DISMISSED_KEY); }}
        className="w-full rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/60 dark:bg-amber-900/10 px-4 py-2.5 flex items-center gap-2.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors text-left"
      >
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400 flex-1">
          {items.filter(i => i.stock === 0).length > 0
            ? `${items.filter(i => i.stock === 0).length} produk habis stok — klik untuk lihat`
            : `${items.length} produk stok menipis — klik untuk lihat`
          }
        </span>
      </button>
    );
  }

  const outOfStock = items.filter((i) => i.stock === 0);
  const lowStock = items.filter((i) => i.stock > 0);
  const visibleItems = showAll ? items : items.slice(0, PREVIEW_COUNT);

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-50/70 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-800/30">
        <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Peringatan Stok</p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
            {outOfStock.length > 0 && (
              <span className="text-red-600 dark:text-red-400 font-medium">{outOfStock.length} habis</span>
            )}
            {outOfStock.length > 0 && lowStock.length > 0 && <span className="mx-1">·</span>}
            {lowStock.length > 0 && (
              <span>{lowStock.length} menipis</span>
            )}
            <span className="ml-1 text-amber-500 dark:text-amber-600">(stok ≤ {threshold})</span>
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Settings */}
          <div className="relative">
            <button
              onClick={() => setSettingsOpen((s) => !s)}
              className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              title="Atur threshold"
            >
              <Settings2 className="h-4 w-4" />
            </button>
            {settingsOpen && (
              <ThresholdPanel
                value={threshold}
                onChange={handleThresholdChange}
                onClose={() => setSettingsOpen(false)}
              />
            )}
          </div>

          {/* Collapse */}
          <button
            onClick={handleCollapse}
            className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            title={collapsed ? 'Tampilkan' : 'Sembunyikan'}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>


        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <>
          <ul className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {visibleItems.map((item, idx) => {
              const label = labelFor(item);
              return (
                <li key={`${item.productId}-${item.sku}-${idx}`}>
                  <button
                    onClick={() => {
    setCollapsed(true);
    localStorage.setItem(COLLAPSED_KEY, 'true');
    onViewProduct?.(item.productId);
  }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors text-left group"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.productName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                          <Package className="h-4 w-4" />
                        </div>
                      )}
                      {/* Dot indicator */}
                      <span className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-gray-900 ${item.stock === 0 ? 'bg-red-500' : 'bg-amber-400'}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {item.productName}
                      </p>
                      {label ? (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          <span className="inline-flex items-center gap-1">
                            <span className="px-1.5 py-0 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-mono text-[10px]">
                              {label}
                            </span>
                            <span className="text-gray-300 dark:text-gray-600">·</span>
                            <span className="text-gray-400">{item.sku}</span>
                          </span>
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{item.sku}</p>
                      )}
                    </div>

                    {/* Badge */}
                    <div className="shrink-0">{stockBadge(item.stock)}</div>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Show more / less */}
          {items.length > PREVIEW_COUNT && (
            <div className="px-4 py-2.5 border-t border-gray-50 dark:border-gray-800/50">
              <button
                onClick={() => setShowAll((s) => !s)}
                className="flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline transition-colors"
              >
                {showAll ? (
                  <><ChevronUp className="h-3.5 w-3.5" /> Sembunyikan</>
                ) : (
                  <><ChevronDown className="h-3.5 w-3.5" /> Lihat {items.length - PREVIEW_COUNT} lainnya</>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
