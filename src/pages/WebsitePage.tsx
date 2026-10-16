import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, Save, Upload, Globe, Search, Eye } from 'lucide-react';
import { fieldLabel, sectionHelp } from '../lib/website-editor';
import defaults from '../content/defaults.json';
import defaultFields from '../content/fields.json';
import { websiteApi, type Content, type Field } from '../lib/website';

const GROUPS: Record<string, string> = {
  Home: 'Susunan beranda & banner', Hero: 'Pembuka website', OurSignature: 'Signature Collection',
  FeaturedCategory: 'Best Sellers', AccessoriesCarousel: 'Accessories', StoreGallery: 'Galeri & toko',
  NewsletterBenefits: 'Why Sleep n Dream', VideoSection: 'Dr. Spine', SleepNDreamSocials: 'Instagram',
  AboutUs: 'About Sleep n Dream', Navbar: 'Navigasi & menu', Footer: 'Bagian bawah website', SocialFloat: 'Tombol WhatsApp',
  ProductCatalog: 'Halaman katalog', Site: 'SEO website',
};
const LABELS: Record<string, string> = { image:'Gambar', src:'Media', href:'Tujuan saat diklik', map:'Google Maps', title:'Judul', name:'Nama', description:'Deskripsi', body:'Paragraf', heading:'Judul', eyebrow:'Teks kecil', cta:'Teks tombol', ctaLabel:'Teks tombol', ctaHref:'Tautan tombol', alt:'Deskripsi gambar', imageAlt:'Deskripsi gambar', visible:'Tampilkan di website', price:'Harga', sizes:'Pilihan ukuran', icon:'Ikon', video:'Video', groups:'Kelompok menu', photos:'Kartu menu', items:'Daftar', label:'Label', tag:'Label kecil', wa:'Tautan WhatsApp', ig:'Tautan Instagram', em:'Alamat email (mailto:)', color:'Kode warna', text:'Isi tulisan', subtitle:'Subjudul', intro:'Paragraf pembuka', caption:'Keterangan', url:'Alamat tujuan', city:'Kota', address:'Alamat toko', phone:'Nomor telepon' };
const inputClass = 'w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-200';

function ContentField({ value, template, label, onChange, path, disabled, fixed = false, minItems = 0 }: {
  value: unknown; template: unknown; label: string; onChange: (value: unknown) => void; path: string; disabled: boolean; fixed?: boolean; minItems?: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [failedPreview, setFailedPreview] = useState('');
  const last = path.split('.').pop() || '';
  if (Array.isArray(value)) {
    const samples = Array.isArray(template) ? template : [];
    const sections = path === 'Home.sections';
    const immutableLength = fixed || sections || path.includes('MEGA_MENU_DATA');
    const move = (i: number, by: number) => { const next = [...value]; [next[i], next[i+by]] = [next[i+by], next[i]]; onChange(next); };
    return <div className="space-y-3"><p className="text-sm font-medium text-stone-700">{label} <span className="text-stone-400">({value.length})</span></p>
      {value.map((item, i) => <details key={i} open={sections || undefined} className="rounded-xl border border-stone-200 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-stone-800">{sections ? (GROUPS[(item as {id:string}).id] || ({StoryBanner:'Banner cerita',MorningBanner:'Banner promosi'} as Record<string,string>)[(item as {id:string}).id]) : (typeof item === 'object' && item ? String((item as Content).name || (item as Content).title || (item as Content).label || `Kartu ${i+1}`) : `Pilihan ${i+1}`)}</summary><div className="mt-4">
        <div className="mb-3 flex items-center justify-between gap-2"><span className="text-xs font-semibold text-stone-500">{i+1}. {sections ? ({StoryBanner:'Banner cerita',MorningBanner:'Banner promosi'} as Record<string,string>)[(item as {id:string}).id] || GROUPS[(item as {id:string}).id] || (item as {id:string}).id : 'Atur kartu'}</span><div className="flex gap-1">
          <button type="button" aria-label={`Naikkan item ${i+1}`} disabled={disabled || i===0} onClick={()=>move(i,-1)} className="p-2 disabled:opacity-25"><ArrowUp size={15}/></button>
          <button type="button" aria-label={`Turunkan item ${i+1}`} disabled={disabled || i===value.length-1} onClick={()=>move(i,1)} className="p-2 disabled:opacity-25"><ArrowDown size={15}/></button>
          {!immutableLength && <button type="button" aria-label={`Hapus item ${i+1}`} disabled={disabled || value.length<=minItems} onClick={()=>onChange(value.filter((_,j)=>j!==i))} className="p-2 text-red-600 disabled:opacity-25"><Trash2 size={15}/></button>}
        </div></div>
        <ContentField value={item} template={samples[Math.min(i,samples.length-1)]} label="" path={`${path}.${i}`} disabled={disabled} onChange={next=>onChange(value.map((v,j)=>j===i?next:v))}/>
      </div></details>)}
      {!immutableLength && samples.length>0 && <button type="button" disabled={disabled || value.length>=100} className="flex items-center gap-2 text-sm text-brand-700" onClick={()=>{const sample=structuredClone(samples[0]);if(sample && typeof sample==='object' && 'id' in sample) sample.id=typeof sample.id==='number'?Date.now():crypto.randomUUID();onChange([...value,sample]);}}><Plus size={16}/>Tambah item</button>}
    </div>;
  }
  if (value !== null && typeof value === 'object') {
    const object = value as Content; const sample = template as Content | undefined;
    return <div className="space-y-4">{label && <p className="text-sm font-medium text-stone-700">{label}</p>}{Object.entries(object).filter(([k])=>!['id','direction','copyIndex','uniqueKey'].includes(k)).map(([k,v])=><ContentField key={k} path={`${path}.${k}`} label={LABELS[k] || k} value={v} template={sample?.[k]} disabled={disabled} onChange={next=>onChange({...object,[k]:next})}/>)}</div>;
  }
  if (typeof value === 'boolean') return <label className="flex items-center gap-2 text-sm text-stone-700"><input type="checkbox" checked={value} disabled={disabled} onChange={e=>onChange(e.target.checked)} className="accent-brand-600"/>{label}</label>;
  const text = String(value ?? '');
  const media = /(?:image|src|poster|video)/i.test(last) || (last === 'icon' && /^(https?:\/\/|\/)/.test(text)) || /\.(?:png|jpg|jpeg|webp|mp4|webm)(?:\?|$)/i.test(text);
  const video = /video/i.test(last) || /\.(mp4|webm|mov)/i.test(text);
  const long = !media && (text.length > 110 || /description|body|intro/i.test(last));
  const isLink = /href|map|url|wa|ig|em/i.test(last) && !media;
  const preview = /^https?:\/\//.test(text) ? text : `${import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:3000'}${text}`;
  return <div className="space-y-1.5"><label className="block text-xs font-medium text-stone-600" htmlFor={path}>{label}</label>
    {long ? <textarea id={path} rows={3} className={inputClass} value={text} disabled={disabled} onChange={e=>onChange(e.target.value)}/> : <input id={path} type={typeof value==='number'?'number':'text'} className={inputClass} value={text} disabled={disabled} onChange={e=>onChange(typeof value==='number'?Number(e.target.value):e.target.value)}/>}
    {isLink && <p className="text-xs leading-5 text-stone-500">Halaman website: /collection. Website lain: https://contoh.com</p>}
    {media && <div className="flex flex-wrap items-center gap-3 pt-2">
      {text && (failedPreview === preview ? <p className="rounded-lg bg-stone-50 p-4 text-xs text-stone-500">Pratinjau belum tersedia. Periksa alamat gambar atau unggah file baru.</p> : video ? <video src={preview} controls preload="none" className="aspect-video w-full max-w-sm rounded-xl bg-stone-100"/> : <img src={preview} onError={()=>setFailedPreview(preview)} alt="Pratinjau media" className="h-40 w-full max-w-sm rounded-xl border border-stone-100 bg-stone-50 object-contain"/>)}
      <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs ${disabled?'opacity-40':''}`}><Upload size={14}/>{uploading?'Mengunggah…':video?'Upload video':'Upload gambar'}<input type="file" className="sr-only" disabled={disabled || uploading} accept={video?'video/mp4,video/webm,video/quicktime':'image/jpeg,image/png,image/webp'} onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setUploading(true);setUploadError('');try{onChange((await websiteApi.upload(file)).url);}catch(err){setUploadError((err as Error).message);}finally{setUploading(false);e.target.value='';}}}/></label>
      {uploadError && <p role="alert" className="text-xs text-red-600">{uploadError}</p>}
    </div>}
  </div>;
}

export function WebsitePage({ preview = false }: { preview?: boolean }) {
  const [content,setContent] = useState<Content>(defaults);
  const [fields,setFields] = useState<Field[]>(defaultFields);
  const [revision,setRevision] = useState(0);
  const [group,setGroup] = useState('Home');
  const [search,setSearch] = useState('');
  const [loading,setLoading] = useState(!preview);
  const [ready,setReady] = useState(preview);
  const [busy,setBusy] = useState(false);
  const [dirty,setDirty] = useState(false);
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  const [publishedAt,setPublishedAt] = useState<string|null>(null);
  async function load() {setLoading(true);setError('');try{const d=await websiteApi.get();setContent(d.content);setFields(d.fields);setRevision(d.revision);setPublishedAt(d.publishedAt);setDirty(false);setReady(true);}catch(e){setError((e as Error).message);setReady(false);}finally{setLoading(false);}}
  useEffect(()=>{if(!preview)void load();},[preview]);
  useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
  async function save(publish = false) {setBusy(true);setMessage('');setError('');try{let rev=revision;if(dirty || !revision){const d=await websiteApi.save(content,revision);rev=d.revision;setRevision(rev);setDirty(false);}if(publish){const d=await websiteApi.publish(rev);setRevision(d.revision);setPublishedAt(d.publishedAt);}setMessage(publish?'Konten berhasil dipublikasikan. Muat ulang website untuk melihat perubahan.':'Draf tersimpan. Website publik belum berubah.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  const shown=fields.filter(f=>f.group !== 'ProductDetail' && (search?`${GROUPS[f.group]} ${fieldLabel(f)} ${f.label}`.toLowerCase().includes(search.toLowerCase()):f.group===group));
  return <div className="mx-auto max-w-7xl space-y-5 text-stone-800">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-semibold">Kelola Website Sleep n Dream</h2><p className="mt-1 text-sm text-stone-500">Pilih bagian website, ubah isinya, lalu tampilkan perubahan saat sudah siap.</p></div><a target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-brand-700" href={import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:3000'}><Eye size={17}/>Lihat website</a></div>
    {preview && <p className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm">Pratinjau editor. Perubahan di sini hanya untuk mencoba tampilan, belum disimpan atau dipublikasikan. Login admin diperlukan untuk mengelola website.</p>}
    <div className="grid gap-3 rounded-2xl bg-brand-50 p-4 text-sm text-brand-800 sm:grid-cols-3"><p><strong>1. Pilih bagian</strong><br/><span className="text-xs">Pilih bagian website dari daftar di bawah.</span></p><p><strong>2. Edit & simpan draf</strong><br/><span className="text-xs">Simpan pekerjaan tanpa mengubah website.</span></p><p><strong>3. Publikasikan</strong><br/><span className="text-xs">Tampilkan semua perubahan kepada pengunjung.</span></p></div>
    <div className="sticky top-16 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"><div className="text-xs text-stone-500">{dirty?'Ada perubahan belum disimpan':publishedAt?`Publikasi terakhir: ${new Date(publishedAt).toLocaleString('id-ID')}`:'Belum dipublikasikan'}</div><div className="flex gap-2"><button disabled={preview||!ready||busy||loading||!dirty} onClick={()=>save()} className="flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm disabled:opacity-40"><Save size={16}/>Simpan draf</button><button disabled={preview||!ready||busy||loading} onClick={()=>{if(window.confirm('Tampilkan semua perubahan draf di website? Perubahan akan terlihat oleh pengunjung.'))void save(true);}} className="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm text-white disabled:opacity-40"><Globe size={16}/>{busy?'Menyimpan…':'Publikasikan'}</button></div></div>
    {error && <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error} <button className="ml-3 underline" onClick={()=>{if(!dirty||window.confirm('Muat ulang dan buang perubahan yang belum disimpan?'))void load();}}>Muat ulang</button></div>}
    {message && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>}
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[235px_minmax(0,1fr)]"><aside className="min-w-0 space-y-3"><div className="relative"><Search className="absolute left-3 top-3 text-stone-400" size={16}/><input aria-label="Cari konten" className={`${inputClass} pl-9`} placeholder="Cari konten…" value={search} onChange={e=>setSearch(e.target.value)}/></div><nav className="flex gap-1 overflow-x-auto lg:flex-col">{Object.entries(GROUPS).map(([id,title])=><button key={id} onClick={()=>{setGroup(id);setSearch('');}} className={`whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm ${group===id?'bg-brand-100 font-medium text-brand-800':'text-stone-500 hover:bg-stone-100'}`}>{title}</button>)}</nav></aside>
      <div className="min-w-0 space-y-5">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{search ? 'Hasil pencarian' : 'Bagian yang sedang diedit'}</p>
          <h3 className="mt-2 text-xl font-semibold">{search ? search : GROUPS[group]}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">{search ? 'Ubah kolom yang sesuai di bawah ini.' : sectionHelp[group]}</p>
        </section>
        {loading ? <p role="status">Memuat konten...</p> : <>
          {shown.filter(f=>f.kind!=='structured').length>0 && <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
            <h4 className="mb-5 text-base font-semibold">Tulisan, gambar & tombol</h4>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">{shown.filter(f=>f.kind!=='structured').map(f=><div key={f.key} className={String(content[f.key] ?? '').length>110?'xl:col-span-2':''}>
              <ContentField value={content[f.key]} template={(defaults as Content)[f.key]} label={fieldLabel(f)} path={f.key} disabled={busy||!ready} onChange={value=>{setContent(c=>({...c,[f.key]:value}));setDirty(true);setMessage('');}}/>
            </div>)}</div>
          </section>}
          {shown.filter(f=>f.kind==='structured').map(f=><section key={f.key} className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
            <h4 className="text-base font-semibold">{fieldLabel(f)}</h4>
            <p className="mb-5 mt-1 text-xs leading-5 text-stone-500">{f.key==='Home.sections'?'Gunakan panah untuk mengubah urutan. Centang bagian yang ingin ditampilkan.':'Klik nama kartu untuk mengedit isinya. Gunakan panah untuk mengubah urutan.'}</p>
            <ContentField value={content[f.key]} template={(defaults as Content)[f.key]} label="" path={f.key} disabled={busy||!ready} fixed={f.fixedLength} minItems={f.minItems} onChange={value=>{setContent(c=>({...c,[f.key]:value}));setDirty(true);setMessage('');}}/>
          </section>)}
          {!shown.length&&<p className="rounded-xl bg-white p-6 text-sm text-stone-500">Tidak ada hasil. Coba cari judul, gambar, atau nama bagian website.</p>}
        </>}
      </div>
    </div>
  </div>;
}
