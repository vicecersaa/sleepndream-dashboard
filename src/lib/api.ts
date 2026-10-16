import { isDemo, demoFetch } from './demo';
import type {
  Product,
  Category,
  CategoryListResponse,
  CategoryQueryParams,
  CategoryFormPayload,
  Customer,
  Order,
  OrderListResponse,
  OrderQueryParams,
  OrderStatus,
  PaymentStatus,
  ShippingStatus,
  Admin,
  InventoryHistory,
  ProductListResponse,
  ProductQueryParams,
  ProductFormPayload,
  Banner,
  BannerListResponse,
  BannerQueryParams,
  BannerFormPayload,
  Coupon,
  CouponListResponse,
  CouponQueryParams,
  CouponFormPayload,
  Warranty,
  WarrantyFormPayload,
  HomepageContent,
  HomepageFormState,
} from "./types";


const API_BASE_URL = (isDemo ? "/demo/api" : import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function configuredFetch(input: RequestInfo | URL, init?: RequestInit) {
  if (!API_BASE_URL) throw new Error("API Sleep n Dream belum dikonfigurasi. Isi VITE_API_BASE_URL di .env.local.");
  if (isDemo) return demoFetch(input, init);

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 25_000);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('Server terlalu lama merespons. Coba simpan kembali.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export interface DashboardSummary {
  todayRevenue: number;
  totalOrders: number;
  todayOrders: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  lowStock: number;
}

export interface SalesChartItem {
  date: string;
  revenue: number;
}

export interface OrderStatusItem {
  status: "pending" | "processing" | "completed" | "cancelled";
  count: number;
}

export interface DashboardRecentOrder {
  _id: string;
  orderNumber: string;
  shippingAddress?: Record<string, any> | null;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export interface BestSellingProduct {
  _id: string | null;
  name: string;
  thumbnail: string | null;
  sold: number;
  revenue: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  salesChart: SalesChartItem[];
  orderStatus: OrderStatusItem[];
  recentOrders: DashboardRecentOrder[];
  bestSellingProducts: BestSellingProduct[];
}

// =======================
// Helper Functions
// =======================

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {

  if (!API_BASE_URL) throw new Error("API Sleep n Dream belum dikonfigurasi. Isi VITE_API_BASE_URL di .env.local.");

  const isFormData = options.body instanceof FormData;

  const res = await configuredFetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.message || `Request gagal (${res.status})`);
  }

  return (json?.data ?? json) as T;
}

function buildHomepageFormData(form: HomepageFormState): FormData {
  const fd = new FormData();

  const appendFile = (key: string, value: string | File): string | null => {
    if (value instanceof File) {
      fd.append(key, value);
      return null;
    }
    return value;
  };

  const meta = {
    hero: {
      ...form.hero,
      image: appendFile('heroImage', form.hero.image),
      video: appendFile('heroVideo', form.hero.video),
    },
    collection: form.collection,
    bestseller: form.bestseller,
    flashDeals: form.flashDeals,
    promoCards: form.promoCards,
    promoStrip: form.promoStrip,
    craftsmanship: {
      ...form.craftsmanship,
      image: appendFile('craftImage', form.craftsmanship.image),
    },
    testimonials: form.testimonials,
    newsletter: form.newsletter,
  };

  fd.append('content', JSON.stringify(meta));
  return fd;
}

function buildProductFormData(
  payload: Partial<ProductFormPayload>
): FormData {

  const formData = new FormData();
  if (payload.website !== undefined) formData.append("website", JSON.stringify(payload.website));
  if (payload.hoverImage instanceof File) formData.append("hoverImage", payload.hoverImage);


  // =====================
  // BASIC FIELD
  // =====================

  if (payload.name !== undefined)
    formData.append("name", payload.name);


  if (payload.description !== undefined)
    formData.append("description", payload.description);


  if (payload.category !== undefined)
    formData.append("category", payload.category);


  if (payload.price != null)
    formData.append(
      "price",
      String(payload.price)
    );


  if (payload.stock != null)
    formData.append(
      "stock",
      String(payload.stock)
    );


  if (payload.sku !== undefined)
    formData.append(
      "sku",
      payload.sku
    );

    if (payload.weight !== undefined)        // ← tambah ini
  formData.append("weight", String(payload.weight));



  if (payload.isActive !== undefined)
    formData.append(
      "isActive",
      String(payload.isActive)
    );



  // =====================
  // VARIANTS
  // =====================

  if (payload.variants !== undefined) {

  const cleanVariants = payload.variants.map((variant:any)=>{

    const {
      image,
      ...rest
    } = variant;

    const cleanImage = (image as any) instanceof File
  ? ""
  : typeof image === "string" && !image.startsWith("blob:")
    ? image
    : "";

    return {
      ...rest,
      // A Sleep n Dream purchase option has priced sizes. Parent-level pricing is invalid.
      ...(Array.isArray(variant.sizes) && variant.sizes.length > 0
        ? { sku: "", price: null, stock: null }
        : {}),
      image: cleanImage,
      imageKey: variant.imageKey || ""
    };

  });

  console.log('variants before save:', payload.variants.map((v: any) => ({ name: v.name, image: v.image })));
  formData.append(
    "variants",
    JSON.stringify(cleanVariants)
  );


  payload.variants.forEach((variant:any)=>{

    if(variant.image instanceof File){

      formData.append(
        "variantImages",
        variant.image
      );

    }

  });

}



  // =====================
  // PRODUCT IMAGES
  // =====================

  payload.images?.forEach(
    (file)=>{

      formData.append(
        "images",
        file
      );

    }
  );



  // =====================
  // IMAGE ORDER
  // =====================

  if (
    payload.imageOrder &&
    payload.imageOrder.length > 0
  ) {

    formData.append(
      "imageOrder",
      JSON.stringify(
        payload.imageOrder
      )
    );

  }



  // =====================
  // VIDEO
  // =====================

  if (payload.video) {

    formData.append(
      "video",
      payload.video
    );

  }

  console.log('FormData entries:');
  for (let [key, value] of formData.entries()) {
    console.log(key, value);
  }



  return formData;
}

function buildCategoryFormData(payload: Partial<CategoryFormPayload>): FormData {
  const formData = new FormData();

  if (payload.name !== undefined) formData.append('name', payload.name);
  if (payload.description !== undefined) formData.append('description', payload.description);
  if (payload.sortOrder !== undefined) formData.append('sortOrder', String(payload.sortOrder));
  if (payload.isActive !== undefined) formData.append('isActive', String(payload.isActive));
  if (payload.image) formData.append('image', payload.image);

  return formData;
}

function buildBannerFormData(payload: Partial<BannerFormPayload>): FormData {
  const formData = new FormData();

  if (payload.link !== undefined) formData.append('link', payload.link);
  if (payload.sortOrder !== undefined) formData.append('sortOrder', String(payload.sortOrder));
  if (payload.isActive !== undefined) formData.append('isActive', String(payload.isActive));
  if (payload.image) formData.append('image', payload.image);

  return formData;
}

// ===== API Functions =====

export const api = {
  // --- Auth ---
  async login(email: string, password: string): Promise<{ success: boolean; admin?: Admin; error?: string }> {
    if (!API_BASE_URL) return { success: false, error: 'API Sleep n Dream belum dikonfigurasi. Isi VITE_API_BASE_URL di .env.local.' };
    try {
      const res = await configuredFetch(`${API_BASE_URL}/auth/admin/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        return { success: false, error: json.message || 'Gagal masuk' };
      }

      const backendUser = json.data.user;
      const admin: Admin = {
        id: backendUser.id,
        full_name: backendUser.email, // backend belum punya field nama, sementara pakai email
        email: backendUser.email,
        role: backendUser.role,
        status: 'active',
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      return { success: true, admin };
    } catch {
      return { success: false, error: 'Tidak bisa terhubung ke server' };
    }
  },

  async logout(): Promise<void> {
    try {
      await configuredFetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // gagal pun tetap lanjut clear state di frontend
    }
  },

  async getMe(): Promise<{ success: boolean; admin?: Admin }> {
    try {
      const res = await configuredFetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) return { success: false };

      const json = await res.json();
      const backendUser = json.data;

      const admin: Admin = {
        id: backendUser.id,
        full_name: backendUser.email,
        email: backendUser.email,
        role: backendUser.role,
        status: 'active',
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      return { success: true, admin };
    } catch {
      return { success: false };
    }
  },

  // --- Dashboard ---
  async getDashboard(): Promise<DashboardData> {
    return apiFetch<DashboardData>('/admin/dashboard');
  },

  // ==================================================================
  // NOTE: fungsi di bawah ini (Categories, Products, Orders, Customers,
  // Admins, Inventory) MASIH pakai localStorage lama (belum disambungkan
  // ke backend). Kita beresin satu-satu setelah kirim model/controller
  // masing-masing resource, biar tipenya bisa disesuaikan persis kayak
  // Dashboard di atas. Jangan dipakai dulu buat data asli sebelum
  // diganti — masih placeholder.
  // ==================================================================

  async getCategories(params: CategoryQueryParams = {}): Promise<CategoryListResponse> {
  const query = new URLSearchParams();

  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
  if (params.sort) query.set('sort', params.sort);

  const qs = query.toString();
  const result = await apiFetch<Category[] | CategoryListResponse>(`/admin/categories${qs ? `?${qs}` : ''}`);

  // Fallback kalau backend belum konsisten kirim pagination
  if (Array.isArray(result)) {
    return {
      items: result,
      pagination: {
        page: params.page || 1,
        limit: params.limit || result.length,
        totalItems: result.length,
        totalPages: 1,
      },
    };
  }
  return result;
},

  async createCategory(payload: CategoryFormPayload): Promise<Category> {
    const formData = buildCategoryFormData(payload);
    return apiFetch<Category>('/admin/categories', {
      method: 'POST',
      body: formData,
    });
  },

  async updateCategory(id: string, payload: Partial<CategoryFormPayload>): Promise<Category> {
    const formData = buildCategoryFormData(payload);
    return apiFetch<Category>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: formData,
    });
  },

  async deleteCategory(id: string): Promise<Category> {
    return apiFetch<Category>(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
  },

  async restoreCategory(id: string): Promise<Category> {
    return apiFetch<Category>(`/admin/categories/${id}/restore`, {
      method: 'PATCH',
    });
  },

  async getBanners(params: BannerQueryParams = {}): Promise<BannerListResponse> {
    const query = new URLSearchParams();

    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
    if (params.sort) query.set('sort', params.sort);

    const qs = query.toString();
    return apiFetch<BannerListResponse>(`/admin/banners${qs ? `?${qs}` : ''}`);
  },

  async createBanner(payload: BannerFormPayload): Promise<Banner> {
    const formData = buildBannerFormData(payload);
    return apiFetch<Banner>('/admin/banners', {
      method: 'POST',
      body: formData,
    });
  },

  async updateBanner(id: string, payload: Partial<BannerFormPayload>): Promise<Banner> {
    const formData = buildBannerFormData(payload);
    return apiFetch<Banner>(`/admin/banners/${id}`, {
      method: 'PUT',
      body: formData,
    });
  },

  async deleteBanner(id: string): Promise<void> {
    return apiFetch<void>(`/admin/banners/${id}`, {
      method: 'DELETE',
    });
  },

  async getCoupons(params: CouponQueryParams = {}): Promise<CouponListResponse> {
  const query = new URLSearchParams();

  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
  if (params.sort) query.set('sort', params.sort);

  const qs = query.toString();
  return apiFetch<CouponListResponse>(`/admin/coupons${qs ? `?${qs}` : ''}`);
},

async createCoupon(payload: CouponFormPayload): Promise<Coupon> {
  return apiFetch<Coupon>('/admin/coupons', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
},

async updateCoupon(id: string, payload: Partial<CouponFormPayload>): Promise<Coupon> {
  return apiFetch<Coupon>(`/admin/coupons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
},

async deleteCoupon(id: string): Promise<void> {
  return apiFetch<void>(`/admin/coupons/${id}`, {
    method: 'DELETE',
  });
},

async reorderFeatured(orderedIds: string[]): Promise<Product[]> {
  return apiFetch<Product[]>('/admin/products/featured/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ orderedIds }),
  });
},

// --- Warranty ---
async createWarranty(payload: WarrantyFormPayload): Promise<Warranty> {
  return apiFetch<Warranty>('/admin/warranty', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
},

async getAllWarranty(params?: {
    page?: number;
    limit?: number;
}) {

    const query = new URLSearchParams();

    if (params?.page)
        query.set("page", String(params.page));

    if (params?.limit)
        query.set("limit", String(params.limit));

    return apiFetch<{
        items: Warranty[];
        pagination: {
            page: number;
            totalPages: number;
            totalItems: number;
            limit: number;
        };
    }>(`/admin/warranty?${query.toString()}`);

},

async searchWarrantyByPhone(phone: string): Promise<Warranty | null> {
  const res = await configuredFetch(
    `${API_BASE_URL}/admin/warranty/search?phone=${encodeURIComponent(phone)}`,
    { credentials: 'include' }
  );

  if (res.status === 404) return null;

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.message || `Request gagal (${res.status})`);
  }

  return (json?.data ?? json) as Warranty;
},

async updateWarranty(id: string, payload: Partial<WarrantyFormPayload>): Promise<Warranty> {
  return apiFetch<Warranty>(`/admin/warranty/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
},

// --- Homepage Content ---
async getHomepageContent(): Promise<HomepageContent> {
  return apiFetch<HomepageContent>('/admin/homepage');
},

async updateHomepageContent(form: HomepageFormState): Promise<HomepageContent> {
  const formData = buildHomepageFormData(form);
  return apiFetch<HomepageContent>('/admin/homepage', {
    method: 'PUT',
    body: formData,
  });
},

  async getProducts(
  params: ProductQueryParams = {}
): Promise<ProductListResponse> {

  const query = new URLSearchParams();

  if (params.page)
    query.set("page", String(params.page));

  if (params.limit)
    query.set("limit", String(params.limit));

  if (params.search)
    query.set("search", params.search);

  if (params.isActive !== undefined)
    query.set("isActive", String(params.isActive));

  if (params.sort)
    query.set("sort", params.sort);

  const qs = query.toString();

  return apiFetch<ProductListResponse>(
    `/admin/products${qs ? `?${qs}` : ""}`
  );

},
async getProductById(id: string): Promise<Product> {

  return apiFetch<Product>(
    `/admin/products/${id}`
  );

},
async bulkDeleteProducts(ids: string[]): Promise<void> {
    return apiFetch<void>('/admin/products', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
  },
  async createProduct(
  payload: ProductFormPayload
): Promise<Product> {

  const formData =
    buildProductFormData(payload);

  return apiFetch<Product>(
    "/admin/products",
    {
      method: "POST",
      body: formData,
    }
  );

},
  async updateProduct(
  id: string,
  payload: Partial<ProductFormPayload>
): Promise<Product> {

  const formData =
    buildProductFormData(payload);

  return apiFetch<Product>(
    `/admin/products/${id}`,
    {
      method: "PUT",
      body: formData,
    }
  );

},
  async deleteProduct(
  id: string
): Promise<void> {

  return apiFetch<void>(
    `/admin/products/${id}/permanent`,
    {
      method: "DELETE",
    }
  );

},

  async getOrders(params: OrderQueryParams = {}): Promise<OrderListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.sort) query.set('sort', params.sort);
  if (params.shippingCostStatus) query.set('shippingCostStatus', params.shippingCostStatus);

  const qs = query.toString();
  return apiFetch<OrderListResponse>(`/admin/orders${qs ? `?${qs}` : ''}`);
},

async setOngkir(id: string, payload: { isCOD: boolean; shippingCost?: number }): Promise<Order> {
  return apiFetch<Order>(`/admin/orders/${id}/ongkir`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
},

async generateCheckoutLink(id: string): Promise<{ link: string; token: string; expiry: string }> {
  return apiFetch<{ link: string; token: string; expiry: string }>(`/admin/orders/${id}/generate-link`, {
    method: 'POST',
  });
},

  async getOrderById(id: string): Promise<Order> {
    return apiFetch<Order>(`/admin/orders/${id}`);
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    return apiFetch<Order>(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async updateOrderPaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Order> {
    return apiFetch<Order>(`/admin/orders/${id}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus }),
    });
  },

  async updateOrderShippingStatus(id: string, shippingStatus: ShippingStatus): Promise<Order> {
    return apiFetch<Order>(`/admin/orders/${id}/shipping`, {
      method: 'PATCH',
      body: JSON.stringify({ shippingStatus }),
    });
  },

  async cancelOrder(id: string): Promise<Order> {
    return apiFetch<Order>(`/admin/orders/${id}/cancel`, {
      method: 'PATCH',
    });
  },

  async getCustomers(): Promise<Customer[]> {
    throw new Error('Belum disambungkan ke backend — customer = User dengan role user?');
  },
  async getCustomerOrders(_customerId: string): Promise<Order[]> {
    throw new Error('Belum disambungkan ke backend');
  },
  async createCustomer(_cust: Partial<Customer>): Promise<Customer> {
    throw new Error('Belum disambungkan ke backend');
  },

  async getAdmins(): Promise<Admin[]> {
    throw new Error('Belum disambungkan ke backend');
  },
  async createAdmin(_admin: Partial<Admin>): Promise<Admin> {
    throw new Error('Belum disambungkan ke backend');
  },

  async getInventoryHistory(): Promise<InventoryHistory[]> {
    throw new Error('Belum disambungkan ke backend — apakah ada inventory history di product model?');
  },
  async restockProduct(_productId: string, _changeType: 'restock' | 'adjustment' | 'return', _quantity: number, _note: string): Promise<void> {
    throw new Error('Belum disambungkan ke backend');
  },
  async removeProductImage(id: string, index: number): Promise<Product> {
    return apiFetch<Product>(
      `/admin/products/${id}/images/${index}`,
      {
        method: 'DELETE',
      }
  );
},
async removeProductVideo(id: string): Promise<Product> {
  return apiFetch<Product>(
    `/admin/products/${id}/video`,
    {
      method: 'DELETE',
    }
  );
},
async setProductThumbnail(id: string, image: string): Promise<Product> {
  return apiFetch<Product>(
    `/admin/products/${id}/thumbnail/${encodeURIComponent(image)}`,
    {
      method: "PATCH",
    }
  );
},
async reorderProductImages(id: string, images: string[]): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${id}/images/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ images }),
  });
},

async setVariantImage(productId: string, variantIndex: number, file: File): Promise<Product> {
  const formData = new FormData();
  formData.append('images', file);
  return apiFetch<Product>(`/admin/products/${productId}/variants/${variantIndex}/image`, {
    method: 'POST',
    body: formData,
  });
},

async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/admin/change-password', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword }),
  });
},

async removeVariantImage(productId: string, variantIndex: number): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${productId}/variants/${variantIndex}/image`, {
    method: 'DELETE',
  });
},

async toggleFeatured(id: string): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${id}/featured`, {
    method: 'PATCH',
  });
},
};
