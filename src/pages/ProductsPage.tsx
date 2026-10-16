import type { ProductWebsite } from "../lib/types";
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  Plus, Search, ChevronLeft, ChevronRight, Package, Edit, Trash2,
  ChevronDown, ChevronRight as ChevronR, Save, Star,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { FileUpload } from '../components/ui/FileUpload';
import { useToast } from '../contexts/ToastContext';
import { api } from '../lib/api';
import { websiteApi } from '../lib/website';
import type { Product, Category, ProductVariant, ProductSize } from '../lib/types';
import { formatCurrency, formatNumber, formatDate } from '../lib/utils';
import { FeaturedProductsReorder } from './FeaturedProductsReorder';
import { LowStockAlert } from './LowStockAlert';


const PAGE_SIZE = 8;
interface ProductsPageProps {
  highlightId?: string;
}


export function ProductsPage({ highlightId }: ProductsPageProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [allFeaturedProducts, setAllFeaturedProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [isFromAlert, setIsFromAlert] = useState(false);

const highlightRowRef = useRef<HTMLTableRowElement | null>(null);

useEffect(() => {
  if (!highlightId) return;

  setIsFromAlert(true); // TAMBAH INI
  setCategoryFilter('all');
  setStatusFilter('all');
  setPage(1);

  api.getProducts({ limit: 1000 }).then((result) => {
    const target = result.items.find((p) => p._id === highlightId);
    if (!target) return;
    setSearchInput(target.name);
    setSearch(target.name);
  });
}, [highlightId]);

useEffect(() => {
  const timer = setTimeout(() => {
    setSearch(searchInput);
    setPage(1);
  }, 500);
  return () => clearTimeout(timer);
}, [searchInput]);


  const toastRef = useRef(toast);
useEffect(() => { toastRef.current = toast; }, [toast]);

const loadData = useCallback(async () => {
  setLoading(true);
  try {
    const [prodResult, catResult, featuredResult] = await Promise.all([
      api.getProducts({
        page,
        limit: search ? 1000 : PAGE_SIZE, // kalau ada search, ambil semua
        search: search || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      }),
      api.getCategories({ limit: 100 }),
      api.getProducts({ limit: 100, isActive: true }),
    ]);
    setProducts(prodResult.items);
    setTotalItems(prodResult.pagination.totalItems);
    setCategories(catResult.items);
    setAllFeaturedProducts(featuredResult.items.filter((p) => p.isFeatured));
    setSelectedIds([]);
  } catch (err) {
    toastRef.current(err instanceof Error ? err.message : 'Gagal memuat produk', 'error');
  }
  setLoading(false);
}, [page, search, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const displayedProducts = categoryFilter === 'all'
    ? products
    : products.filter((p) => p.category?._id === categoryFilter);

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const handleSave = async (formPayload: {

    name: string; description: string; category: string; website: ProductWebsite;
    isVariantMode: boolean; sku: string; price: string; stock: string;
    variants: ProductVariant[];
    newImages: File[]; existingImages: string[]; imageOrder: string[];
    hoverImage: File | null;
    newVideo: File | null; removeVideo: boolean;
    isActive: boolean;
    weight: string;
  }) => {
    console.log('weight dari form:', formPayload.weight);

    console.log('category yang dikirim:', formPayload.category);
    try {
      const payload = {
        name: formPayload.name,
        description: formPayload.description,
        website: formPayload.website,
        category: formPayload.category,
        sku: formPayload.isVariantMode ? '' : formPayload.sku,
        price: formPayload.isVariantMode ? null : (parseFloat(formPayload.price) || 0),
        stock: formPayload.isVariantMode ? null : (parseInt(formPayload.stock, 10) || 0),
        weight: parseInt(formPayload.weight, 10) || 0,
        variants: formPayload.isVariantMode ? formPayload.variants : [],
        isActive: formPayload.isActive,
        images: formPayload.newImages,
        hoverImage: formPayload.hoverImage,
        video: formPayload.newVideo,
      };
      console.log('payload yang dikirim:', payload);
      if (editingProduct) {
  const updated = await api.updateProduct(editingProduct._id, payload);

  if (formPayload.imageOrder.length > 0) {
    const newImageUrls = updated.images.filter(
      (url: string) => !formPayload.existingImages.includes(url)
    );
    const fullOrder = [...formPayload.imageOrder, ...newImageUrls];
    await api.reorderProductImages(editingProduct._id, fullOrder);
  }

  toast(formPayload.isActive ? 'Produk berhasil dipublish' : 'Produk disimpan sebagai draft', 'success');
  } else {
        await api.createProduct(payload);
        toast(formPayload.isActive ? 'Produk berhasil dipublish' : 'Produk disimpan sebagai draft', 'success');
      }
      setModalOpen(false);
      setEditingProduct(null);
      loadData();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menyimpan produk', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteProduct(deleteTarget._id);
      toast('Produk berhasil dihapus', 'success');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menghapus produk', 'error');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === displayedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedProducts.map((p) => p._id));
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await api.bulkDeleteProducts(selectedIds);
      toast(`${selectedIds.length} produk berhasil dihapus`, 'success');
      setBulkDeleteOpen(false);
      setSelectedIds([]);
      loadData();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menghapus produk', 'error');
    } finally {
      setBulkDeleting(false);
    }
  };

  // ── TOGGLE FEATURED ──
  const handleToggleFeatured = async (product: Product) => {
    setTogglingId(product._id);
    try {
      const updated = await api.toggleFeatured(product._id);
      setProducts((prev) =>
        prev.map((p) => p._id === product._id ? { ...p, isFeatured: updated.isFeatured } : p)
      );
      toast(
        updated.isFeatured ? '⭐ Dijadikan produk unggulan' : 'Dihapus dari produk unggulan',
        'success'
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal update status unggulan', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
          {isFromAlert && (
  <button
    onClick={() => {
      setSearchInput('');
      setSearch('');
      setIsFromAlert(false);
    }}
    className="h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 whitespace-nowrap transition-all"
  >
    Reset Filter
  </button>
)}
          <Select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="w-auto whitespace-nowrap">
            <option value="all">Semua Kategori</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as 'all' | 'active' | 'draft'); setPage(1); }} className="w-auto whitespace-nowrap">
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="draft">Draft</option>
          </Select>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedIds.length > 0 && (
            <Button variant="danger" onClick={() => setBulkDeleteOpen(true)} className="shrink-0">
              <Trash2 className="h-4 w-4" /> Hapus ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => { setEditingProduct(null); setModalOpen(true); }} className="w-full sm:w-auto shrink-0">
            <Plus className="h-4 w-4" /> Tambah Produk
          </Button>
        </div>
      </div>

       {/* Tambah ini */}
      <Card className="p-5">
        <FeaturedProductsReorder
          products={allFeaturedProducts}
          onSaved={loadData}
        />
      </Card>

      <LowStockAlert
        defaultThreshold={10}
        onViewProduct={(id) => {
          setIsFromAlert(true);
          api.getProducts({ limit: 1000 }).then((result) => {
            const target = result.items.find((p) => p._id === id);
            if (!target) return;
            setSearchInput(target.name);
            setSearch(target.name);
          });
        }}
      />


      <Card>
        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : displayedProducts.length === 0 ? (
          <EmptyState
            icon={<Package className="h-8 w-8" />}
            title="Tidak ada produk"
            description="Coba sesuaikan filter atau tambahkan produk baru."
            action={<Button onClick={() => { setEditingProduct(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> Tambah Produk</Button>}
          />
        ) : (
          <>
            {/* ── DESKTOP TABLE ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={displayedProducts.length > 0 && selectedIds.length === displayedProducts.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 w-[32%]">Produk</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden lg:table-cell w-28">Kategori</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden lg:table-cell w-44">Range Harga</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 w-24">Total Stok</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden sm:table-cell w-28">Dibuat</th>
                    {/* ── kolom unggulan ── */}
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 w-28">
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-400" /> Unggulan
                      </span>
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden sm:table-cell w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedProducts.map((product) => {
                    const hasVariant = product.variants.length > 0;
                    const priceRange = product.minPrice === product.maxPrice
                      ? formatCurrency(product.minPrice)
                      : `${formatCurrency(product.minPrice)} - ${formatCurrency(product.maxPrice)}`;
                    const isToggling = togglingId === product._id;

                    return (
                      <tr key={product._id} ref={product._id === highlightId ? highlightRowRef : null} className={`border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors ${product.isFeatured ? 'bg-yellow-50/30 dark:bg-yellow-900/5' : ''} ${product._id === highlightId ? 'ring-2 ring-inset ring-brand-400 bg-brand-50/40 dark:bg-brand-900/10' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(product._id)}
                            onChange={() => toggleSelect(product._id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3 max-w-0">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                              {product.thumbnail ? (
                                <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-400"><Package className="h-5 w-5" /></div>
                              )}
                              {product.isFeatured && (
                                <div className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                  <Star className="h-2.5 w-2.5 text-yellow-900 fill-yellow-900" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={product.name}>{product.name}</p>
                                {!product.isActive && (
                                  <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    Draft
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400">{hasVariant ? `${product.variants.length} variant` : 'Tanpa variant'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">{product.category?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell whitespace-nowrap">{priceRange}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${product.totalStock === 0 ? 'text-red-500' : product.totalStock <= 10 ? 'text-amber-500' : 'text-gray-700 dark:text-gray-300'}`}>
                            {formatNumber(product.totalStock)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{formatDate(product.createdAt)}</td>

                        {/* ── TOGGLE FEATURED ── */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleFeatured(product)}
                            disabled={isToggling}
                            title={product.isFeatured ? 'Hapus dari unggulan' : 'Jadikan unggulan'}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
                              ${product.isFeatured ? 'bg-yellow-400' : 'bg-gray-200 dark:bg-gray-700'}
                              ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200
                              ${product.isFeatured ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                          </button>
                        </td>

                        <td className="px-4 py-3 w-20 shrink-0">
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setEditingProduct(product); setModalOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-600 transition-colors">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleteTarget(product)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── MOBILE CARDS ── */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
              {displayedProducts.map((product) => {
                const hasVariant = product.variants.length > 0;
                const isToggling = togglingId === product._id;
                return (
                  <div key={product._id} ref={product._id === highlightId ? (highlightRowRef as any) : null} className={`px-4 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors ${product.isFeatured ? 'bg-yellow-50/30 dark:bg-yellow-900/5' : ''} ${product._id === highlightId ? 'ring-2 ring-inset ring-brand-400 bg-brand-50/40 dark:bg-brand-900/10' : ''}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product._id)}
                        onChange={() => toggleSelect(product._id)}
                        className="rounded border-gray-300 mt-1 shrink-0"
                      />
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                        {product.thumbnail ? (
                          <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400"><Package className="h-5 w-5" /></div>
                        )}
                        {product.isFeatured && (
                          <div className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-yellow-400 rounded-full flex items-center justify-center">
                            <Star className="h-2.5 w-2.5 text-yellow-900 fill-yellow-900" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{product.name}</p>
                          {!product.isActive && (
                            <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              Draft
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{product.category?.name || '-'} - {hasVariant ? `${product.variants.length} variant` : 'Tanpa variant'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-500">Stok: <span className={`font-medium ${product.totalStock === 0 ? 'text-red-500' : product.totalStock <= 10 ? 'text-amber-500' : 'text-gray-700 dark:text-gray-300'}`}>{formatNumber(product.totalStock)}</span></span>
                        <span className="text-gray-300 dark:text-gray-700">|</span>
                        <span className="text-gray-500 text-xs">{formatDate(product.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* toggle featured mobile */}
                        <button
                          onClick={() => handleToggleFeatured(product)}
                          disabled={isToggling}
                          title={product.isFeatured ? 'Hapus dari unggulan' : 'Jadikan unggulan'}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
                            ${product.isFeatured ? 'bg-yellow-400' : 'bg-gray-200 dark:bg-gray-700'}
                            ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200
                            ${product.isFeatured ? 'translate-x-6' : 'translate-x-1'}`}
                          />
                        </button>
                        <button onClick={() => { setEditingProduct(product); setModalOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-600 transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(product)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!loading && displayedProducts.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 hidden sm:block">
              Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalItems)} dari {totalItems} produk
            </p>
            <div className="flex items-center gap-1 ml-auto sm:ml-0">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${page === i + 1 ? 'bg-brand-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {modalOpen && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          onClose={() => { setModalOpen(false); setEditingProduct(null); }}
          onSave={handleSave}
        />
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Produk"
        size="sm"
        footer={<><Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button><Button variant="danger" onClick={handleDelete}>Hapus</Button></>}
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Yakin ingin menghapus <span className="font-semibold text-gray-900 dark:text-gray-100">{deleteTarget?.name}</span>? Produk akan dinonaktifkan (bisa dipulihkan lagi nanti).
        </p>
      </Modal>

      <Modal
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title="Hapus Produk Terpilih"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>Batal</Button>
            <Button variant="danger" onClick={handleBulkDelete} disabled={bulkDeleting}>
              {bulkDeleting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Yakin ingin menghapus <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedIds.length} produk</span> yang dipilih? Produk akan dinonaktifkan (bisa dipulihkan lagi nanti).
        </p>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────
// Currency input helper
// ─────────────────────────────────────────────
function parseCurrencyInput(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  return digits === '' ? '' : String(parseInt(digits, 10));
}

interface CurrencyInputProps {
  label: string;
  value: string;
  onChange: (cleanValue: string) => void;
  placeholder?: string;
  error?: string;
}

function CurrencyInput({ label, value, onChange, placeholder = '0', error }: CurrencyInputProps) {
  const displayValue = value === '' ? '' : parseInt(value, 10).toLocaleString('id-ID');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseCurrencyInput(e.target.value));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    onChange(parseCurrencyInput(e.clipboardData.getData('text')));
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onPaste={handlePaste}
        placeholder={placeholder}
        className={`w-full h-10 rounded-lg border px-3 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all [color-scheme:light] dark:[color-scheme:dark] ${
          error
            ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
            : 'border-gray-200 dark:border-gray-700'
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// BulkStockSetter
// ─────────────────────────────────────────────
function BulkStockSetter({ onApply }: { onApply: (val: number) => void }) {
  const [bulkStock, setBulkStock] = useState('');
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    const val = parseInt(bulkStock, 10);
    if (isNaN(val) || val < 0) return;
    onApply(val);
    setApplied(true);
    setTimeout(() => setApplied(false), 1500);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/40 px-3 py-2">
      <span className="text-xs text-amber-700 dark:text-amber-400 font-medium shrink-0">Set semua stok:</span>
      <input
        type="number"
        min={0}
        value={bulkStock}
        onChange={(e) => { setBulkStock(e.target.value); setApplied(false); }}
        onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        placeholder="0"
        className="w-20 h-7 rounded-md border border-amber-300 dark:border-amber-600 bg-white dark:bg-gray-900 px-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
      />
      <button
        type="button"
        onClick={handleApply}
        disabled={bulkStock === ''}
        className={`h-7 px-3 rounded-md text-xs font-semibold transition-all shrink-0 ${
          applied ? 'bg-green-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40'
        }`}
      >
        {applied ? '✓ Diterapkan' : 'Terapkan'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Unsaved changes guard hook
// ─────────────────────────────────────────────
function useUnsavedGuard(isDirty: boolean) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingCallback = useRef<(() => void) | null>(null);

  const guardedClose = useCallback((onConfirm: () => void) => {
    if (isDirty) {
      pendingCallback.current = onConfirm;
      setConfirmOpen(true);
    } else {
      onConfirm();
    }
  }, [isDirty]);

  const confirmLeave = () => {
    setConfirmOpen(false);
    pendingCallback.current?.();
    pendingCallback.current = null;
  };

  const cancelLeave = () => {
    setConfirmOpen(false);
    pendingCallback.current = null;
  };

  return { confirmOpen, guardedClose, confirmLeave, cancelLeave };
}

// ─────────────────────────────────────────────
// Draggable image type
// ─────────────────────────────────────────────
interface DraggableImage {
  type: 'existing' | 'new';
  url: string;
  file?: File;
  originalUrl?: string;
}

interface FormModalProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: (data: {
    name: string; description: string; category: string; website: ProductWebsite;
    isVariantMode: boolean; sku: string; price: string; stock: string;
    variants: ProductVariant[];

    newImages: File[]; existingImages: string[]; imageOrder: string[];
    hoverImage: File | null;
    newVideo: File | null; removeVideo: boolean;
    isActive: boolean;
    weight: string;
  }) => void;
}

function ProductFormModal({ product, categories, onClose, onSave }: FormModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState(product?.name || '');
  const [categoryId, setCategoryId] = useState(product?.category?._id || '');
  const [description, setDescription] = useState(product?.description || '');
  const [website, setWebsite] = useState<ProductWebsite>(product?.website || {
    line: '', comfort: 'Balanced', material: '', badge: '', hoverImage: '', highlights: [],
    sizes: ['Single', 'Super Single', 'Queen', 'King'], configurations: ['Bed Only', 'Set'], details: {},
  });


  const [imageList, setImageList] = useState<DraggableImage[]>(() =>
    (product?.images || []).map((url) => ({ type: 'existing', url, originalUrl: url }))
  );
  const [hoverImageFile, setHoverImageFile] = useState<File | null>(null);
  const [uploadingAddOn, setUploadingAddOn] = useState<number | null>(null);
  const [removedImageIndexes, setRemovedImageIndexes] = useState<number[]>([]);
  const dragIndexRef = useRef<number | null>(null);

  const handleImageFiles = (files: File[]) => {
    const newEntries: DraggableImage[] = files.map((file) => ({
      type: 'new',
      url: URL.createObjectURL(file),
      file,
    }));
    setImageList((prev) => [...prev, ...newEntries]);
  };

  const handleRemoveImage = (idx: number) => {
    const item = imageList[idx];
    if (item.type === 'existing' && item.originalUrl) {
      const origIdx = (product?.images || []).indexOf(item.originalUrl);
      if (origIdx !== -1) {
        setRemovedImageIndexes((prev) => [...prev, origIdx]);
      }
    } else if (item.type === 'new' && item.url) {
      URL.revokeObjectURL(item.url);
    }
    setImageList((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadAddOnImage = async (index: number, file: File) => {
    setUploadingAddOn(index);
    try {
      const { url } = await websiteApi.upload(file);
      setWebsite(w => ({ ...w, addOns: (w.addOns || []).map((item, i) => i === index ? { ...item, image: url } : item) }));
      toast('Gambar produk pelengkap berhasil diupload', 'success');
    } catch (error) { toast(error instanceof Error ? error.message : 'Gagal upload gambar', 'error'); }
    finally { setUploadingAddOn(null); }
  };

  const handleDragStart = (idx: number) => { dragIndexRef.current = idx; };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from === null || from === idx) return;
    setImageList((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    dragIndexRef.current = idx;
  };

  const handleDragEnd = () => { dragIndexRef.current = null; };

  const [newVideo, setNewVideo] = useState<File[]>([]);
  const [existingVideo, setExistingVideo] = useState<string | null>(product?.video || null);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [thumbnail, setThumbnail] = useState(product?.thumbnail || '');
  // Sleep n Dream has configurations with priced sizes; the API stores these in the legacy variants field.
  const isVariantMode = true;
  const [sku, setSku] = useState(product?.sku || '');
  const [price, setPrice] = useState(String(product?.price ?? ''));
  const [stock, setStock] = useState(String(product?.stock ?? ''));
  const [weight, setWeight] = useState(String(product?.weight ?? ''));
  const [variants, setVariants] = useState<ProductVariant[]>(() => product?.variants?.length ? product.variants : [{
    name: 'Bed Only', sku: '', price: null, stock: null, image: '', imageKey: '', isActive: true,
    sizes: [{ name: 'Single', sku: product?.sku || '', price: product?.price || 0, stock: product?.stock || 0, isActive: true }],
  }]);



  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [openVariantIdx, setOpenVariantIdx] = useState<number | null>(null);

  const initialSnapshot = useRef({
    name: product?.name || '',
    categoryId: product?.category?._id || '',
    description: product?.description || '',
    price: String(product?.price ?? ''),
    stock: String(product?.stock ?? ''),
    sku: product?.sku || '',
    weight: String(product?.weight ?? ''),
    imageListLength: (product?.images || []).length,
    variantsJson: JSON.stringify(product?.variants || []),
  });

  const isDirty = useMemo(() => {
  const s = initialSnapshot.current;
  return (
    name !== s.name ||
    categoryId !== s.categoryId ||
    description !== s.description ||
    JSON.stringify(website) !== JSON.stringify(product?.website || { line: "", comfort: "Balanced", material: "", badge: "", hoverImage: "", highlights: [], sizes: ["Single", "Super Single", "Queen", "King"], configurations: ["Bed Only", "Set"] }) ||
    price !== s.price ||
    stock !== s.stock ||
    sku !== s.sku ||
    imageList.length !== s.imageListLength ||
    JSON.stringify(variants) !== s.variantsJson ||
    newVideo.length > 0 ||
    hoverImageFile !== null ||
    removeVideo
  );
}, [name, categoryId, description, price, stock, sku, imageList, variants, newVideo, removeVideo, website, product]);

  const { confirmOpen, guardedClose, confirmLeave, cancelLeave } = useUnsavedGuard(isDirty);
  const handleClose = () => guardedClose(onClose);

  const addVariant = () => {
    setVariants((prev) => [...prev, { name: '', sku: '', price: null, stock: null, sizes: [], isActive: true, image: '', imageKey: '' }]);
    setOpenVariantIdx(variants.length);
  };

  const updateVariant = (idx: number, updates: Partial<ProductVariant>) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, ...updates } : v)));
  };

  const removeVariant = (idx: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const addSize = (variantIdx: number) => {
    setVariants((prev) => prev.map((v, i) => (i === variantIdx
      ? { ...v, sizes: [...v.sizes, { name: '', sku: '', price: 0, stock: 0, isActive: true }] }
      : v)));
  };

  const updateSize = (variantIdx: number, sizeIdx: number, updates: Partial<ProductSize>) => {
    setVariants((prev) => prev.map((v, i) => (i === variantIdx
      ? { ...v, sizes: v.sizes.map((s, si) => (si === sizeIdx ? { ...s, ...updates } : s)) }
      : v)));
  };

  const removeSize = (variantIdx: number, sizeIdx: number) => {
    setVariants((prev) => prev.map((v, i) => (i === variantIdx
      ? { ...v, sizes: v.sizes.filter((_, si) => si !== sizeIdx) }
      : v)));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nama produk harus diisi';
    if (!categoryId) e.category = 'Kategori harus dipilih';

    if (!variants.length) e.configurations = 'Tambahkan minimal satu konfigurasi';
    variants.forEach((v, idx) => {
      if (!v.name.trim()) e[`variant-name-${idx}`] = 'Nama konfigurasi harus diisi';
      if (!v.sizes.length) e[`sizes-${idx}`] = 'Tambahkan minimal satu ukuran';
      v.sizes.forEach((s, sIdx) => {
        if (!s.name.trim()) e[`size-name-${idx}-${sIdx}`] = 'Nama ukuran harus diisi';
        if (!s.sku.trim()) e[`size-sku-${idx}-${sIdx}`] = 'SKU ukuran harus diisi';
        if (!s.price) e[`size-price-${idx}-${sIdx}`] = 'Harga ukuran harus diisi';
      });
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (submitAsActive: boolean) => {
    if (!validate()) {
      toast('Periksa kembali data yang diisi', 'error');
      return;
    }

    setSaving(true);
    try {
      if (product) {
        for (const index of removedImageIndexes.sort((a, b) => b - a)) {
          await api.removeProductImage(product._id, index);
        }
        if (removeVideo) {
          await api.removeProductVideo(product._id);
        }
      }

      const orderedExistingUrls = imageList
        .filter((img) => img.type === 'existing')
        .map((img) => img.originalUrl as string);

      const orderedNewFiles = imageList
        .filter((img) => img.type === 'new')
        .map((img) => img.file as File);

      await onSave({
        name: name.trim(),
        description: description.trim(),
        website,
        category: categoryId,
        isVariantMode,
        sku: sku.trim(),
        price,
        stock,
        variants,
        weight,
        newImages: orderedNewFiles,
        hoverImage: hoverImageFile,
        existingImages: orderedExistingUrls,
        imageOrder: orderedExistingUrls,
        newVideo: newVideo[0] || null,
        removeVideo,
        isActive: submitAsActive,
      });

      setRemoveVideo(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        open
        onClose={handleClose}
        title={product ? 'Edit Produk' : 'Tambah Produk'}
        subtitle={product ? product.name : 'Buat produk baru dalam katalog'}
        size="xl"
        footer={
          <div className="flex items-center justify-between gap-2 w-full">
            <Button variant="outline" onClick={handleClose}>Batal</Button>
            <div className="flex items-center gap-2">
              {product && product.isActive ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleSubmit(false)}
                    disabled={saving}
                    className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  >
                    Arsipkan ke Draft
                  </Button>
                  <Button onClick={() => handleSubmit(true)} disabled={saving}>
                    {saving ? 'Menyimpan...' : <><Save className="h-4 w-4" /> Simpan</>}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => handleSubmit(false)} disabled={saving}>
                    {saving ? 'Menyimpan...' : 'Simpan Draft'}
                  </Button>
                  <Button onClick={() => handleSubmit(true)} disabled={saving}>
                    {saving ? 'Menyimpan...' : <><Save className="h-4 w-4" /> Publish</>}
                  </Button>
                </>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-6 pb-4">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gambar Produk
                <span className="ml-1 text-gray-400 font-normal">(drag untuk ubah urutan)</span>
              </label>

              {imageList.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {imageList.map((img, idx) => {
                    const isThumbnail = img.type === 'existing' && img.originalUrl === thumbnail;
                    return (
                      <div
                        key={img.url}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                        className="relative group aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-brand-400 cursor-grab active:cursor-grabbing transition-all select-none"
                        style={{ boxShadow: isThumbnail ? '0 0 0 2px #6366f1' : undefined }}
                      >
                        <img src={img.url} alt="" className="h-full w-full object-cover pointer-events-none" />

                        {isThumbnail && (
                          <span className="absolute bottom-0 left-0 right-0 bg-brand-600/80 text-white text-[10px] text-center py-0.5 font-medium">
                            Thumbnail
                          </span>
                        )}

                        {img.type === 'existing' && !isThumbnail && product && (
                          <button
                            onClick={async () => {
                              await api.setProductThumbnail(product._id, img.originalUrl!);
                              setThumbnail(img.originalUrl!);
                            }}
                            className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Set thumbnail
                          </button>
                        )}

                        <button
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                        >
                          ×
                        </button>

                        <span className="absolute top-1 left-1 h-5 w-5 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <FileUpload
                type="image"
                multiple
                maxFiles={10 - imageList.length}
                label=""
                files={[]}
                onFilesChange={handleImageFiles}
                existing={[]}
                thumbnail={undefined}
                onSetThumbnail={() => {}}
                onRemoveExisting={() => {}}
              />
            </div>

            <FileUpload
              type="video"
              label="Video Produk (opsional)"
              files={newVideo}
              onFilesChange={setNewVideo}
              existing={existingVideo ? [existingVideo] : []}
              onRemoveExisting={() => {
                setExistingVideo(null);
                setRemoveVideo(true);
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nama Produk" value={name} onChange={(e) => setName(e.target.value)} placeholder="cth. Headphone Wireless" error={errors.name} />
            <div>
              <Select label="Kategori" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Pilih kategori</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </Select>
              {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-brand-100 bg-brand-50/40 p-4">
            <h3 className="text-sm font-semibold text-brand-800">Tampilan di website Sleep n Dream</h3>
            <p className="text-xs text-stone-500">Produk aktif muncul di katalog. Tandai bintang di daftar produk untuk menampilkannya di Best Sellers.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(['line','comfort','material','badge'] as const).map(key => <Input key={key} label={({line:'Koleksi / seri',comfort:'Comfort feel',material:'Material',badge:'Label produk'})[key]} value={website[key]} onChange={e=>setWebsite(w=>({...w,[key]:e.target.value}))}/>) }
            </div>
            <div>
              <FileUpload
                type="image"
                label="Gambar hover produk (opsional)"
                files={hoverImageFile ? [hoverImageFile] : []}
                onFilesChange={(files) => setHoverImageFile(files[0] || null)}
                existing={!hoverImageFile && website.hoverImage ? [website.hoverImage] : []}
                onRemoveExisting={() => setWebsite(w => ({ ...w, hoverImage: '' }))}
              />
              <p className="mt-2 text-xs text-stone-500">Gambar ini tampil saat kursor diarahkan ke kartu produk di halaman katalog.</p>
            </div>
            <Textarea label="Keunggulan (satu per baris)" value={website.highlights.join('\n')} onChange={e=>setWebsite(w=>({...w,highlights:e.target.value.split('\n')}))} rows={3}/>
          </div>
          <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
            <div>
              <h3 className="text-sm font-semibold text-stone-800">Informasi detail halaman produk</h3>
              <p className="mt-1 text-xs text-stone-500">Isi setiap bagian ini khusus untuk produk yang sedang dibuat atau diedit.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Judul informasi ukuran" value={website.details?.sizeTitle || ''} placeholder="Size Information" onChange={e=>setWebsite(w=>({...w,details:{...w.details,sizeTitle:e.target.value}}))}/>
              <Textarea label="Isi informasi ukuran" value={website.details?.sizeContent || ''} placeholder="Contoh: Queen 160 × 200 cm. Tinggi kasur 32 cm." rows={3} onChange={e=>setWebsite(w=>({...w,details:{...w.details,sizeContent:e.target.value}}))}/>
              <Input label="Judul cara perawatan" value={website.details?.careTitle || ''} placeholder="Care Instructions" onChange={e=>setWebsite(w=>({...w,details:{...w.details,careTitle:e.target.value}}))}/>
              <Textarea label="Isi cara perawatan" value={website.details?.careContent || ''} placeholder="Tulis panduan perawatan khusus produk ini." rows={3} onChange={e=>setWebsite(w=>({...w,details:{...w.details,careContent:e.target.value}}))}/>
              <Input label="Judul pengiriman & pengembalian" value={website.details?.shippingTitle || ''} placeholder="Shipping & Returns" onChange={e=>setWebsite(w=>({...w,details:{...w.details,shippingTitle:e.target.value}}))}/>
              <Textarea label="Isi pengiriman & pengembalian" value={website.details?.shippingContent || ''} placeholder="Tulis ketentuan pengiriman atau pengembalian produk ini." rows={3} onChange={e=>setWebsite(w=>({...w,details:{...w.details,shippingContent:e.target.value}}))}/>
            </div>
          </div>

          <Textarea label="Deskripsi" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Deskripsi produk..." />

            {/* Selalu tampil, regardless variant mode */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Input label="Berat (gram)" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" />
          </div>

          <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h3 className="text-base font-semibold text-stone-900">Konfigurasi & ukuran</h3><p className="mt-1 text-xs text-stone-500">Tambahkan konfigurasi seperti Bed Only atau Set, lalu masukkan ukuran, SKU, harga, dan stoknya.</p></div>
              <Button size="sm" variant="outline" onClick={addVariant}><Plus className="h-4 w-4" /> Tambah konfigurasi</Button>
            </div>
            {errors.configurations && <p className="text-xs text-red-500">{errors.configurations}</p>}
            {variants.map((variant, vIdx) => (
              <div key={vIdx} className="overflow-hidden rounded-xl border border-stone-200">
                <div className="flex items-center gap-3 bg-stone-50 px-4 py-3"><span className="text-xs font-semibold text-stone-400">{vIdx + 1}</span><span className="flex-1 truncate text-sm font-semibold text-stone-800">{variant.name || 'Konfigurasi baru'}</span><span className="text-xs text-stone-500">{variant.sizes?.length || 0} ukuran</span><button type="button" aria-label="Hapus konfigurasi" onClick={() => removeVariant(vIdx)} className="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button></div>
                <div className="space-y-4 p-4">
                  <Input label="Nama konfigurasi" value={variant.name} onChange={(e) => updateVariant(vIdx, { name: e.target.value })} placeholder="Contoh: Bed Only atau Set" error={errors[`variant-name-${vIdx}`]}/>
                  <div className="flex items-center justify-between gap-3"><div><h4 className="text-sm font-medium text-stone-800">Daftar ukuran</h4><p className="mt-0.5 text-xs text-stone-500">Setiap ukuran memiliki harga dan stok sendiri.</p></div><Button size="sm" variant="outline" onClick={() => addSize(vIdx)}><Plus className="h-3.5 w-3.5" /> Tambah ukuran</Button></div>
                  {errors[`sizes-${vIdx}`] && <p className="text-xs text-red-500">{errors[`sizes-${vIdx}`]}</p>}
                  <BulkStockSetter onApply={(val) => setVariants(prev => prev.map((item, index) => index === vIdx ? { ...item, sizes: item.sizes.map(size => ({ ...size, stock: val })) } : item))}/>
                  <div className="space-y-3">{variant.sizes.map((size, sIdx) => (
                    <div key={sIdx} className="rounded-lg border border-stone-200 bg-stone-50/60 p-3"><div className="mb-3 flex items-center justify-between"><span className="text-sm font-medium text-stone-700">Ukuran {sIdx + 1}</span><button type="button" aria-label="Hapus ukuran" onClick={() => removeSize(vIdx, sIdx)} className="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-4"><Input label="Ukuran" value={size.name} onChange={(e) => updateSize(vIdx, sIdx, { name: e.target.value })} placeholder="Single, Queen, King" error={errors[`size-name-${vIdx}-${sIdx}`]}/><Input label="SKU" value={size.sku} onChange={(e) => updateSize(vIdx, sIdx, { sku: e.target.value })} placeholder="Contoh: DL-QUEEN" error={errors[`size-sku-${vIdx}-${sIdx}`]}/><CurrencyInput label="Harga (Rp)" value={String(size.price || '')} onChange={(value) => updateSize(vIdx, sIdx, { price: value === '' ? 0 : parseInt(value, 10) })} placeholder="0" error={errors[`size-price-${vIdx}-${sIdx}`]}/><Input label="Stok" type="number" value={String(size.stock)} onChange={(e) => updateSize(vIdx, sIdx, { stock: parseInt(e.target.value, 10) || 0 })} placeholder="0"/></div></div>
                  ))}</div>
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-stone-800">Produk pelengkap</h3><p className="mt-1 text-xs text-stone-500">Opsional. Produk di sini hanya tampil pada halaman produk ini.</p></div><Button type="button" size="sm" variant="outline" onClick={() => setWebsite(w => ({ ...w, addOns: [...(w.addOns || []), { name: '', price: 0, image: '', sizes: [] }] }))}><Plus className="h-3.5 w-3.5" /> Tambah produk</Button></div>
            {(website.addOns || []).map((item, index) => <div key={index} className="grid gap-3 rounded-lg border border-stone-200 bg-stone-50/60 p-3 sm:grid-cols-[92px_1fr_auto]">
              <label className="flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-stone-300 bg-white text-center text-[10px] text-stone-500">{item.image ? <img src={item.image} alt="" className="h-full w-full object-cover"/> : uploadingAddOn===index ? 'Mengunggah…' : 'Upload gambar'}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0];if(file)void uploadAddOnImage(index,file);e.target.value='';}}/></label>
              <div className="grid gap-3 sm:grid-cols-3"><Input label="Nama" value={item.name} onChange={e=>setWebsite(w=>({...w,addOns:(w.addOns||[]).map((entry,i)=>i===index?{...entry,name:e.target.value}:entry)}))}/><CurrencyInput label="Harga (Rp)" value={String(item.price || '')} onChange={value=>setWebsite(w=>({...w,addOns:(w.addOns||[]).map((entry,i)=>i===index?{...entry,price:value===''?0:parseInt(value,10)}:entry)}))}/><Input label="Ukuran (pisahkan koma)" value={item.sizes.join(', ')} onChange={e=>setWebsite(w=>({...w,addOns:(w.addOns||[]).map((entry,i)=>i===index?{...entry,sizes:e.target.value.split(',').map(v=>v.trim()).filter(Boolean)}:entry)}))}/></div>
              <button type="button" aria-label="Hapus produk pelengkap" onClick={()=>setWebsite(w=>({...w,addOns:(w.addOns||[]).filter((_,i)=>i!==index)}))} className="self-start rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4"/></button>
              </div>)}
          </section>
        </div>
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={cancelLeave}
        title="Keluar tanpa menyimpan?"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={cancelLeave}>Tetap di sini</Button>
            <Button variant="danger" onClick={confirmLeave}>Keluar</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Kamu punya perubahan yang belum disimpan. Kalau keluar sekarang, semua perubahan akan hilang.
        </p>
      </Modal>
    </>
  );
}
