import { useCallback, useEffect, useState } from 'react';
import {
  ChevronDown, Save, Plus, Trash2, Sparkles, LayoutGrid,
  Hammer, Quote, Mail, Tag, Zap, AlignLeft, Grid2X2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FileUpload } from '../components/ui/FileUpload';
import { useToast } from '../contexts/ToastContext';
import { api } from '../lib/api';
import type { HomepageFormState } from '../lib/types';


const DEFAULT_CONTENT: HomepageFormState = {
  hero: {
    badge: 'Koleksi Sleep n Dream',
    title: 'Cara yang lebih tenang mengakhiri hari.',
    description: 'Bed dan kasur premium yang lahir dari keyakinan bahwa kenyamanan sejati bersifat tenang — material jujur, tangan yang tidak tergesa, dan ruang yang benar-benar mengistirahatkan Anda.',
    primaryCtaText: 'Jelajahi Koleksi',
    primaryCtaLink: '/shop',
    secondaryCtaText: 'Kenali Cerita Kami',
    secondaryCtaLink: '/about',
    smallText: 'Sleep n Dream — Comfort for Better Sleep',
    image: '',
    video: '',
  },
  collection: {
    label: 'Koleksi',
    title: 'Temukan ruang istirahat Anda.',
    viewAllText: 'Semua Kategori',
    viewAllLink: '/shop',
    items: [],
  },
  bestseller: {
    eyebrow: 'Paling Dicari',
    title: 'Pilihan terbaik, menurut mereka.',
    viewAllText: 'Lihat Semua',
    viewAllLink: '/shop',
  },
  promoCards: {
    eyebrow: 'Koleksi Terpilih',
    title: 'Kesempurnaan di setiap sisi ruangan.',
    viewAllText: 'Lihat Semua',
    viewAllLink: '/shop',
  },
  flashDeals: {
    eyebrow: 'Diskon Sleep n Dream',
    title: 'Temuan diskon terbaik untuk Anda.',
    viewAllText: 'Lihat Semua',
    viewAllLink: '/shop',
  },
  promoStrip: {
    eyebrow: 'Penawaran Aktif',
    text: 'Temukan koleksi pilihan Sleep n Dream untuk kenyamanan istirahat Anda.',
    ctaText: 'Belanja Sekarang',
    ctaLink: '/shop',
  },
  craftsmanship: {
    label: 'Pengerjaan',
    title: 'Dibuat perlahan, agar Anda dapat hidup perlahan.',
    intro: 'Setiap karya Sleep n Dream dimulai dari sebuah gambar dan diakhiri dengan tanda tangan. Di antara keduanya, berminggu-minggu pekerjaan yang terukur — tanpa jahitan yang terburu, tanpa material yang disembunyikan, tanpa jalan pintas.',
    items: [],
    image: '',
  },
  testimonials: {
    label: 'Dari Rumah Sleep n Dream',
    title: 'Suara dari mereka yang tidur di dalamnya.',
    testimonials: [],
  },
  newsletter: {
    label: 'Surat Berkala',
    title: 'Surat sesekali tentang istirahat, ruang, dan pembuatan karya yang tenang.',
    buttonText: 'Berlangganan',
    disclaimer: 'Tidak lebih dari sekali sebulan. Berhenti langganan kapan saja.',
  },
};

function TextAreaField({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
      />
    </div>
  );
}

function ImageField({ label, value, onChange }: { label: string; value: string | File; onChange: (v: string | File) => void }) {
  const isFile = value instanceof File;
  return (
    <FileUpload
      type="image"
      label={label}
      multiple={false}
      files={isFile ? [value as File] : []}
      onFilesChange={(files) => onChange(files[0] ?? (isFile ? '' : value))}
      existing={!isFile && value ? [value as string] : []}
    />
  );
}

interface SectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  active: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ icon, title, subtitle, active, onToggle, children }: SectionProps) {
  return (
    <Card className="p-0 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 shrink-0">
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
            <p className="text-xs text-gray-400">{subtitle}</p>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform shrink-0 ${active ? 'rotate-180' : ''}`} />
      </button>
      {active && (
        <div className="px-5 pb-5 pt-4 space-y-4 border-t border-gray-100 dark:border-gray-800">
          {children}
        </div>
      )}
    </Card>
  );
}

export function Homepage() {
  const { toast } = useToast();
  const [form, setForm] = useState<HomepageFormState>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>('hero');

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getHomepageContent();
      const normalized = {
        ...result,
        hero: {
          ...result.hero,
          image: result.hero?.image ?? '',
          video: result.hero?.video ?? '',
        },
        bestseller: result.bestseller ?? {
          eyebrow: 'Paling Dicari',
          title: 'Pilihan terbaik, menurut mereka.',
          viewAllText: 'Lihat Semua',
          viewAllLink: '/shop',
        },
        promoCards: result.promoCards ?? {
          eyebrow: 'Koleksi Terpilih',
          title: 'Kesempurnaan di setiap sisi ruangan.',
          viewAllText: 'Lihat Semua',
          viewAllLink: '/shop',
        },
        flashDeals: result.flashDeals ?? {
          eyebrow: 'Diskon Sleep n Dream',
          title: 'Temuan diskon terbaik untuk Anda.',
          viewAllText: 'Lihat Semua',
          viewAllLink: '/shop',
        },
        promoStrip: result.promoStrip ?? {
          eyebrow: 'Penawaran Aktif',
          text: 'Temukan koleksi pilihan Sleep n Dream untuk kenyamanan istirahat Anda.',
          ctaText: 'Belanja Sekarang',
          ctaLink: '/shop',
        },
      };
      setForm(normalized as unknown as HomepageFormState);
    } catch {
      toast('Belum ada konten tersimpan, menampilkan draf dari homepage saat ini', 'warning');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadContent(); }, [loadContent]);

  const toggleSection = (id: string) => setActiveSection((prev) => (prev === id ? null : id));

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const updated = await api.updateHomepageContent(form);
      setForm(updated as unknown as HomepageFormState);
      toast('Konten homepage berhasil disimpan', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal menyimpan konten homepage', 'error');
    } finally {
      setSaving(false);
    }
  }, [form, toast]);

  // ---- update helpers ----
  const updateHero = (patch: Partial<HomepageFormState['hero']>) =>
    setForm((f) => ({ ...f, hero: { ...f.hero, ...patch } }));

  const updateCollection = (patch: Partial<Omit<HomepageFormState['collection'], 'items'>>) =>
    setForm((f) => ({ ...f, collection: { ...f.collection, ...patch } }));

  const updateBestseller = (patch: Partial<HomepageFormState['bestseller']>) =>
    setForm((f) => ({ ...f, bestseller: { ...f.bestseller, ...patch } }));

  const updatePromoCards = (patch: Partial<HomepageFormState['promoCards']>) =>
    setForm((f) => ({ ...f, promoCards: { ...f.promoCards, ...patch } }));

  const updateFlashDeals = (patch: Partial<HomepageFormState['flashDeals']>) =>
    setForm((f) => ({ ...f, flashDeals: { ...f.flashDeals, ...patch } }));

  const updatePromoStrip = (patch: Partial<HomepageFormState['promoStrip']>) =>
    setForm((f) => ({ ...f, promoStrip: { ...f.promoStrip, ...patch } }));

  const updateCraftsmanshipMeta = (patch: Partial<Omit<HomepageFormState['craftsmanship'], 'items'>>) =>
    setForm((f) => ({ ...f, craftsmanship: { ...f.craftsmanship, ...patch } }));

  const updateCraftItem = (idx: number, patch: Partial<HomepageFormState['craftsmanship']['items'][number]>) =>
    setForm((f) => ({
      ...f,
      craftsmanship: {
        ...f.craftsmanship,
        items: f.craftsmanship.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
      },
    }));

  const updateTestimonialsMeta = (patch: Partial<Omit<HomepageFormState['testimonials'], 'testimonials'>>) =>
    setForm((f) => ({ ...f, testimonials: { ...f.testimonials, ...patch } }));

  const updateTestimonial = (idx: number, patch: Partial<HomepageFormState['testimonials']['testimonials'][number]>) =>
    setForm((f) => ({
      ...f,
      testimonials: {
        ...f.testimonials,
        testimonials: f.testimonials.testimonials.map((t, i) => (i === idx ? { ...t, ...patch } : t)),
      },
    }));

  const addTestimonial = () =>
    setForm((f) => ({
      ...f,
      testimonials: {
        ...f.testimonials,
        testimonials: [...f.testimonials.testimonials, { quote: '', name: '', location: '', rating: 5 }],
      },
    }));

  const removeTestimonial = (idx: number) =>
    setForm((f) => ({
      ...f,
      testimonials: { ...f.testimonials, testimonials: f.testimonials.testimonials.filter((_, i) => i !== idx) },
    }));

  const updateNewsletter = (patch: Partial<HomepageFormState['newsletter']>) =>
    setForm((f) => ({ ...f, newsletter: { ...f.newsletter, ...patch } }));

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 skeleton bg-gray-100 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ubah copywriting dan gambar di halaman utama. Navbar &amp; footer tidak termasuk di sini.
        </p>
      </div>

      {/* 1. Hero */}
      <Section id="hero" icon={<Sparkles className="h-4 w-4" />} title="Hero" subtitle="Banner utama paling atas" active={activeSection === 'hero'} onToggle={() => toggleSection('hero')}>
        <Input label="Badge Text" value={form.hero.badge} onChange={(e) => updateHero({ badge: e.target.value })} />
        <Input label="Judul" value={form.hero.title} onChange={(e) => updateHero({ title: e.target.value })} />
        <TextAreaField label="Deskripsi" value={form.hero.description} onChange={(v) => updateHero({ description: v })} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Teks Tombol Utama" value={form.hero.primaryCtaText} onChange={(e) => updateHero({ primaryCtaText: e.target.value })} />
          <Input label="Link Tombol Utama" value={form.hero.primaryCtaLink} onChange={(e) => updateHero({ primaryCtaLink: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Teks Tombol Kedua" value={form.hero.secondaryCtaText} onChange={(e) => updateHero({ secondaryCtaText: e.target.value })} />
          <Input label="Link Tombol Kedua" value={form.hero.secondaryCtaLink} onChange={(e) => updateHero({ secondaryCtaLink: e.target.value })} />
        </div>
        <Input label="Teks Kecil" value={form.hero.smallText} onChange={(e) => updateHero({ smallText: e.target.value })} />
        <FileUpload
          type="media"
          label="Gambar / Video Hero"
          multiple={false}
          files={
            form.hero.video instanceof File ? [form.hero.video] :
            form.hero.image instanceof File ? [form.hero.image] : []
          }
          onFilesChange={(files) => {
            const file = files[0];
            if (!file) { updateHero({ video: '', image: '' }); return; }
            if (file.type.startsWith('video/')) {
              updateHero({ video: file, image: '' });
            } else {
              updateHero({ image: file, video: '' });
            }
          }}
          existing={[
            ...(typeof form.hero.video === 'string' && form.hero.video ? [form.hero.video] : []),
            ...(typeof form.hero.image === 'string' && form.hero.image ? [form.hero.image] : []),
          ]}
        />
      </Section>

      {/* 2. Koleksi/Kategori */}
      <Section id="collection" icon={<LayoutGrid className="h-4 w-4" />} title="Grid Koleksi" subtitle="Label, judul, tombol lihat semua" active={activeSection === 'collection'} onToggle={() => toggleSection('collection')}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Label Section" value={form.collection.label} onChange={(e) => updateCollection({ label: e.target.value })} />
          <Input label="Judul Section" value={form.collection.title} onChange={(e) => updateCollection({ title: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label='Teks "Lihat Semua"' value={form.collection.viewAllText} onChange={(e) => updateCollection({ viewAllText: e.target.value })} />
          <Input label="Link Lihat Semua" value={form.collection.viewAllLink} onChange={(e) => updateCollection({ viewAllLink: e.target.value })} />
        </div>
      </Section>

      {/* 3. Bestseller */}
      <Section id="bestseller" icon={<Tag className="h-4 w-4" />} title="Produk Terlaris" subtitle='"Pilihan terbaik, menurut mereka"' active={activeSection === 'bestseller'} onToggle={() => toggleSection('bestseller')}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Eyebrow" value={form.bestseller.eyebrow} onChange={(e) => updateBestseller({ eyebrow: e.target.value })} />
          <Input label="Judul" value={form.bestseller.title} onChange={(e) => updateBestseller({ title: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label='Teks "Lihat Semua"' value={form.bestseller.viewAllText} onChange={(e) => updateBestseller({ viewAllText: e.target.value })} />
          <Input label="Link Lihat Semua" value={form.bestseller.viewAllLink} onChange={(e) => updateBestseller({ viewAllLink: e.target.value })} />
        </div>
      </Section>

      {/* 4. Koleksi Terpilih */}
      <Section id="promocards" icon={<Grid2X2 className="h-4 w-4" />} title="Koleksi Terpilih" subtitle='"Kesempurnaan di setiap sisi ruangan"' active={activeSection === 'promocards'} onToggle={() => toggleSection('promocards')}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Eyebrow" value={form.promoCards.eyebrow} onChange={(e) => updatePromoCards({ eyebrow: e.target.value })} />
          <Input label="Judul" value={form.promoCards.title} onChange={(e) => updatePromoCards({ title: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label='Teks "Lihat Semua"' value={form.promoCards.viewAllText} onChange={(e) => updatePromoCards({ viewAllText: e.target.value })} />
          <Input label="Link Lihat Semua" value={form.promoCards.viewAllLink} onChange={(e) => updatePromoCards({ viewAllLink: e.target.value })} />
        </div>
      </Section>

      {/* 5. Flash Deals */}
      <Section id="flashdeals" icon={<Zap className="h-4 w-4" />} title="Flash Deals" subtitle='"Temuan diskon terbaik"' active={activeSection === 'flashdeals'} onToggle={() => toggleSection('flashdeals')}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Eyebrow" value={form.flashDeals.eyebrow} onChange={(e) => updateFlashDeals({ eyebrow: e.target.value })} />
          <Input label="Judul" value={form.flashDeals.title} onChange={(e) => updateFlashDeals({ title: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label='Teks "Lihat Semua"' value={form.flashDeals.viewAllText} onChange={(e) => updateFlashDeals({ viewAllText: e.target.value })} />
          <Input label="Link Lihat Semua" value={form.flashDeals.viewAllLink} onChange={(e) => updateFlashDeals({ viewAllLink: e.target.value })} />
        </div>
      </Section>

      {/* 6. Promo Strip */}
      <Section id="promostrip" icon={<AlignLeft className="h-4 w-4" />} title="Promo Strip" subtitle="Banner penawaran aktif" active={activeSection === 'promostrip'} onToggle={() => toggleSection('promostrip')}>
        <Input label="Eyebrow" value={form.promoStrip.eyebrow} onChange={(e) => updatePromoStrip({ eyebrow: e.target.value })} />
        <TextAreaField label="Teks Penawaran" value={form.promoStrip.text} onChange={(v) => updatePromoStrip({ text: v })} rows={2} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Teks Tombol" value={form.promoStrip.ctaText} onChange={(e) => updatePromoStrip({ ctaText: e.target.value })} />
          <Input label="Link Tombol" value={form.promoStrip.ctaLink} onChange={(e) => updatePromoStrip({ ctaLink: e.target.value })} />
        </div>
      </Section>

      {/* 7. Craftsmanship */}
      <Section id="craftsmanship" icon={<Hammer className="h-4 w-4" />} title="Pengerjaan" subtitle="4 poin proses pembuatan" active={activeSection === 'craftsmanship'} onToggle={() => toggleSection('craftsmanship')}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Label" value={form.craftsmanship.label} onChange={(e) => updateCraftsmanshipMeta({ label: e.target.value })} />
          <Input label="Judul" value={form.craftsmanship.title} onChange={(e) => updateCraftsmanshipMeta({ title: e.target.value })} />
        </div>
        <TextAreaField label="Intro" value={form.craftsmanship.intro} onChange={(v) => updateCraftsmanshipMeta({ intro: v })} rows={3} />
        {form.craftsmanship.items.map((item, idx) => (
          <div key={idx} className="p-4 rounded-lg border border-gray-100 dark:border-gray-800 space-y-3">
            <div className="grid grid-cols-[80px_1fr] gap-4">
              <Input label="No." value={item.number} onChange={(e) => updateCraftItem(idx, { number: e.target.value })} />
              <Input label="Judul" value={item.title} onChange={(e) => updateCraftItem(idx, { title: e.target.value })} />
            </div>
            <Input label="Deskripsi" value={item.description} onChange={(e) => updateCraftItem(idx, { description: e.target.value })} />
          </div>
        ))}
        <ImageField label="Gambar" value={form.craftsmanship.image} onChange={(v) => updateCraftsmanshipMeta({ image: v })} />
      </Section>

      {/* 8. Testimoni */}
      <Section id="testimonials" icon={<Quote className="h-4 w-4" />} title="Testimoni" subtitle="Ulasan pelanggan" active={activeSection === 'testimonials'} onToggle={() => toggleSection('testimonials')}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Label" value={form.testimonials.label} onChange={(e) => updateTestimonialsMeta({ label: e.target.value })} />
          <Input label="Judul" value={form.testimonials.title} onChange={(e) => updateTestimonialsMeta({ title: e.target.value })} />
        </div>
        {form.testimonials.testimonials.map((t, idx) => (
          <div key={idx} className="p-4 rounded-lg border border-gray-100 dark:border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Testimoni {idx + 1}</p>
              <button type="button" onClick={() => removeTestimonial(idx)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <TextAreaField label="Kutipan" value={t.quote} onChange={(v) => updateTestimonial(idx, { quote: v })} rows={2} />
            <div className="grid grid-cols-3 gap-4">
              <Input label="Nama" value={t.name} onChange={(e) => updateTestimonial(idx, { name: e.target.value })} />
              <Input label="Lokasi" value={t.location} onChange={(e) => updateTestimonial(idx, { location: e.target.value })} />
              <Input type="number" label="Rating (1-5)" value={t.rating} onChange={(e) => updateTestimonial(idx, { rating: Number(e.target.value) || 5 })} />
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addTestimonial}>
          <Plus className="h-3.5 w-3.5" />
          Tambah Testimoni
        </Button>
      </Section>

      {/* 9. Newsletter */}
      <Section id="newsletter" icon={<Mail className="h-4 w-4" />} title="Newsletter" subtitle="Section berlangganan surat" active={activeSection === 'newsletter'} onToggle={() => toggleSection('newsletter')}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Label" value={form.newsletter.label} onChange={(e) => updateNewsletter({ label: e.target.value })} />
          <Input label="Teks Tombol" value={form.newsletter.buttonText} onChange={(e) => updateNewsletter({ buttonText: e.target.value })} />
        </div>
        <TextAreaField label="Judul" value={form.newsletter.title} onChange={(v) => updateNewsletter({ title: v })} rows={2} />
        <Input label="Disclaimer" value={form.newsletter.disclaimer} onChange={(e) => updateNewsletter({ disclaimer: e.target.value })} />
      </Section>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 border-t border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-4 lg:px-6 py-3 flex justify-end z-20">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
        </Button>
      </div>
    </div>
  );
}
