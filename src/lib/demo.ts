import catalog from '../content/demo-catalog.json';
import defaults from '../content/defaults.json';
import fields from '../content/fields.json';

// Public demonstration only. Never falls back to demo after a real API error.
export const isDemo = !import.meta.env.VITE_API_BASE_URL?.trim() && import.meta.env.VITE_DEMO_MODE !== 'false';
const sessionKey = 'sleepndream-public-demo-session-v1';
const draftKey = 'sleepndream-public-demo-draft-v1';
const user = { id: 'demo-admin', email: 'admin@sleepndream.com', role: 'admin' };
const timestamp = new Date().toISOString();
const categories = [...new Set(catalog.map(p => p.line))].map((name, i) => ({
  _id: `demo-category-${i}`, name, slug: `demo-category-${i}`, description: 'Koleksi contoh Sleep n Dream',
  image: '', isActive: true, sortOrder: i, createdAt: timestamp, updatedAt: timestamp,
}));
const products = catalog.map((p, i) => ({
  _id: `demo-product-${i}`, name: p.name, slug: p.slug, category: categories.find(c => c.name === p.line),
  description: p.description, thumbnail: p.image, images: [p.image], video: '', variants: [],
  price: p.numericPrice, minPrice: p.numericPrice, maxPrice: p.numericPrice, stock: 8 + i, totalStock: 8 + i,
  sku: `DEMO-${i + 1}`, weight: 20000, isActive: true, isFeatured: true, featuredOrder: i,
  createdAt: timestamp, updatedAt: timestamp,
  website: { line: p.line, comfort: p.comfort, material: '', badge: p.badge, hoverImage: p.image,
    highlights: p.highlights, sizes: p.sizes, configurations: p.configurations },
}));

export async function demoFetch(input: RequestInfo | URL, options: RequestInit = {}): Promise<Response> {
  const url = new URL(String(input), window.location.origin);
  const route = url.pathname.replace(/^.*?(?=\/(?:auth|admin)\/)/, '');
  const method = options.method || 'GET';
  const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
  const reply = (data: unknown, status = 200, message = '') => new Response(JSON.stringify({ success: status < 400, data, message }), { status, headers: { 'Content-Type': 'application/json' } });
  if (route === '/auth/admin/login') {
    if (body.email?.trim().toLowerCase() !== user.email || body.password !== 'Sleep n Dream@1234') return reply(null, 401, 'Email atau kata sandi demo salah.');
    sessionStorage.setItem(sessionKey, 'active');
    return reply({ user });
  }
  if (route === '/auth/logout') { sessionStorage.removeItem(sessionKey); return reply(null); }
  if (sessionStorage.getItem(sessionKey) !== 'active') return reply(null, 401, 'Silakan masuk ke demo.');
  if (route === '/auth/me') return reply(user);
  if (route.startsWith('/admin/website')) {
    let draft = { content: defaults, fields, revision: 0, publishedAt: null as string | null };
    try { const saved = localStorage.getItem(draftKey); if (saved) draft = { ...JSON.parse(saved), fields }; } catch { /* use clean defaults */ }
    if (route.endsWith('/media')) return reply(null, 400, 'Upload file belum tersedia di demo. Gunakan URL gambar untuk mencoba editor.');
    if (method !== 'GET') {
      if (body.revision !== draft.revision) return reply(null, 409, 'Draf berubah. Muat ulang sebelum menyimpan.');
      draft = { ...draft, content: body.content || draft.content, revision: draft.revision + 1,
        publishedAt: route.endsWith('/publish') ? new Date().toISOString() : draft.publishedAt };
      try { localStorage.setItem(draftKey, JSON.stringify(draft)); } catch { return reply(null, 400, 'Penyimpanan browser penuh atau tidak tersedia.'); }
    }
    return reply(draft);
  }
  if (method !== 'GET') return reply(null, 400, 'Demo pratinjau: perubahan ini belum tersedia. Editor Konten Website dapat dicoba dan disimpan di browser ini.');
  if (route === '/admin/dashboard') return reply({
    summary: { todayRevenue: 0, totalOrders: 0, todayOrders: 0, totalProducts: products.length, totalCustomers: 0, pendingOrders: 0, lowStock: 0 },
    salesChart: Array.from({ length: 7 }, (_, i) => { const date = new Date(); date.setDate(date.getDate() - 6 + i); return { date: date.toISOString().slice(0, 10), revenue: 0 }; }),
    orderStatus: ['pending', 'processing', 'completed', 'cancelled'].map(status => ({ status, count: 0 })),
    recentOrders: [], bestSellingProducts: [],
  });
  if (route === '/admin/warranty/search') return reply(null, 404, 'Belum ada garansi contoh.');
  const resources: Record<string, unknown[]> = { products, categories, orders: [], coupons: [], banners: [], warranty: [] };
  const [, , resource, id] = route.split('/');
  if (resource in resources) {
    let rows = resources[resource] as Array<Record<string, unknown>>;
    if (id) return reply(rows.find(row => row._id === id) || null, rows.some(row => row._id === id) ? 200 : 404);
    const search = url.searchParams.get('search')?.toLowerCase();
    if (search) rows = rows.filter(row => String(row.name || row.code || '').toLowerCase().includes(search));
    const active = url.searchParams.get('isActive');
    if (active) rows = rows.filter(row => row.isActive === (active === 'true'));
    const limit = Math.max(1, Number(url.searchParams.get('limit')) || 20);
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    return reply({ items: rows.slice((page - 1) * limit, page * limit), pagination: { page, limit, totalItems: rows.length, totalPages: Math.max(1, Math.ceil(rows.length / limit)) } });
  }
  return reply(null, 404, 'Fitur ini belum tersedia di demo.');
}
