export interface ProductWebsite {
  line: string;
  comfort: string;
  material: string;
  badge: string;
  hoverImage: string;
  highlights: string[];
  sizes: string[];
  configurations: string[];
  details?: {
    sizeTitle?: string;
    sizeContent?: string;
    careTitle?: string;
    careContent?: string;
    shippingTitle?: string;
    shippingContent?: string;
  };
  addOns?: { name: string; price: number; image: string; sizes: string[] }[];
}
// ===== Types for E-Commerce Admin Dashboard =====

// ---- Product & Category (sudah sesuai backend) ----

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListResponse {
  items: Category[];
  pagination: PaginationInfo;
}

export interface CategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sort?: string;
}

export interface CategoryFormPayload {
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  image: File | null;
}

export interface Banner {
  _id: string;
  image: string;
  link: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BannerListResponse {
  items: Banner[];
  pagination: PaginationInfo;
}

export interface BannerQueryParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  sort?: string;
}

export interface BannerFormPayload {
  link: string;
  sortOrder: number;
  isActive: boolean;
  image: File | null;
}

// ---- Garansi ----

export type WarrantyStatus = 'active' | 'expired' | 'claimed' | 'void';

export interface Warranty {
  _id: string;
  phone: string;
  customerName: string;
  address: string;
  productName: string;
  variant: string;
  purchaseDate: string;
  warrantyStart: string;
  warrantyEnd: string;
  status: WarrantyStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyFormPayload {
  phone: string;
  customerName: string;
  address: string;
  productName: string;
  variant: string;
  purchaseDate: string;
  warrantyStart: string;
  warrantyEnd: string;
  status: WarrantyStatus;
  notes: string;
}

// ---- Homepage Content ----

// ---- Homepage Content ----

export interface HomepageHero {
  badge: string;
  title: string;
  description: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  smallText: string;
  image: string;
  video: string;
}

export interface HomepageBestseller {
  eyebrow: string;
  title: string;
  viewAllText: string;
  viewAllLink: string;
}

export interface HomepageFlashDeals {
  eyebrow: string;
  title: string;
  viewAllText: string;
  viewAllLink: string;
}

export interface HomepagePromoCards {
  eyebrow: string;
  title: string;
  viewAllText: string;
  viewAllLink: string;
}

export interface HomepagePromoStrip {
  eyebrow: string;
  text: string;
  ctaText: string;
  ctaLink: string;
}

export interface HomepageCollectionItem {
  title: string;
  subtitle: string;
  link: string;
  image: string;
}

export interface HomepageCollectionSection {
  label: string;
  title: string;
  viewAllText: string;
  viewAllLink: string;
  items: HomepageCollectionItem[];
}

export interface HomepageCraftItem {
  number: string;
  title: string;
  description: string;
}

export interface HomepageCraftsmanship {
  label: string;
  title: string;
  intro: string;
  items: HomepageCraftItem[];
  image: string;
}

export interface HomepageTestimonial {
  quote: string;
  name: string;
  location: string;
  rating: number;
}

export interface HomepageTestimonialSection {
  label: string;
  title: string;
  testimonials: HomepageTestimonial[];
}

export interface HomepageNewsletter {
  label: string;
  title: string;
  buttonText: string;
  disclaimer: string;
}

export interface HomepageContent {
  hero: HomepageHero;
  collection: HomepageCollectionSection;
  bestseller: HomepageBestseller;
  flashDeals: HomepageFlashDeals;
  promoStrip: HomepagePromoStrip;
  promoCards: HomepagePromoCards;
  craftsmanship: HomepageCraftsmanship;
  testimonials: HomepageTestimonialSection;
  newsletter: HomepageNewsletter;
  updatedAt?: string;
}

export interface HomepageFormState {
  hero: Omit<HomepageHero, 'image' | 'video'> & { image: string | File; video: string | File };
  collection: HomepageCollectionSection;
  bestseller: HomepageBestseller;
  flashDeals: HomepageFlashDeals;
  promoStrip: HomepagePromoStrip;
  promoCards: HomepagePromoCards;
  craftsmanship: Omit<HomepageCraftsmanship, 'image'> & { image: string | File };
  testimonials: HomepageTestimonialSection;
  newsletter: HomepageNewsletter;
}
export interface Coupon {
  _id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  isPopup?: boolean;
label?: string;
  minimumPurchase: number;
  maximumDiscount: number;
  usageLimit: number;
  usedCount: number;
  usagePerUser: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponListResponse {
  items: Coupon[];
  pagination: PaginationInfo;
}

export interface CouponQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sort?: string;
}

export interface CouponFormPayload {
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minimumPurchase: number;
  maximumDiscount: number;
  usageLimit: number;
  usagePerUser: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isPopup: boolean;   // ← tambahin
  label: string;      // ← tambahin
}

export interface ProductSize {
  name: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
}

export interface ProductVariant {
  _id?: string;      // TAMBAH — ada kalau sudah tersimpan di DB, undefined kalau baru
  name: string;
  sku: string;
  price: number | null;
  stock: number | null;
  sizes: ProductSize[];
  isActive: boolean;
  image: string;
  imageKey: string;


}

export interface Product {
  website?: ProductWebsite;
  _id: string;
  name: string;
  slug: string;
  category: Category;
  description: string;
  images: string[];
  thumbnail: string;
  video: string;
  price: number | null;
  stock: number | null;
  sku: string;
  variants: ProductVariant[];
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  isActive: boolean;
  isFeatured: boolean;
featuredOrder: number;
weight?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ProductListResponse {
  items: Product[];
  pagination: PaginationInfo;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sort?: string;
}

// PATCH untuk types.ts
// Ganti interface ProductFormPayload dengan yang ini:

export interface ProductFormPayload {
  website?: ProductWebsite;
  name: string;
  description: string;
  category: string;

  sku: string;

  price: number | null;
  stock: number | null;

  variants: ProductVariant[];

  isActive: boolean;

  images: File[];
  hoverImage?: File | null;
  imageOrder?: string[]; // <-- TAMBAHAN: urutan existing images setelah drag-drop
  video: File | null;
  weight?: number;

}

// ---- Order (sudah sesuai backend) ----

export interface OrderItem {
  product: string;
  name: string;
  thumbnail: string;
  variant: string;
  size: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city?: string;
  province?: string;
  postalCode?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
export type PaymentStatus = 'paid' | 'pending' | 'failed';
export type ShippingStatus = 'unfulfilled' | 'shipped' | 'delivered';

export interface Order {
  _id: string;
  orderNumber: string;
  customer: string | null;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  paymentMethod: string;
  shippingAddress: ShippingAddress;
  notes?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  shippingCostStatus: 'pending_ongkir' | 'settled' | null;
  isCOD: boolean;
  checkoutToken: string | null;
  checkoutTokenExpiry: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  items: Order[];
  pagination: PaginationInfo;
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  sort?: string;
  shippingCostStatus?: 'pending_ongkir' | 'settled';
}

// ---- Belum disambungkan ke backend (masih placeholder lama) ----

export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  total_spending: number;
  total_orders: number;
  created_at: string;
}

export interface Admin {
  id: string;
  full_name: string;
  email: string;
  role: 'admin';
  status: 'active' | 'suspended';
  last_login: string | null;
  created_at: string;
}

export interface InventoryHistory {
  id: string;
  product_id: string;
  change_type: 'restock' | 'sale' | 'adjustment' | 'return';
  quantity_change: number;
  new_stock: number;
  note: string | null;
  created_at: string;
  product?: { id: string; name: string; images: string[] };
}

export interface ActivityLog {
  id: string;
  actor: string;
  action: string;
  entity_type: string | null;
  entity_name: string | null;
  created_at: string;
}
